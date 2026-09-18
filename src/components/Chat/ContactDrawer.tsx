import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Image as ImageIcon,
  FileText,
  Phone,
  Video,
  Download,
  MessageSquare
} from 'lucide-react';
import { ChatContact, MediaType, ChatMessage } from '../../types/chat';
import { getMediaBlobUrl } from '../../services/zipParser';

interface ContactDrawerProps {
  chat: ChatContact;
  onClose: () => void;
  onOpenMedia: (url: string, fileName: string, mediaType: MediaType, messageId?: string) => void;
  onJumpToMessage: (messageId: string) => void;
}

// Media Thumbnail Item in the Gallery Grid
const MediaThumbnailItem: React.FC<{
  chatId: string;
  message: ChatMessage;
  onOpenMedia: (url: string, fileName: string, mediaType: MediaType, messageId?: string) => void;
  onJumpToMessage: (messageId: string) => void;
}> = ({ chatId, message, onOpenMedia, onJumpToMessage }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const attachment = message.attachment!;

  useEffect(() => {
    let isMounted = true;
    getMediaBlobUrl(chatId, attachment.fileName).then(url => {
      if (isMounted && url) {
        setBlobUrl(url);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [chatId, attachment.fileName]);

  // Guaranteed instant open on 1st click: fetch blobUrl immediately if not ready
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let url = blobUrl;
    if (!url) {
      setIsOpening(true);
      url = await getMediaBlobUrl(chatId, attachment.fileName);
      setIsOpening(false);
    }

    if (url) {
      onOpenMedia(url, attachment.fileName, attachment.mediaType, message.id);
    } else {
      onJumpToMessage(message.id);
    }
  };

  const handleJumpOnly = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onJumpToMessage(message.id);
  };

  const isVisual =
    attachment.mediaType === 'image' ||
    attachment.mediaType === 'sticker' ||
    attachment.mediaType === 'video';

  if (isVisual) {
    return (
      <div
        onClick={handleClick}
        className="group relative aspect-square bg-[#202c33] rounded-lg overflow-hidden border border-[#2a3942] cursor-pointer hover:border-[#00a884] transition-all select-none"
        title={`Click to view ${attachment.fileName}`}
      >
        {blobUrl ? (
          attachment.mediaType === 'video' ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <video src={blobUrl} className="w-full h-full object-cover pointer-events-none" preload="metadata" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Video className="w-6 h-6 text-white drop-shadow" />
              </div>
            </div>
          ) : (
            <img
              src={blobUrl}
              alt={attachment.fileName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-150 pointer-events-none"
              loading="lazy"
            />
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-1 bg-[#1a2329]">
            {isOpening ? (
              <div className="w-5 h-5 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
            ) : attachment.mediaType === 'video' ? (
              <Video className="w-6 h-6 text-[#34b7f1]" />
            ) : (
              <ImageIcon className="w-6 h-6 text-[#00a884]" />
            )}
            <span className="text-[9px] text-[#8696a0] truncate w-full text-center mt-1 px-1">
              {attachment.fileName}
            </span>
          </div>
        )}

        {/* Hover overlay with Jump to message icon - pointer-events-none so it doesn't block the click */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <button
            onClick={handleJumpOnly}
            className="p-2 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-full shadow-lg pointer-events-auto transform hover:scale-110 transition-transform cursor-pointer"
            title="Jump to this message in the chat conversation"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Document or Audio
  return (
    <div
      onClick={handleClick}
      className="group relative bg-[#202c33] rounded-lg p-3 border border-[#2a3942] cursor-pointer hover:border-[#00a884] transition-all flex items-center justify-between select-none"
      title={`Click to open ${attachment.fileName}`}
    >
      <div className="flex items-center gap-3 min-w-0 pointer-events-none">
        <div className="w-9 h-9 rounded bg-black/20 flex items-center justify-center flex-shrink-0">
          {attachment.mediaType === 'audio' ? (
            <Phone className="w-4 h-4 text-[#e542a3]" />
          ) : (
            <FileText className="w-4 h-4 text-red-400" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-200 truncate">{attachment.fileName}</p>
          <p className="text-[10px] text-[#8696a0] uppercase">{attachment.mediaType}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {blobUrl && (
          <a
            href={blobUrl}
            download={attachment.fileName}
            onClick={e => e.stopPropagation()}
            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full text-[#8696a0] hover:text-white transition-colors cursor-pointer"
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </a>
        )}
        <button
          onClick={handleJumpOnly}
          className="w-8 h-8 flex items-center justify-center hover:bg-[#00a884] rounded-full text-[#8696a0] hover:text-white transition-colors cursor-pointer"
          title="Jump to message in chat"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const ContactDrawer: React.FC<ContactDrawerProps> = ({
  chat,
  onClose,
  onOpenMedia,
  onJumpToMessage
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'media'>('info');

  const mediaMessages = chat.messages.filter(m => m.attachment && !m.attachment.isOmitted);
  const totalMedia = mediaMessages.length;

  return (
    <div className="w-80 sm:w-96 h-full bg-[#111b21] border-l border-[#222d34] flex flex-col z-20 select-none text-[#e9edef] flex-shrink-0">
      {/* Drawer Header with 44px hit-target close button */}
      <div className="h-16 px-4 bg-[#202c33] flex items-center justify-between text-[#e9edef] border-b border-[#222d34]">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Close Drawer"
          >
            <X className="w-5 h-5 text-[#aebac1] hover:text-white" />
          </button>
          <span className="font-semibold text-base">
            {chat.isGroup ? 'Group info' : 'Contact info'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Profile Card */}
        <div className="bg-[#111b21] p-6 flex flex-col items-center border-b border-[#222d34]">
          <div className="w-24 h-24 rounded-full bg-[#202c33] border-2 border-[#00a884] flex items-center justify-center text-3xl font-bold text-[#00a884] mb-3 shadow-lg">
            {chat.name.slice(0, 2).toUpperCase()}
          </div>
          <h2 className="text-lg font-semibold text-center mb-1">{chat.name}</h2>
          <p className="text-xs text-[#8696a0]">
            {chat.isGroup ? `${chat.participants.length} participants` : 'WhatsApp Chat'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[#222d34] bg-[#202c33]">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors cursor-pointer ${
              activeTab === 'info'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors cursor-pointer ${
              activeTab === 'media'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            Media, Links & Docs ({totalMedia})
          </button>
        </div>

        {activeTab === 'info' ? (
          <div className="p-4 space-y-4">
            {/* Quick Stats */}
            <div className="bg-[#202c33] p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#8696a0]">Total Messages</span>
                <span className="font-semibold text-white">{chat.messages.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#8696a0]">Media Files</span>
                <span className="font-semibold text-white">{totalMedia}</span>
              </div>
              {chat.messages.length > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-[#8696a0]">First Message</span>
                  <span className="text-gray-300">
                    {chat.messages[0].timestamp.toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Participants list (if group) */}
            {chat.isGroup && (
              <div className="bg-[#202c33] p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
                  <Users className="w-4 h-4" />
                  <span>Participants ({chat.participants.length})</span>
                </div>
                <div className="divide-y divide-[#2a3942] max-h-60 overflow-y-auto">
                  {chat.participants.map((p, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-sm">
                      <span className="truncate">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Media Gallery */
          <div className="p-4">
            {mediaMessages.length === 0 ? (
              <div className="text-center py-12 text-sm text-[#8696a0]">
                No media shared in this chat
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[11px] text-[#8696a0]">
                  Click any item to view or click the chat bubble to jump directly into the conversation.
                </p>

                {/* Grid for visual media */}
                <div className="grid grid-cols-3 gap-2">
                  {mediaMessages
                    .filter(
                      m =>
                        m.attachment?.mediaType === 'image' ||
                        m.attachment?.mediaType === 'video' ||
                        m.attachment?.mediaType === 'sticker'
                    )
                    .map(m => (
                      <MediaThumbnailItem
                        key={m.id}
                        chatId={chat.id}
                        message={m}
                        onOpenMedia={onOpenMedia}
                        onJumpToMessage={onJumpToMessage}
                      />
                    ))}
                </div>

                {/* List for Documents & Audio */}
                {mediaMessages.some(
                  m =>
                    m.attachment?.mediaType === 'document' ||
                    m.attachment?.mediaType === 'audio'
                ) && (
                  <div className="pt-2 border-t border-[#2a3942] space-y-2">
                    <span className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider block">
                      Documents & Audio
                    </span>
                    <div className="space-y-2">
                      {mediaMessages
                        .filter(
                          m =>
                            m.attachment?.mediaType === 'document' ||
                            m.attachment?.mediaType === 'audio'
                        )
                        .map(m => (
                          <MediaThumbnailItem
                            key={m.id}
                            chatId={chat.id}
                            message={m}
                            onOpenMedia={onOpenMedia}
                            onJumpToMessage={onJumpToMessage}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
