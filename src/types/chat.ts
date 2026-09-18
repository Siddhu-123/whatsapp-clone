export type MediaType = 'image' | 'video' | 'audio' | 'sticker' | 'document';

export interface ChatAttachment {
  fileName: string;
  mediaType: MediaType;
  mimeType: string;
  blobUrl?: string;
  isOmitted?: boolean;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  timestamp: Date;
  sender: string;
  isOutgoing: boolean;
  text: string;
  isSystem: boolean;
  attachment?: ChatAttachment;
  raw: string;
}

export interface ChatContact {
  id: string;
  name: string;
  isGroup: boolean;
  participants: string[];
  messages: ChatMessage[];
  lastMessage?: ChatMessage;
  unreadCount?: number;
  innerZipName?: string;
  mediaFiles: Record<string, any>;
}

export interface ParsedWhatsAppExport {
  chats: ChatContact[];
  detectedOwnerName: string;
  totalMessages: number;
}

export interface SecurityConfig {
  isConfigured: boolean;
  salt: string;
  iv: string;
  encryptedVerification: string;
  autoLockMinutes: number;
}

export interface FileHandleMetadata {
  name: string;
  size: number;
  lastModified: number;
  type: string;
}
