import React, { useState, useMemo } from 'react';
import { ChatContact, MediaType } from '../../types/chat';
import {
  Search,
  Lock,
  Settings,
  FolderSync,
  Users,
  CheckCheck,
  Image as ImageIcon,
  Mic,
  Video,
  FileText,
  X,
  HardDrive,
  FolderTree
} from 'lucide-react';
import { GlobalFileSearch } from './GlobalFileSearch';
import { extractAllSearchableFiles } from '../../services/storageCalculator';
import { SettingsTab } from '../SettingsModal';

interface SidebarProps {
  chats: ChatContact[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  ownerName: string;
  onLockApp: () => void;
  onOpenSettings: (tab?: SettingsTab) => void;
  onRelinkFile: () => void;
  onOpenMedia: (url: string, fileName: string, mediaType: MediaType, messageId?: string) => void;
  onJumpToFile: (chatId: string, messageId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  ownerName,
  onLockApp,
  onOpenSettings,
  onRelinkFile,
  onOpenMedia,
  onJumpToFile
}) => {
  const [viewMode, setViewMode] = useState<'chats' | 'files'>('chats');
  const [searchTerm, setSearchTerm] = useState('');

  // Extract all searchable attachments across all chats
  const allFiles = useMemo(() => extractAllSearchableFiles(chats), [chats]);

  // Filter chats by name or last message text
  const filteredChats = useMemo(() => {
    if (!searchTerm.trim()) return chats;
    const term = searchTerm.toLowerCase();
    return chats.filter(chat => {
      if (chat.name.toLowerCase().includes(term)) return true;
      if (chat.lastMessage?.text.toLowerCase().includes(term)) return true;
      return false;
    });
  }, [chats, searchTerm]);

  const formatChatTime = (date?: Date): string => {
    if (!date) return '';
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return 'Yesterday';

    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const renderLastMessageSnippet = (chat: ChatContact) => {
    const msg = chat.lastMessage;
    if (!msg) return <span className="italic text-gray-500">No messages</span>;

    if (msg.attachment && !msg.attachment.isOmitted) {
      const type = msg.attachment.mediaType;
      return (
        <span className="flex items-center gap-1">
          {type === 'image' || type === 'sticker' ? (
            <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
          ) : type === 'audio' ? (
            <Mic className="w-3.5 h-3.5 text-gray-400" />
          ) : type === 'video' ? (
            <Video className="w-3.5 h-3.5 text-gray-400" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-gray-400" />
          )}
          <span className="capitalize">{type}</span>
        </span>
      );
    }

    return <span>{msg.text || (msg.attachment?.isOmitted ? 'Media omitted' : '')}</span>;
  };

  return (
    <div className="w-full md:w-[380px] lg:w-[420px] h-full bg-[#111b21] border-r border-[#222d34] flex flex-col flex-shrink-0 select-none">
      {/* Sidebar Header */}
      <div className="h-16 px-4 bg-[#202c33] flex items-center justify-between border-b border-[#222d34]">
        {/* User Identity / Avatar */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onOpenSettings('profile')}
          title="Account & Identity Settings"
        >
          <div className="w-10 h-10 rounded-full bg-[#00a884] text-white flex items-center justify-center font-bold text-sm shadow-md group-hover:opacity-90">
            {ownerName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#e9edef] truncate max-w-[105px] sm:max-w-[140px] md:max-w-[160px]">
              {ownerName}
            </p>
            <p className="text-[11px] text-[#00a884] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00a884]"></span>
              My WhatsApp
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-0.5 sm:gap-1 text-[#aebac1]">
          {/* Storage & Data Quick Button */}
          <button
            onClick={() => onOpenSettings('storage')}
            className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors"
            title="Manage Storage & Data Breakdown"
          >
            <HardDrive className="w-5 h-5 text-gray-300 hover:text-[#00a884]" />
          </button>

          {/* Screen Lock button */}
          <button
            onClick={onLockApp}
            className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors"
            title="Lock WhatsApp (Screen Lock)"
          >
            <Lock className="w-5 h-5 text-gray-300" />
          </button>

          {/* Relink file button - hide on very small phones since Settings contains it */}
          <button
            onClick={onRelinkFile}
            className="hidden sm:flex p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors"
            title="Connect / Switch Zip File"
          >
            <FolderSync className="w-5 h-5 text-gray-300" />
          </button>

          {/* Full Settings button */}
          <button
            onClick={() => onOpenSettings('storage')}
            className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      </div>

      {/* WhatsApp Filter Pill Switcher (Chats vs Files & Media) */}
      <div className="px-3 pt-2 pb-1 bg-[#111b21] flex items-center gap-2 border-b border-[#222d34]/60">
        <button
          onClick={() => setViewMode('chats')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
            viewMode === 'chats'
              ? 'bg-[#00a884] text-white'
              : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
          }`}
        >
          <span>Chats</span>
          <span className="text-[10px] opacity-80">({chats.length})</span>
        </button>

        <button
          onClick={() => setViewMode('files')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
            viewMode === 'files'
              ? 'bg-[#00a884] text-white'
              : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
          }`}
          title="Search all files, photos, voice notes, and documents across all chats"
        >
          <FolderTree className="w-3 h-3" />
          <span>Files & Media</span>
          <span className="text-[10px] opacity-80">({allFiles.length})</span>
        </button>
      </div>

      {/* MAIN VIEW CONTENT: Files & Media Search vs Standard Chats List */}
      {viewMode === 'files' ? (
        <GlobalFileSearch
          files={allFiles}
          onOpenMedia={onOpenMedia}
          onJumpToFile={onJumpToFile}
          onClose={() => setViewMode('chats')}
        />
      ) : (
        <>
          {/* Chat Search Bar */}
          <div className="p-2.5 bg-[#111b21] border-b border-[#222d34]">
            <div className="bg-[#202c33] rounded-lg px-3 py-1.5 flex items-center gap-3">
              <Search className="w-4 h-4 text-[#8696a0]" />
              <input
                type="text"
                placeholder="Search or start new chat"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent text-sm text-[#e9edef] outline-none placeholder-[#8696a0]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-[#8696a0] hover:text-[#e9edef]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[#222d34]/40">
            {filteredChats.length === 0 ? (
              <div className="text-center py-16 px-4 text-[#8696a0] text-sm">
                No chats found matching "{searchTerm}"
              </div>
            ) : (
              filteredChats.map(chat => {
                const isActive = chat.id === activeChatId;
                return (
                  <div
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className={`flex items-center gap-3.5 px-3.5 py-3 cursor-pointer transition-colors ${
                      isActive ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]/70 bg-[#111b21]'
                    }`}
                  >
                    {/* Contact Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-[#2a3942] border border-[#3b4a54] flex items-center justify-center font-bold text-base text-[#00a884]">
                        {chat.name.slice(0, 2).toUpperCase()}
                      </div>
                      {chat.isGroup && (
                        <div className="absolute -bottom-0.5 -right-0.5 bg-[#202c33] p-1 rounded-full text-[#8696a0] border border-[#111b21]">
                          <Users className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    {/* Chat Title and Preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[15.5px] font-normal text-[#e9edef] truncate">
                          {chat.name}
                        </h3>
                        <span className="text-[11.5px] text-[#8696a0] flex-shrink-0 ml-2">
                          {formatChatTime(chat.lastMessage?.timestamp)}
                        </span>
                      </div>

                      <div className="flex items-center text-[13px] text-[#8696a0] truncate">
                        {chat.lastMessage?.isOutgoing && (
                          <CheckCheck
                            className="w-3.5 h-3.5 text-[#53bdeb] mr-1 flex-shrink-0"
                            strokeWidth={2.2}
                          />
                        )}
                        <div className="truncate">{renderLastMessageSnippet(chat)}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};
