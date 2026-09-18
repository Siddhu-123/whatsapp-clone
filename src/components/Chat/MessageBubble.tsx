import React, { useState, useEffect } from 'react';
import { ChatMessage, MediaType } from '../../types/chat';
import { getMediaBlobUrl } from '../../services/zipParser';
import { VoiceNotePlayer } from '../Media/VoiceNotePlayer';
import { CheckCheck, FileText, Download, UserCheck, AlertCircle } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
  isGroup: boolean;
  onOpenMedia: (url: string, fileName: string, mediaType: MediaType) => void;
}

// Generate consistent WhatsApp participant color for group chats
const SENDER_COLORS = [
  '#00a884', '#34b7f1', '#e542a3', '#1f7aec', '#00b59c',
  '#d66800', '#8374d2', '#ff5a5a', '#32aa52', '#d35400'
];

function getSenderColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}

// Format message text with URLs and WhatsApp markdown (*bold*, _italic_, ~strike~)
function formatWhatsAppText(text: string): React.ReactNode[] {
  if (!text) return [];

  // Match URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#53bdeb] hover:underline break-all"
          onClick={e => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }

    // Bold formatting *text*
    const boldRegex = /\*([^*]+)\*/g;
    const subParts = part.split(boldRegex);
    if (subParts.length > 1) {
      return (
        <span key={index}>
          {subParts.map((sub, sIdx) =>
            sIdx % 2 === 1 ? <strong key={sIdx}>{sub}</strong> : sub
          )}
        </span>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isGroup,
  onOpenMedia
}) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isMediaLoading, setIsMediaLoading] = useState(false);

  const { attachment, isOutgoing, isSystem, sender, timestamp, text, chatId } = message;

  // Load media blob on mount if message contains an attachment
  useEffect(() => {
    let isMounted = true;
    if (attachment && !attachment.isOmitted) {
      setIsMediaLoading(true);
      getMediaBlobUrl(chatId, attachment.fileName).then(url => {
        if (isMounted && url) {
          setMediaUrl(url);
        }
        if (isMounted) setIsMediaLoading(false);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [chatId, attachment]);

  // Render System Event (e.g. encryption notice, group creation)
  if (isSystem) {
    return (
      <div className="flex justify-center my-2 px-4">
        <div className="bg-[#182229] dark:bg-[#182229] text-[#8696a0] text-xs px-3 py-1.5 rounded-lg shadow-sm text-center max-w-lg leading-relaxed">
          {text}
        </div>
      </div>
    );
  }

  const handleMediaOpen = async () => {
    if (!attachment) return;
    const url = mediaUrl || await getMediaBlobUrl(chatId, attachment.fileName);
    if (url) {
      onOpenMedia(url, attachment.fileName, attachment.mediaType);
    }
  };

  // Sticker Message (rendered transparent without bubble background)
  if (attachment && attachment.mediaType === 'sticker') {
    return (
      <div className={`flex my-1 ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
        <div className="relative group max-w-[150px]">
          {mediaUrl ? (
            <img
              src={mediaUrl}
              alt="Sticker"
              className="w-36 h-36 object-contain cursor-pointer hover:scale-105 transition-transform"
              onClick={handleMediaOpen}
            />
          ) : (
            <div
              onClick={handleMediaOpen}
              className="w-32 h-32 flex items-center justify-center bg-gray-700/30 rounded-lg cursor-pointer"
            >
              <span className="text-xs text-gray-400">Sticker</span>
            </div>
          )}
          <span className="text-[10px] text-[#8696a0] absolute bottom-1 right-2 bg-black/40 px-1 rounded">
            {formatTime(timestamp)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex my-1 px-2 ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] md:max-w-[65%] rounded-lg px-2.5 py-1.5 shadow-sm text-[14.2px] leading-[19px] break-words ${
          isOutgoing
            ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
            : 'bg-[#202c33] text-[#e9edef] rounded-tl-none'
        }`}
      >
        {/* Group Sender Header */}
        {isGroup && !isOutgoing && (
          <div
            className="text-[12.8px] font-semibold mb-1 truncate cursor-pointer hover:underline"
            style={{ color: getSenderColor(sender) }}
          >
            {sender}
          </div>
        )}

        {/* Media Attachments */}
        {attachment && (
          <div className="mb-1.5 overflow-hidden rounded-md">
            {attachment.isOmitted ? (
              <div className="flex items-center gap-2 p-2 bg-black/20 rounded text-xs text-gray-300">
                <AlertCircle className="w-4 h-4 text-gray-400" />
                <span>Media omitted from export</span>
              </div>
            ) : attachment.mediaType === 'image' ? (
              <div
                className="relative cursor-pointer group overflow-hidden rounded-md bg-black/10"
                onClick={handleMediaOpen}
              >
                {mediaUrl ? (
                  <img
                    src={mediaUrl}
                    alt={attachment.fileName}
                    className="max-h-80 w-auto object-cover rounded-md hover:scale-[1.01] transition-transform duration-200"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-48 w-64 bg-gray-700/20 animate-pulse flex items-center justify-center text-xs text-gray-400">
                    {isMediaLoading ? 'Loading image...' : attachment.fileName}
                  </div>
                )}
              </div>
            ) : attachment.mediaType === 'video' ? (
              <div className="relative group rounded-md overflow-hidden bg-black max-w-sm">
                {mediaUrl ? (
                  <video
                    src={mediaUrl}
                    controls
                    className="max-h-72 w-full rounded-md"
                    preload="metadata"
                  />
                ) : (
                  <div className="h-44 w-64 bg-gray-800 flex items-center justify-center text-xs text-gray-400">
                    {isMediaLoading ? 'Loading video...' : attachment.fileName}
                  </div>
                )}
              </div>
            ) : attachment.mediaType === 'audio' ? (
              <VoiceNotePlayer
                chatId={chatId}
                fileName={attachment.fileName}
                isOutgoing={isOutgoing}
              />
            ) : attachment.fileName.toLowerCase().endsWith('.vcf') ? (
              // Contact VCard
              <div className="flex items-center gap-3 p-2.5 bg-black/20 rounded-md">
                <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center text-white font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {attachment.fileName.replace(/\.vcf$/i, '')}
                  </p>
                  <p className="text-[11px] text-gray-300">Contact Card</p>
                </div>
                {mediaUrl && (
                  <a
                    href={mediaUrl}
                    download={attachment.fileName}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                    title="Download Contact"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
              </div>
            ) : (
              // Document
              <div className="flex items-center gap-3 p-2 bg-black/20 rounded-md">
                <div className="w-9 h-9 rounded bg-red-500/20 text-red-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{attachment.fileName}</p>
                  <p className="text-[10px] text-gray-400 uppercase">
                    {attachment.fileName.split('.').pop()} Document
                  </p>
                </div>
                {mediaUrl && (
                  <a
                    href={mediaUrl}
                    download={attachment.fileName}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                    title="Download Document"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Message Text Content */}
        {text && (
          <div className="whitespace-pre-wrap pr-12 pb-1 font-normal">
            {formatWhatsAppText(text)}
          </div>
        )}

        {/* Timestamp & Seen Status */}
        <div className="float-right ml-2 -mb-1 flex items-center gap-1 select-none text-[11px] text-[#8696a0]">
          <span>{formatTime(timestamp)}</span>
          {isOutgoing && (
            <CheckCheck className="w-4 h-4 text-[#53bdeb]" strokeWidth={2.2} />
          )}
        </div>
      </div>
    </div>
  );
};
