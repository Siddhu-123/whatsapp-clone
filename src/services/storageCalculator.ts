import { ChatContact, ChatStorageStats, SearchableFileItem } from '../types/chat';

// Average estimated size per media type when raw zip header is not individually measured
const ESTIMATED_BYTES_PER_MEDIA: Record<string, number> = {
  image: 250 * 1024,      // 250 KB
  sticker: 50 * 1024,     // 50 KB
  video: 3.5 * 1024 * 1024, // 3.5 MB
  audio: 95 * 1024,       // 95 KB (compact Opus voice note)
  document: 600 * 1024    // 600 KB
};

export interface GlobalStorageSummary {
  chatStats: ChatStorageStats[];
  totalMessages: number;
  totalMediaFiles: number;
  totalTextBytes: number;
  totalEstimatedMediaBytes: number;
  breakdown: {
    images: number;
    videos: number;
    audios: number;
    documents: number;
  };
}

export function computeStorageStats(chats: ChatContact[]): GlobalStorageSummary {
  let totalMessages = 0;
  let totalMediaFiles = 0;
  let totalTextBytes = 0;
  let totalEstimatedMediaBytes = 0;

  const breakdown = {
    images: 0,
    videos: 0,
    audios: 0,
    documents: 0
  };

  const chatStats: ChatStorageStats[] = chats.map(chat => {
    let textBytes = 0;
    let imageCount = 0;
    let videoCount = 0;
    let audioCount = 0;
    let documentCount = 0;
    let mediaBytes = 0;

    for (const msg of chat.messages) {
      // Estimate text JSON overhead (sender, timestamp, text, metadata)
      textBytes += (msg.text?.length || 0) + 80;

      if (msg.attachment && !msg.attachment.isOmitted) {
        const type = msg.attachment.mediaType;
        const estSize = ESTIMATED_BYTES_PER_MEDIA[type] || 200 * 1024;
        mediaBytes += estSize;

        if (type === 'image' || type === 'sticker') {
          imageCount++;
          breakdown.images++;
        } else if (type === 'video') {
          videoCount++;
          breakdown.videos++;
        } else if (type === 'audio') {
          audioCount++;
          breakdown.audios++;
        } else if (type === 'document') {
          documentCount++;
          breakdown.documents++;
        }
      }
    }

    const totalChatMedia = imageCount + videoCount + audioCount + documentCount;
    totalMessages += chat.messages.length;
    totalMediaFiles += totalChatMedia;
    totalTextBytes += textBytes;
    totalEstimatedMediaBytes += mediaBytes;

    return {
      chatId: chat.id,
      chatName: chat.name,
      isGroup: chat.isGroup,
      messageCount: chat.messages.length,
      totalMediaCount: totalChatMedia,
      imageCount,
      videoCount,
      audioCount,
      documentCount,
      estimatedTextBytes: textBytes,
      estimatedMediaBytes: mediaBytes,
      lastActive: chat.lastMessage?.timestamp
    };
  });

  // Default sort: heaviest data footprint first (text + media)
  chatStats.sort((a, b) => {
    const totalA = a.estimatedTextBytes + a.estimatedMediaBytes;
    const totalB = b.estimatedTextBytes + b.estimatedMediaBytes;
    return totalB - totalA;
  });

  return {
    chatStats,
    totalMessages,
    totalMediaFiles,
    totalTextBytes,
    totalEstimatedMediaBytes,
    breakdown
  };
}

export function extractAllSearchableFiles(chats: ChatContact[]): SearchableFileItem[] {
  const files: SearchableFileItem[] = [];

  for (const chat of chats) {
    for (const msg of chat.messages) {
      if (msg.attachment && !msg.attachment.isOmitted && msg.attachment.fileName) {
        files.push({
          id: `${chat.id}-${msg.id}`,
          fileName: msg.attachment.fileName,
          mediaType: msg.attachment.mediaType,
          mimeType: msg.attachment.mimeType,
          chatId: chat.id,
          chatName: chat.name,
          sender: msg.sender,
          timestamp: msg.timestamp,
          isOutgoing: msg.isOutgoing,
          messageId: msg.id
        });
      }
    }
  }

  // Sort newest first
  files.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return files;
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
