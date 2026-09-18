import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  X,
  FileText,
  Image as ImageIcon,
  Video,
  Mic,
  Download,
  MessageSquare,
  Filter
} from 'lucide-react';
import { SearchableFileItem, MediaType } from '../../types/chat';
import { getMediaBlobUrl } from '../../services/zipParser';

interface GlobalFileSearchProps {
  files: SearchableFileItem[];
  onOpenMedia: (url: string, fileName: string, mediaType: MediaType, messageId?: string) => void;
  onJumpToFile: (chatId: string, messageId: string) => void;
  onClose?: () => void;
}

type FilterCategory = 'all' | 'image' | 'video' | 'audio' | 'document';

// Lazy Thumbnail for Image/Video in file results
const FileThumbnail: React.FC<{
  file: SearchableFileItem;
}> = ({ file }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (file.mediaType === 'image' || file.mediaType === 'sticker' || file.mediaType === 'video') {
      getMediaBlobUrl(file.chatId, file.fileName).then(url => {
        if (mounted && url) {
          setBlobUrl(url);
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, [file.chatId, file.fileName, file.mediaType]);

  if (file.mediaType === 'image' || file.mediaType === 'sticker') {
    return (
      <div className="w-12 h-12 rounded-lg bg-[#202c33] flex items-center justify-center overflow-hidden flex-shrink-0 border border-[#2a3942]">
        {blobUrl ? (
          <img src={blobUrl} alt={file.fileName} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <ImageIcon className="w-5 h-5 text-[#8696a0]" />
        )}
      </div>
    );
  }

  if (file.mediaType === 'video') {
    return (
      <div className="w-12 h-12 rounded-lg bg-[#202c33] flex items-center justify-center overflow-hidden flex-shrink-0 border border-[#2a3942] relative">
        {blobUrl ? (
          <video src={blobUrl} className="w-full h-full object-cover pointer-events-none" preload="metadata" />
        ) : null}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <Video className="w-5 h-5 text-white" />
        </div>
      </div>
    );
  }

  if (file.mediaType === 'audio') {
    return (
      <div className="w-12 h-12 rounded-lg bg-[#00a884]/15 flex items-center justify-center flex-shrink-0 border border-[#00a884]/30 text-[#00a884]">
        <Mic className="w-5 h-5" />
      </div>
    );
  }

  // Document fallback
  const ext = file.fileName.split('.').pop()?.toUpperCase() || 'FILE';
  return (
    <div className="w-12 h-12 rounded-lg bg-[#53bdeb]/15 flex flex-col items-center justify-center flex-shrink-0 border border-[#53bdeb]/30 text-[#53bdeb]">
      <FileText className="w-4 h-4" />
      <span className="text-[9px] font-bold mt-0.5 tracking-tighter truncate max-w-[40px]">
        {ext.slice(0, 4)}
      </span>
    </div>
  );
};

export const GlobalFileSearch: React.FC<GlobalFileSearchProps> = ({
  files,
  onOpenMedia,
  onJumpToFile,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    let images = 0;
    let videos = 0;
    let audio = 0;
    let documents = 0;

    for (const f of files) {
      if (f.mediaType === 'image' || f.mediaType === 'sticker') images++;
      else if (f.mediaType === 'video') videos++;
      else if (f.mediaType === 'audio') audio++;
      else if (f.mediaType === 'document') documents++;
    }

    return {
      all: files.length,
      image: images,
      video: videos,
      audio: audio,
      document: documents
    };
  }, [files]);

  // Filtered files list
  const filteredFiles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return files.filter(f => {
      // Category filter
      if (activeCategory === 'image') {
        if (f.mediaType !== 'image' && f.mediaType !== 'sticker') return false;
      } else if (activeCategory === 'video') {
        if (f.mediaType !== 'video') return false;
      } else if (activeCategory === 'audio') {
        if (f.mediaType !== 'audio') return false;
      } else if (activeCategory === 'document') {
        if (f.mediaType !== 'document') return false;
      }

      // Search term filter (filename, chat title, or sender)
      if (term) {
        const matchesName = f.fileName.toLowerCase().includes(term);
        const matchesChat = f.chatName.toLowerCase().includes(term);
        const matchesSender = f.sender.toLowerCase().includes(term);
        if (!matchesName && !matchesChat && !matchesSender) {
          return false;
        }
      }

      return true;
    });
  }, [files, activeCategory, searchTerm]);

  const handleOpen = async (file: SearchableFileItem) => {
    const url = await getMediaBlobUrl(file.chatId, file.fileName);
    if (url) {
      onOpenMedia(url, file.fileName, file.mediaType, file.messageId);
    } else {
      // Jump directly if blob cannot be loaded
      onJumpToFile(file.chatId, file.messageId);
    }
  };

  const handleDownload = async (e: React.MouseEvent, file: SearchableFileItem) => {
    e.stopPropagation();
    setIsDownloading(file.id);
    try {
      const url = await getMediaBlobUrl(file.chatId, file.fileName);
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = file.fileName.replace(/^.*[\\\/]/, '').replace(/[\x00-\x1f\x7f]/g, '').trim() || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } finally {
      setIsDownloading(null);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#111b21] text-[#e9edef] select-none">
      {/* Search Input Bar */}
      <div className="p-2.5 bg-[#111b21] border-b border-[#222d34] space-y-2">
        <div className="bg-[#202c33] rounded-lg px-3 py-1.5 flex items-center gap-2.5">
          <Search className="w-4 h-4 text-[#8696a0] flex-shrink-0" />
          <input
            type="text"
            placeholder="Search files by name, chat, or sender..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#e9edef] outline-none placeholder-[#8696a0] min-w-0"
            autoFocus
          />
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm('')}
              className="text-[#8696a0] hover:text-[#e9edef] flex-shrink-0"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : onClose ? (
            <button
              onClick={onClose}
              className="text-[#8696a0] hover:text-[#e9edef] flex-shrink-0"
              title="Back to chats"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {/* Media Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-xs touch-pan-x select-none">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-[#00a884] text-white font-medium'
                : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]'
            }`}
          >
            <span>All</span>
            <span className="text-[10px] opacity-80 font-normal">({categoryCounts.all})</span>
          </button>

          <button
            onClick={() => setActiveCategory('image')}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeCategory === 'image'
                ? 'bg-[#00a884] text-white font-medium'
                : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photos</span>
            <span className="text-[10px] opacity-80 font-normal">({categoryCounts.image})</span>
          </button>

          <button
            onClick={() => setActiveCategory('video')}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeCategory === 'video'
                ? 'bg-[#00a884] text-white font-medium'
                : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Videos</span>
            <span className="text-[10px] opacity-80 font-normal">({categoryCounts.video})</span>
          </button>

          <button
            onClick={() => setActiveCategory('audio')}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeCategory === 'audio'
                ? 'bg-[#00a884] text-white font-medium'
                : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Audio</span>
            <span className="text-[10px] opacity-80 font-normal">({categoryCounts.audio})</span>
          </button>

          <button
            onClick={() => setActiveCategory('document')}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeCategory === 'document'
                ? 'bg-[#00a884] text-white font-medium'
                : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Documents</span>
            <span className="text-[10px] opacity-80 font-normal">({categoryCounts.document})</span>
          </button>
        </div>
      </div>

      {/* Results Header */}
      <div className="px-4 py-2 bg-[#182229] border-b border-[#222d34] flex items-center justify-between text-xs text-[#8696a0]">
        <span>
          Showing <strong className="text-[#e9edef]">{filteredFiles.length}</strong>{' '}
          {filteredFiles.length === 1 ? 'file' : 'files'}
        </span>
        {searchTerm && (
          <span className="italic truncate max-w-[160px]">for "{searchTerm}"</span>
        )}
      </div>

      {/* Files List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[#222d34]/40">
        {filteredFiles.length === 0 ? (
          <div className="text-center py-20 px-6 text-[#8696a0] text-sm">
            <Filter className="w-10 h-10 mx-auto mb-2 opacity-40 text-gray-500" />
            <p className="font-medium text-[#e9edef] mb-1">No files found</p>
            <p className="text-xs text-[#8696a0]">
              Try searching for a different file name, contact name, or switch category.
            </p>
          </div>
        ) : (
          filteredFiles.map(file => (
            <div
              key={file.id}
              onClick={() => handleOpen(file)}
              className="flex items-center gap-3.5 px-3.5 py-3 hover:bg-[#202c33]/80 transition-colors cursor-pointer group"
            >
              {/* Thumbnail / Icon */}
              <FileThumbnail file={file} />

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[14.5px] font-medium text-[#e9edef] truncate group-hover:text-[#00a884] transition-colors" title={file.fileName}>
                  {file.fileName}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-[#8696a0] mt-0.5">
                  <span className="text-[#00a884] font-medium truncate max-w-[120px]">
                    {file.chatName}
                  </span>
                  <span>•</span>
                  <span className="truncate">{file.sender}</span>
                </div>
                <div className="text-[11px] text-[#8696a0] mt-0.5">
                  {formatDate(file.timestamp)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Jump to Chat button */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onJumpToFile(file.chatId, file.messageId);
                  }}
                  className="p-2 rounded-full hover:bg-white/10 text-[#8696a0] hover:text-[#00a884] transition-colors"
                  title="Show in chat conversation"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>

                {/* Direct Download button */}
                <button
                  onClick={e => handleDownload(e, file)}
                  disabled={isDownloading === file.id}
                  className="p-2 rounded-full hover:bg-white/10 text-[#8696a0] hover:text-white transition-colors"
                  title="Download to your Mac"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
