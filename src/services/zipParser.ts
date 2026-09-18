import JSZip from 'jszip';
import { ChatContact, ParsedWhatsAppExport } from '../types/chat';
import { parseChatText, getMimeTypeFromFilename } from './chatParser';

// In-memory cache for extracted media blob URLs
const mediaBlobUrlCache = new Map<string, string>();

// Store active chat JSZip instances for on-demand media loading
// Map of chatId -> { innerZip?: JSZip; directEntries?: Record<string, JSZip.JSZipObject> }
const activeChatZipHolders = new Map<string, {
  innerZip?: JSZip;
  entries: Record<string, JSZip.JSZipObject>;
}>();

export function clearMediaCache(): void {
  for (const url of mediaBlobUrlCache.values()) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }
  mediaBlobUrlCache.clear();
  activeChatZipHolders.clear();
}

// Lazy load media blob URL for a specific chat and file
export async function getMediaBlobUrl(chatId: string, fileName: string): Promise<string | null> {
  const cacheKey = `${chatId}::${fileName.toLowerCase()}`;
  if (mediaBlobUrlCache.has(cacheKey)) {
    return mediaBlobUrlCache.get(cacheKey)!;
  }

  const holder = activeChatZipHolders.get(chatId);
  if (!holder) return null;

  let zipObj: JSZip.JSZipObject | undefined = holder.entries[fileName.toLowerCase()];

  if (!zipObj) {
    // Try relaxed search (e.g. without extension or sanitized)
    const baseTarget = fileName.replace(/\.[^/.]+$/, "").toLowerCase();
    for (const [key, entry] of Object.entries(holder.entries)) {
      if (key.includes(baseTarget) || baseTarget.includes(key.replace(/\.[^/.]+$/, ""))) {
        zipObj = entry;
        break;
      }
    }
  }

  if (!zipObj) return null;

  try {
    const mimeType = getMimeTypeFromFilename(fileName);
    const blobData = await zipObj.async('blob');
    // Ensure correct MIME type for audio/opus/video
    const typedBlob = new Blob([blobData], { type: mimeType });
    const blobUrl = URL.createObjectURL(typedBlob);
    mediaBlobUrlCache.set(cacheKey, blobUrl);
    return blobUrl;
  } catch (err) {
    console.warn(`Failed to extract media for ${fileName}:`, err);
    return null;
  }
}

export interface ParseProgress {
  status: string;
  percent: number;
  currentChat?: string;
  totalChats?: number;
}

export async function parseWhatsAppZip(
  file: File,
  onProgress?: (p: ParseProgress) => void
): Promise<ParsedWhatsAppExport> {
  clearMediaCache();

  onProgress?.({ status: 'Opening zip archive...', percent: 5 });
  const masterZip = await JSZip.loadAsync(file);

  // Find all entries
  const allEntries: { path: string; entry: JSZip.JSZipObject }[] = [];
  masterZip.forEach((path, entry) => {
    if (!entry.dir && !path.startsWith('__MACOSX/') && !path.includes('/._')) {
      allEntries.push({ path, entry });
    }
  });

  // Check if this zip has nested chat zips (e.g. "whatsapp_exports/WhatsApp Chat with X.zip")
  const nestedZipEntries = allEntries.filter(e => e.path.toLowerCase().endsWith('.zip'));

  // Also check if there are direct text chat files (.txt)
  const directTextEntries = allEntries.filter(e => e.path.toLowerCase().endsWith('.txt'));

  const parsedChats: ChatContact[] = [];
  const senderFrequencies: Record<string, number> = {};

  if (nestedZipEntries.length > 0) {
    // Case 1: Multi-chat bundle (master export with nested zips)
    const total = nestedZipEntries.length;
    let completed = 0;

    for (const zipItem of nestedZipEntries) {
      const fileName = zipItem.path.split('/').pop() || zipItem.path;
      const chatTitle = fileName
        .replace(/\.zip$/i, '')
        .replace(/^WhatsApp Chat with\s+/i, '')
        .replace(/^WhatsApp Chat -\s+/i, '')
        .trim();

      const chatId = `chat-sub-${completed}-${chatTitle.replace(/\s+/g, '_')}`;

      onProgress?.({
        status: `Reading ${chatTitle}...`,
        percent: Math.round(5 + (completed / total) * 85),
        currentChat: chatTitle,
        totalChats: total
      });

      try {
        // Read inner zip bytes
        const innerZipBytes = await zipItem.entry.async('uint8array');
        const innerZip = await JSZip.loadAsync(innerZipBytes);

        let chatText = '';
        let txtItem: JSZip.JSZipObject | null = null;
        const mediaEntries: Record<string, JSZip.JSZipObject> = {};

        innerZip.forEach((relPath, item) => {
          if (!item.dir && !relPath.startsWith('__MACOSX/') && !relPath.includes('/._')) {
            const leafName = relPath.split('/').pop() || relPath;
            if (leafName.toLowerCase().endsWith('.txt')) {
              txtItem = item;
            } else {
              mediaEntries[leafName.toLowerCase()] = item;
            }
          }
        });

        if (txtItem) {
          chatText = await (txtItem as JSZip.JSZipObject).async('string');
        }

        if (chatText) {
          const { messages, participants } = parseChatText(chatId, chatText, chatTitle);

          // Update sender frequency to detect owner
          for (const p of participants) {
            senderFrequencies[p] = (senderFrequencies[p] || 0) + 1;
          }

          // Register holder for lazy media loading
          activeChatZipHolders.set(chatId, {
            innerZip,
            entries: mediaEntries
          });

          const isGroup = participants.length > 2 || chatTitle.includes('Group') || chatTitle.includes('Batch');

          parsedChats.push({
            id: chatId,
            name: chatTitle,
            isGroup,
            participants,
            messages,
            lastMessage: messages.length > 0 ? messages[messages.length - 1] : undefined,
            innerZipName: zipItem.path,
            mediaFiles: mediaEntries
          });
        }
      } catch (err) {
        console.warn(`Error parsing nested chat ${zipItem.path}:`, err);
      }

      completed++;
    }
  } else if (directTextEntries.length > 0) {
    // Case 2: Direct chat archive (single chat zip or folder)
    const mediaEntries: Record<string, JSZip.JSZipObject> = {};

    allEntries.forEach(e => {
      const leafName = e.path.split('/').pop() || e.path;
      if (!leafName.toLowerCase().endsWith('.txt')) {
        mediaEntries[leafName.toLowerCase()] = e.entry;
      }
    });

    let index = 0;
    for (const txtEntry of directTextEntries) {
      const fileName = txtEntry.path.split('/').pop() || txtEntry.path;
      const chatTitle = fileName
        .replace(/\.txt$/i, '')
        .replace(/^WhatsApp Chat with\s+/i, '')
        .replace(/^WhatsApp Chat -\s+/i, '')
        .trim();

      const chatId = `chat-dir-${index}-${chatTitle.replace(/\s+/g, '_')}`;
      const chatText = await txtEntry.entry.async('string');
      const { messages, participants } = parseChatText(chatId, chatText, chatTitle);

      for (const p of participants) {
        senderFrequencies[p] = (senderFrequencies[p] || 0) + 1;
      }

      activeChatZipHolders.set(chatId, {
        entries: mediaEntries
      });

      const isGroup = participants.length > 2 || chatTitle.includes('Group');

      parsedChats.push({
        id: chatId,
        name: chatTitle,
        isGroup,
        participants,
        messages,
        lastMessage: messages.length > 0 ? messages[messages.length - 1] : undefined,
        mediaFiles: mediaEntries
      });

      index++;
    }
  }

  // Detect owner (participant appearing across the most chats)
  let detectedOwnerName = 'You';
  let maxCount = 0;
  for (const [sender, count] of Object.entries(senderFrequencies)) {
    if (count > maxCount && sender.toLowerCase() !== 'system') {
      maxCount = count;
      detectedOwnerName = sender;
    }
  }

  // Re-flag messages with detected owner name as outgoing
  let totalMessages = 0;
  for (const chat of parsedChats) {
    totalMessages += chat.messages.length;
    for (const msg of chat.messages) {
      if (
        msg.sender.toLowerCase() === detectedOwnerName.toLowerCase() ||
        msg.sender.toLowerCase() === 'you'
      ) {
        msg.isOutgoing = true;
      } else {
        msg.isOutgoing = false;
      }
    }
    // Sort messages chronologically
    chat.messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    if (chat.messages.length > 0) {
      chat.lastMessage = chat.messages[chat.messages.length - 1];
    }
  }

  // Sort chats by most recent message timestamp
  parsedChats.sort((a, b) => {
    const timeA = a.lastMessage ? a.lastMessage.timestamp.getTime() : 0;
    const timeB = b.lastMessage ? b.lastMessage.timestamp.getTime() : 0;
    return timeB - timeA;
  });

  onProgress?.({ status: 'Ready!', percent: 100 });

  return {
    chats: parsedChats,
    detectedOwnerName,
    totalMessages
  };
}
