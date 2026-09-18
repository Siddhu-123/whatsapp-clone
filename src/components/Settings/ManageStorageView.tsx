import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Users,
  Image as ImageIcon,
  Video,
  Mic,
  FileText,
  ArrowUpDown,
  ExternalLink,
  HardDrive,
  CheckCircle2
} from 'lucide-react';
import { ChatContact } from '../../types/chat';
import { computeStorageStats, formatBytes } from '../../services/storageCalculator';

interface ManageStorageViewProps {
  chats: ChatContact[];
  onOpenChat: (chatId: string) => void;
}

type SortOption = 'storage' | 'messages' | 'media' | 'recent';

export const ManageStorageView: React.FC<ManageStorageViewProps> = ({
  chats,
  onOpenChat
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('storage');
  const [browserStorage, setBrowserStorage] = useState<{ used: string; quota: string; percent: string } | null>(null);

  // Compute live browser storage estimate
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      navigator.storage
        .estimate()
        .then(({ usage, quota }) => {
          if (usage !== undefined) {
            const usedStr = formatBytes(usage);
            const quotaStr = quota ? formatBytes(quota) : 'Unknown';
            const pct = quota ? ((usage / quota) * 100).toFixed(2) : '< 0.01';
            setBrowserStorage({ used: usedStr, quota: quotaStr, percent: `${pct}%` });
          }
        })
        .catch(() => {});
    }
  }, []);

  const summary = useMemo(() => computeStorageStats(chats), [chats]);

  // Filter and sort chat list
  const processedStats = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = summary.chatStats.filter(c => {
      if (!term) return true;
      return c.chatName.toLowerCase().includes(term);
    });

    return filtered.sort((a, b) => {
      if (sortOption === 'storage') {
        const totalA = a.estimatedTextBytes + a.estimatedMediaBytes;
        const totalB = b.estimatedTextBytes + b.estimatedMediaBytes;
        return totalB - totalA;
      }
      if (sortOption === 'messages') {
        return b.messageCount - a.messageCount;
      }
      if (sortOption === 'media') {
        return b.totalMediaCount - a.totalMediaCount;
      }
      if (sortOption === 'recent') {
        const timeA = a.lastActive ? a.lastActive.getTime() : 0;
        const timeB = b.lastActive ? b.lastActive.getTime() : 0;
        return timeB - timeA;
      }
      return 0;
    });
  }, [summary, searchTerm, sortOption]);

  return (
    <div className="flex flex-col h-full text-[#e9edef] select-none space-y-5">
      {/* Storage Overview Bar - WhatsApp Style */}
      <div className="bg-[#111b21] p-4 rounded-xl border border-[#2a3942] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#00a884]" />
            <h3 className="text-sm font-semibold text-[#e9edef]">WhatsApp Storage Breakdown</h3>
          </div>
          <span className="text-xs text-[#00a884] font-medium">
            {browserStorage ? `${browserStorage.used} cached` : 'Calculating...'}
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-3 bg-[#202c33] rounded-full overflow-hidden flex">
          <div
            className="bg-[#00a884] h-full transition-all duration-300"
            style={{ width: '45%' }}
            title="Text Chat Data (IndexedDB)"
          />
          <div
            className="bg-[#53bdeb] h-full transition-all duration-300"
            style={{ width: '35%' }}
            title="Media Entries in Zip (Streamed on-demand)"
          />
          <div
            className="bg-purple-500/80 h-full transition-all duration-300"
            style={{ width: '20%' }}
            title="Security & System metadata"
          />
        </div>

        {/* Bar Legend */}
        <div className="flex items-center gap-4 text-[11px] text-[#8696a0] flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00a884]" />
            <span>Chat Text ({formatBytes(summary.totalTextBytes)})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#53bdeb]" />
            <span>Media Files in Zip (~{formatBytes(summary.totalEstimatedMediaBytes)})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            <span>Browser Quota ({browserStorage?.percent || '< 0.01%'})</span>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[#111b21] p-3 rounded-lg border border-[#2a3942]">
          <span className="text-[11px] text-[#8696a0]">Total Chats</span>
          <p className="text-lg font-bold text-[#e9edef] mt-0.5">{chats.length}</p>
        </div>

        <div className="bg-[#111b21] p-3 rounded-lg border border-[#2a3942]">
          <span className="text-[11px] text-[#8696a0]">Total Messages</span>
          <p className="text-lg font-bold text-[#00a884] mt-0.5">
            {summary.totalMessages.toLocaleString()}
          </p>
        </div>

        <div className="bg-[#111b21] p-3 rounded-lg border border-[#2a3942]">
          <span className="text-[11px] text-[#8696a0]">Media Files</span>
          <p className="text-lg font-bold text-[#53bdeb] mt-0.5">
            {summary.totalMediaFiles.toLocaleString()}
          </p>
        </div>

        <div className="bg-[#111b21] p-3 rounded-lg border border-[#2a3942]">
          <span className="text-[11px] text-[#8696a0]">Client-Side Only</span>
          <div className="flex items-center gap-1 text-[#00a884] mt-1 font-semibold text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Zero Network</span>
          </div>
        </div>
      </div>

      {/* Media Type Breakdown Pills */}
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <div className="flex items-center gap-1 bg-[#111b21] px-2.5 py-1 rounded-md border border-[#2a3942] text-[#8696a0]">
          <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>Photos: <strong className="text-[#e9edef]">{summary.breakdown.images}</strong></span>
        </div>
        <div className="flex items-center gap-1 bg-[#111b21] px-2.5 py-1 rounded-md border border-[#2a3942] text-[#8696a0]">
          <Video className="w-3.5 h-3.5 text-blue-400" />
          <span>Videos: <strong className="text-[#e9edef]">{summary.breakdown.videos}</strong></span>
        </div>
        <div className="flex items-center gap-1 bg-[#111b21] px-2.5 py-1 rounded-md border border-[#2a3942] text-[#8696a0]">
          <Mic className="w-3.5 h-3.5 text-amber-400" />
          <span>Audio: <strong className="text-[#e9edef]">{summary.breakdown.audios}</strong></span>
        </div>
        <div className="flex items-center gap-1 bg-[#111b21] px-2.5 py-1 rounded-md border border-[#2a3942] text-[#8696a0]">
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span>Docs: <strong className="text-[#e9edef]">{summary.breakdown.documents}</strong></span>
        </div>
      </div>

      {/* Chat-Wise Storage Section Header */}
      <div className="pt-2 border-t border-[#2a3942] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-[#e9edef]">Chats Storage Breakdown</h4>
            <p className="text-[11px] text-[#8696a0]">
              Chats sorted by data size. Click a chat to open it or inspect its files.
            </p>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#8696a0]" />
            <span className="text-[#8696a0]">Sort by:</span>
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value as SortOption)}
              className="bg-[#111b21] border border-[#2a3942] rounded-md px-2.5 py-1 text-xs text-[#e9edef] outline-none cursor-pointer"
            >
              <option value="storage">Storage Size</option>
              <option value="messages">Message Count</option>
              <option value="media">Media Count</option>
              <option value="recent">Most Recent</option>
            </select>
          </div>
        </div>

        {/* Search within Storage Chats */}
        <div className="bg-[#111b21] rounded-lg px-3 py-1.5 flex items-center gap-2 border border-[#2a3942]">
          <Search className="w-3.5 h-3.5 text-[#8696a0]" />
          <input
            type="text"
            placeholder="Filter chats in storage..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-xs text-[#e9edef] outline-none placeholder-[#8696a0]"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-[#8696a0] hover:text-white text-xs">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Chat-Wise List */}
      <div className="overflow-y-auto max-h-[320px] custom-scrollbar divide-y divide-[#222d34]/60 pr-1">
        {processedStats.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#8696a0]">
            No chats match "{searchTerm}"
          </div>
        ) : (
          processedStats.map(c => {
            const totalEstBytes = c.estimatedTextBytes + c.estimatedMediaBytes;
            return (
              <div
                key={c.chatId}
                onClick={() => onOpenChat(c.chatId)}
                className="py-3 px-2 flex items-center justify-between hover:bg-[#111b21] rounded-lg transition-colors cursor-pointer group"
              >
                {/* Chat Identity */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-full bg-[#202c33] border border-[#2a3942] flex items-center justify-center font-bold text-xs text-[#00a884] flex-shrink-0">
                    {c.chatName.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-[#e9edef] truncate group-hover:text-[#00a884] transition-colors">
                        {c.chatName}
                      </p>
                      {c.isGroup && <Users className="w-3 h-3 text-[#8696a0] flex-shrink-0" />}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#8696a0] mt-0.5 flex-wrap">
                      <span>{c.messageCount.toLocaleString()} messages</span>
                      <span>•</span>
                      <span>{c.totalMediaCount} media</span>
                      {c.imageCount > 0 && <span>📷 {c.imageCount}</span>}
                      {c.audioCount > 0 && <span>🎤 {c.audioCount}</span>}
                      {c.documentCount > 0 && <span>📄 {c.documentCount}</span>}
                    </div>
                  </div>
                </div>

                {/* Storage Badge and Action Buttons */}
                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                  <div className="text-right">
                    <span className="text-xs font-semibold text-[#00a884] block">
                      {formatBytes(totalEstBytes)}
                    </span>
                    <span className="text-[10px] text-[#8696a0]">
                      {formatBytes(c.estimatedTextBytes)} text
                    </span>
                  </div>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onOpenChat(c.chatId);
                    }}
                    className="p-1.5 rounded-full hover:bg-white/10 text-[#8696a0] hover:text-[#00a884] transition-colors"
                    title="Open Chat"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
