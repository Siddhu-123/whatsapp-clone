import React, { useState, useEffect, useRef } from 'react';
import { ChatContact, MediaType } from '../../types/chat';
import { MessageBubble } from './MessageBubble';
import { ContactDrawer } from './ContactDrawer';
import {
  Search,
  Smile,
  Paperclip,
  Mic,
  ChevronDown,
  ChevronUp,
  X,
  ArrowLeft,
  Info
} from 'lucide-react';

interface ChatViewProps {
  chat: ChatContact;
  onBack?: () => void;
  onOpenMedia: (url: string, fileName: string, mediaType: MediaType, messageId?: string) => void;
  jumpMessageId?: string | null;
}

export const ChatView: React.FC<ChatViewProps> = ({
  chat,
  onBack,
  onOpenMedia,
  jumpMessageId
}) => {
  const [showDrawer, setShowDrawer] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchingIndexes, setMatchingIndexes] = useState<number[]>([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll to bottom when opening a chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [chat.id]);

  // Jump to a specific message in the conversation and flash highlight it
  const handleJumpToMessage = (messageId: string) => {
    const index = chat.messages.findIndex(m => m.id === messageId);
    if (index !== -1) {
      setHighlightedMessageId(messageId);
      messageRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Automatically fade highlight after 2.5 seconds
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 2500);
    }
  };

  // Watch for external jumpMessageId trigger (e.g. from Lightbox)
  useEffect(() => {
    if (jumpMessageId) {
      handleJumpToMessage(jumpMessageId);
    }
  }, [jumpMessageId]);

  // Handle in-chat search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setMatchingIndexes([]);
      setCurrentMatchIdx(0);
      return;
    }

    const q = searchQuery.toLowerCase();
    const indexes: number[] = [];
    chat.messages.forEach((msg, idx) => {
      if (msg.text.toLowerCase().includes(q) || (msg.attachment?.fileName.toLowerCase().includes(q))) {
        indexes.push(idx);
      }
    });

    setMatchingIndexes(indexes);
    setCurrentMatchIdx(indexes.length > 0 ? indexes.length - 1 : 0);

    if (indexes.length > 0) {
      const target = indexes[indexes.length - 1];
      messageRefs.current[target]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchQuery, chat.messages]);

  const jumpToMatch = (step: number) => {
    if (matchingIndexes.length === 0) return;
    let next = currentMatchIdx + step;
    if (next < 0) next = matchingIndexes.length - 1;
    if (next >= matchingIndexes.length) next = 0;
    setCurrentMatchIdx(next);

    const target = matchingIndexes[next];
    messageRefs.current[target]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Group messages by date
  const renderMessageList = () => {
    let lastDateStr = '';
    return chat.messages.map((msg, index) => {
      const dateStr = msg.timestamp.toLocaleDateString([], {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const showDateBadge = dateStr !== lastDateStr;
      lastDateStr = dateStr;

      const isMatch = matchingIndexes.includes(index);
      const isCurrentMatch = matchingIndexes[currentMatchIdx] === index;
      const isTargetHighlighted = highlightedMessageId === msg.id;

      return (
        <React.Fragment key={msg.id}>
          {showDateBadge && (
            <div className="flex justify-center my-3">
              <span className="bg-[#182229] dark:bg-[#182229] text-[#8696a0] text-[12px] px-3 py-1 rounded-md shadow-sm select-none font-medium">
                {dateStr}
              </span>
            </div>
          )}
          <div
            ref={el => (messageRefs.current[index] = el)}
            className={`transition-all duration-300 rounded-lg ${
              isTargetHighlighted
                ? 'bg-[#00a884]/40 ring-2 ring-[#00a884] p-0.5 shadow-lg'
                : isCurrentMatch
                ? 'bg-[#00a884]/30'
                : isMatch
                ? 'bg-yellow-500/20'
                : ''
            }`}
          >
            <MessageBubble
              message={msg}
              isGroup={chat.isGroup}
              onOpenMedia={(url, fileName, mediaType) =>
                onOpenMedia(url, fileName, mediaType, msg.id)
              }
            />
          </div>
        </React.Fragment>
      );
    });
  };

  return (
    <div className="flex-1 h-full flex relative overflow-hidden bg-[#0b141a]">
      {/* Main Conversation Column */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Chat Header */}
        <div className="h-16 px-4 bg-[#202c33] border-b border-[#222d34] flex items-center justify-between z-10 select-none">
          <div className="flex items-center gap-3 min-w-0">
            {onBack && (
              <button
                onClick={onBack}
                className="md:hidden p-1 hover:bg-white/10 rounded-full text-[#aebac1]"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div
              className="w-10 h-10 rounded-full bg-[#00a884]/20 border border-[#00a884]/40 flex items-center justify-center text-sm font-bold text-[#00a884] flex-shrink-0 cursor-pointer"
              onClick={() => setShowDrawer(prev => !prev)}
            >
              {chat.name.slice(0, 2).toUpperCase()}
            </div>
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => setShowDrawer(prev => !prev)}
            >
              <h1 className="text-sm sm:text-base font-medium text-[#e9edef] truncate">
                {chat.name}
              </h1>
              <p className="text-xs text-[#8696a0] truncate">
                {chat.isGroup
                  ? `${chat.participants.length} participants`
                  : 'last seen recently'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[#aebac1]">
            <button
              onClick={() => setShowSearch(prev => !prev)}
              className={`p-2 rounded-full hover:bg-white/10 transition-colors ${
                showSearch ? 'text-[#00a884]' : ''
              }`}
              title="Search in chat"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowDrawer(prev => !prev)}
              className={`p-2 rounded-full hover:bg-white/10 transition-colors ${
                showDrawer ? 'text-[#00a884]' : ''
              }`}
              title="Chat info & media"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* In-Chat Search Bar */}
        {showSearch && (
          <div className="bg-[#202c33] px-4 py-2 border-b border-[#222d34] flex items-center gap-3 animate-fade-in z-10">
            <Search className="w-4 h-4 text-[#8696a0]" />
            <input
              type="text"
              placeholder="Search in this chat..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-[#e9edef] outline-none placeholder-[#8696a0]"
              autoFocus
            />
            {matchingIndexes.length > 0 && (
              <span className="text-xs text-[#8696a0]">
                {currentMatchIdx + 1} of {matchingIndexes.length}
              </span>
            )}
            <div className="flex items-center gap-1">
              <button
                onClick={() => jumpToMatch(-1)}
                disabled={matchingIndexes.length === 0}
                className="p-1 hover:bg-white/10 rounded disabled:opacity-30 text-[#aebac1]"
                title="Previous match"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => jumpToMatch(1)}
                disabled={matchingIndexes.length === 0}
                className="p-1 hover:bg-white/10 rounded disabled:opacity-30 text-[#aebac1]"
                title="Next match"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className="p-1 hover:bg-white/10 rounded text-[#aebac1]"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Message Stream with WhatsApp Wallpaper */}
        <div className="flex-1 overflow-y-auto px-2 sm:px-6 py-4 custom-scrollbar relative bg-[#0b141a]">
          {/* WhatsApp doodle pattern layer */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }}
          />

          <div className="relative z-10 flex flex-col">
            {renderMessageList()}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Chat Bottom Bar */}
        <div className="min-h-[62px] px-3 sm:px-4 py-2 pb-safe bg-[#202c33] border-t border-[#222d34] flex items-center gap-2 sm:gap-3 z-10 select-none">
          <div className="flex items-center gap-1 sm:gap-2 text-[#8696a0]">
            <button className="hidden sm:block p-1.5 hover:bg-white/10 rounded-full transition-colors">
              <Smile className="w-5 sm:w-6 h-5 sm:h-6" />
            </button>
            <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
              <Paperclip className="w-5 sm:w-6 h-5 sm:h-6" />
            </button>
          </div>

          <div className="flex-1 bg-[#2a3942] rounded-lg px-3 sm:px-4 py-2 flex items-center min-w-0">
            <input
              type="text"
              readOnly
              placeholder="Exported chat history (Read-only)"
              className="bg-transparent text-xs sm:text-sm text-[#8696a0] placeholder-[#8696a0] w-full outline-none cursor-default truncate"
            />
          </div>

          <button className="p-1.5 sm:p-2 text-[#8696a0] hover:bg-white/10 rounded-full transition-colors flex-shrink-0">
            <Mic className="w-5 sm:w-6 h-5 sm:h-6" />
          </button>
        </div>
      </div>

      {/* Right Slide-Over Contact Drawer */}
      {showDrawer && (
        <ContactDrawer
          chat={chat}
          onClose={() => setShowDrawer(false)}
          onOpenMedia={onOpenMedia}
          onJumpToMessage={handleJumpToMessage}
        />
      )}
    </div>
  );
};
