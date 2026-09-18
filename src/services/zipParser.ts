import JSZip from 'jszip';
import { get, set, del } from 'idb-keyval';
import { ChatContact, ParsedWhatsAppExport } from '../types/chat';
import { parseChatText, getMimeTypeFromFilename } from './chatParser';
import { getSavedMacZipHandle, readMacZipFile, verifyHandlePermission } from './fileStorage';
import { encryptWithActiveKey, decryptWithActiveKey, getSecurityConfig } from './crypto';

const CACHED_CHATS_KEY = 'wa_cached_chats_data_v1';

interface CachedChatsPayload {
  version: 2;
  isEncrypted: boolean;
  iv?: string;
  data?: string;
  chats?: any[];
  detectedOwnerName?: string;
  totalMessages?: number;
}

/**
 * Defend against Zip Slip, Directory Traversal, and Control Character Injections.
 * Strips directory prefixes ('../', '..\', absolute paths), null bytes, and control chars.
 */
export function sanitizeArchiveFileName(rawPath: string): string {
  if (!rawPath) return 'attachment';
  // Normalize Windows backslashes to forward slashes
  const normalized = rawPath.replace(/\\/g, '/');
  // Extract strictly the basename / leaf name
  const leaf = normalized.split('/').filter(Boolean).pop() || '';
  // Strip path traversal sequences, null bytes, and non-printable control characters
  const sanitized = leaf
    .replace(/\.\./g, '')
    .replace(/[\x00-\x1f\x7f]/g, '')
    .trim();

  return sanitized || 'attachment';
}

// In-memory cache for extracted media blob URLs
const mediaBlobUrlCache = new Map<string, string>();

// Store active chat JSZip instances for on-demand media loading
const activeChatZipHolders = new Map<string, {
  innerZip?: JSZip;
  entries: Record<string, JSZip.JSZipObject>;
}>();

let isReconnectingZip = false;

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

export async function saveCachedChats(data: ParsedWhatsAppExport): Promise<void> {
  try {
    const serializableChats = data.chats.map(c => ({
      ...c,
      mediaFiles: {}
    }));

    const plainPayload = JSON.stringify({
      chats: serializableChats,
      detectedOwnerName: data.detectedOwnerName,
      totalMessages: data.totalMessages
    });

    const secConfig = await getSecurityConfig();
    if (secConfig && secConfig.isConfigured) {
      const encrypted = await encryptWithActiveKey(plainPayload);
      if (encrypted) {
        await set(CACHED_CHATS_KEY, {
          version: 2,
          isEncrypted: true,
          iv: encrypted.iv,
          data: encrypted.ciphertext
        } as CachedChatsPayload);
        return;
      }
    }

    // Unencrypted cache fallback (only when security lock is not set)
    await set(CACHED_CHATS_KEY, {
      version: 2,
      isEncrypted: false,
      chats: serializableChats,
      detectedOwnerName: data.detectedOwnerName,
      totalMessages: data.totalMessages
    } as CachedChatsPayload);
  } catch (err) {
    console.warn('Failed to cache parsed chats in storage:', err);
  }
}

export async function getCachedChats(): Promise<ParsedWhatsAppExport | null> {
  try {
    const payload = await get<any>(CACHED_CHATS_KEY);
    if (!payload) return null;

    let exportData: ParsedWhatsAppExport | null = null;

    // Handle v2 encrypted payload
    if (payload.isEncrypted && payload.data && payload.iv) {
      const decryptedJson = await decryptWithActiveKey(payload.data, payload.iv);
      if (!decryptedJson) {
        // Locked session or key not yet derived - do not expose plaintext
        return null;
      }
      try {
        exportData = JSON.parse(decryptedJson);
      } catch {
        return null;
      }
    } else if (payload.chats) {
      // Unencrypted payload (v1 legacy or v2 unencrypted)
      exportData = payload as ParsedWhatsAppExport;
    }

    if (!exportData || !exportData.chats || exportData.chats.length === 0) {
      return null;
    }

    // Restore Date objects
    for (const chat of exportData.chats) {
      if (chat.lastMessage && chat.lastMessage.timestamp) {
        chat.lastMessage.timestamp = new Date(chat.lastMessage.timestamp);
      }
      for (const msg of chat.messages) {
        msg.timestamp = new Date(msg.timestamp);
      }
    }
    return exportData;
  } catch (err) {
    console.warn('Failed to load cached chats from storage:', err);
    return null;
  }
}

export async function clearCachedChats(): Promise<void> {
  await del(CACHED_CHATS_KEY);
  clearMediaCache();
}

// Reconnect zip media entries in the background after page reload
export async function ensureZipMediaConnected(file?: File): Promise<void> {
  if (activeChatZipHolders.size > 0 || isReconnectingZip) return;
  isReconnectingZip = true;

  try {
    let zipFile = file;
    if (!zipFile) {
      const handle = await getSavedMacZipHandle();
      if (handle && (await verifyHandlePermission(handle, false))) {
        zipFile = await readMacZipFile(handle);
      }
    }

    if (zipFile) {
      const masterZip = await JSZip.loadAsync(zipFile);
      const allEntries: { path: string; entry: JSZip.JSZipObject }[] = [];
      masterZip.forEach((path, entry) => {
        if (!entry.dir && !path.startsWith('__MACOSX/') && !path.includes('/._')) {
          allEntries.push({ path, entry });
        }
      });

      const nestedZipEntries = allEntries.filter(e => e.path.toLowerCase().endsWith('.zip'));
      const directTextEntries = allEntries.filter(e => e.path.toLowerCase().endsWith('.txt'));

      if (nestedZipEntries.length > 0) {
        let completed = 0;
        for (const zipItem of nestedZipEntries) {
          const fileName = sanitizeArchiveFileName(zipItem.path);
          const chatTitle = fileName
            .replace(/\.zip$/i, '')
            .replace(/^WhatsApp Chat with\s+/i, '')
            .replace(/^WhatsApp Chat -\s+/i, '')
            .trim();
          const chatId = `chat-sub-${completed}-${chatTitle.replace(/[^a-zA-Z0-9_\-]/g, '_')}`;

          try {
            const innerBytes = await zipItem.entry.async('uint8array');
            const innerZip = await JSZip.loadAsync(innerBytes);
            const mediaEntries: Record<string, JSZip.JSZipObject> = {};
            innerZip.forEach((relPath, item) => {
              if (!item.dir && !relPath.startsWith('__MACOSX/') && !relPath.includes('/._')) {
                const leafName = sanitizeArchiveFileName(relPath);
                if (!leafName.toLowerCase().endsWith('.txt')) {
                  mediaEntries[leafName.toLowerCase()] = item;
                }
              }
            });
            activeChatZipHolders.set(chatId, { innerZip, entries: mediaEntries });
          } catch {
            // ignore
          }
          completed++;
        }
      } else if (directTextEntries.length > 0) {
        const mediaEntries: Record<string, JSZip.JSZipObject> = {};
        allEntries.forEach(e => {
          const leafName = sanitizeArchiveFileName(e.path);
          if (!leafName.toLowerCase().endsWith('.txt')) {
            mediaEntries[leafName.toLowerCase()] = e.entry;
          }
        });
        let index = 0;
        for (const txtEntry of directTextEntries) {
          const fileName = sanitizeArchiveFileName(txtEntry.path);
          const chatTitle = fileName.replace(/\.txt$/i, '').replace(/^WhatsApp Chat with\s+/i, '').trim();
          const chatId = `chat-dir-${index}-${chatTitle.replace(/[^a-zA-Z0-9_\-]/g, '_')}`;
          activeChatZipHolders.set(chatId, { entries: mediaEntries });
          index++;
        }
      }
    }
  } catch (err) {
    console.warn('Could not reconnect zip media:', err);
  } finally {
    isReconnectingZip = false;
  }
}

// Lazy load media blob URL for a specific chat and file
export async function getMediaBlobUrl(chatId: string, fileName: string): Promise<string | null> {
  const safeFileName = sanitizeArchiveFileName(fileName);
  const cacheKey = `${chatId}::${safeFileName.toLowerCase()}`;
  if (mediaBlobUrlCache.has(cacheKey)) {
    return mediaBlobUrlCache.get(cacheKey)!;
  }

  let holder = activeChatZipHolders.get(chatId);
  if (!holder) {
    // Attempt auto-reconnect from saved Mac file handle
    await ensureZipMediaConnected();
    holder = activeChatZipHolders.get(chatId);
  }

  if (!holder) return null;

  let zipObj: JSZip.JSZipObject | undefined = holder.entries[safeFileName.toLowerCase()];

  if (!zipObj) {
    // Try relaxed search (e.g. without extension or sanitized)
    const baseTarget = safeFileName.replace(/\.[^/.]+$/, "").toLowerCase();
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

  const nestedZipEntries = allEntries.filter(e => e.path.toLowerCase().endsWith('.zip'));
  const directTextEntries = allEntries.filter(e => e.path.toLowerCase().endsWith('.txt'));

  const parsedChats: ChatContact[] = [];
  const senderFrequencies: Record<string, number> = {};

  if (nestedZipEntries.length > 0) {
    const total = nestedZipEntries.length;
    let completed = 0;

    for (const zipItem of nestedZipEntries) {
      const fileName = sanitizeArchiveFileName(zipItem.path);
      const chatTitle = fileName
        .replace(/\.zip$/i, '')
        .replace(/^WhatsApp Chat with\s+/i, '')
        .replace(/^WhatsApp Chat -\s+/i, '')
        .trim();

      const chatId = `chat-sub-${completed}-${chatTitle.replace(/[^a-zA-Z0-9_\-]/g, '_')}`;

      onProgress?.({
        status: `Reading ${chatTitle}...`,
        percent: Math.round(5 + (completed / total) * 85),
        currentChat: chatTitle,
        totalChats: total
      });

      try {
        const innerZipBytes = await zipItem.entry.async('uint8array');
        const innerZip = await JSZip.loadAsync(innerZipBytes);

        let chatText = '';
        let txtItem: JSZip.JSZipObject | null = null;
        const mediaEntries: Record<string, JSZip.JSZipObject> = {};

        innerZip.forEach((relPath, item) => {
          if (!item.dir && !relPath.startsWith('__MACOSX/') && !relPath.includes('/._')) {
            const leafName = sanitizeArchiveFileName(relPath);
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

          for (const p of participants) {
            senderFrequencies[p] = (senderFrequencies[p] || 0) + 1;
          }

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
    const mediaEntries: Record<string, JSZip.JSZipObject> = {};

    allEntries.forEach(e => {
      const leafName = sanitizeArchiveFileName(e.path);
      if (!leafName.toLowerCase().endsWith('.txt')) {
        mediaEntries[leafName.toLowerCase()] = e.entry;
      }
    });

    let index = 0;
    for (const txtEntry of directTextEntries) {
      const fileName = sanitizeArchiveFileName(txtEntry.path);
      const chatTitle = fileName
        .replace(/\.txt$/i, '')
        .replace(/^WhatsApp Chat with\s+/i, '')
        .replace(/^WhatsApp Chat -\s+/i, '')
        .trim();

      const chatId = `chat-dir-${index}-${chatTitle.replace(/[^a-zA-Z0-9_\-]/g, '_')}`;
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

  // Detect owner
  let detectedOwnerName = 'You';
  let maxCount = 0;
  for (const [sender, count] of Object.entries(senderFrequencies)) {
    if (count > maxCount && sender.toLowerCase() !== 'system') {
      maxCount = count;
      detectedOwnerName = sender;
    }
  }

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
    chat.messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    if (chat.messages.length > 0) {
      chat.lastMessage = chat.messages[chat.messages.length - 1];
    }
  }

  parsedChats.sort((a, b) => {
    const timeA = a.lastMessage ? a.lastMessage.timestamp.getTime() : 0;
    const timeB = b.lastMessage ? b.lastMessage.timestamp.getTime() : 0;
    return timeB - timeA;
  });

  onProgress?.({ status: 'Ready!', percent: 100 });

  const result: ParsedWhatsAppExport = {
    chats: parsedChats,
    detectedOwnerName,
    totalMessages
  };

  // Cache parsed chats in IndexedDB for instant reload on next visit/refresh
  await saveCachedChats(result);

  return result;
}
