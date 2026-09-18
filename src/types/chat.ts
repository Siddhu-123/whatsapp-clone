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
  iterations?: number;
}

export interface FileHandleMetadata {
  name: string;
  size: number;
  lastModified: number;
  type: string;
}

export interface ChatStorageStats {
  chatId: string;
  chatName: string;
  isGroup: boolean;
  messageCount: number;
  totalMediaCount: number;
  imageCount: number;
  videoCount: number;
  audioCount: number;
  documentCount: number;
  estimatedTextBytes: number;
  estimatedMediaBytes: number;
  lastActive?: Date;
}

export interface SearchableFileItem {
  id: string;
  fileName: string;
  mediaType: MediaType;
  mimeType: string;
  chatId: string;
  chatName: string;
  sender: string;
  timestamp: Date;
  isOutgoing: boolean;
  messageId: string;
}

