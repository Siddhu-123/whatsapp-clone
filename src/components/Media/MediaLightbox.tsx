import React, { useEffect, useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, MessageSquare } from 'lucide-react';
import { MediaType } from '../../types/chat';

interface MediaLightboxProps {
  url: string;
  fileName: string;
  mediaType: MediaType;
  messageId?: string;
  onJumpToMessage?: (messageId: string) => void;
  onClose: () => void;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({
  url,
  fileName,
  mediaType,
  messageId,
  onJumpToMessage,
  onClose
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace(/^.*[\\\/]/, '').trim() || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleJump = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (messageId && onJumpToMessage) {
      onClose();
      onJumpToMessage(messageId);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col backdrop-blur-sm select-none cursor-pointer"
    >
      {/* Top action bar - stop propagation so clicks inside don't close the modal */}
      <div
        onClick={e => e.stopPropagation()}
        className="flex items-center justify-between p-3 sm:p-4 text-gray-200 border-b border-white/10 bg-black/40 z-10 cursor-default"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs sm:text-sm font-medium text-gray-300 truncate max-w-[110px] sm:max-w-md">
            {fileName}
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {messageId && onJumpToMessage && (
            <button
              onClick={handleJump}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow cursor-pointer"
              title="Show this message in the chat conversation"
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Show in chat</span>
            </button>
          )}

          {mediaType === 'image' && (
            <>
              <button
                onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                className="hidden sm:flex w-10 h-10 items-center justify-center rounded-full hover:bg-white/15 transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                className="hidden sm:flex w-10 h-10 items-center justify-center rounded-full hover:bg-white/15 transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={() => setRotation(r => (r + 90) % 360)}
                className="hidden sm:flex w-10 h-10 items-center justify-center rounded-full hover:bg-white/15 transition-colors cursor-pointer"
                title="Rotate"
              >
                <RotateCw className="w-5 h-5" />
              </button>
            </>
          )}

          <button
            onClick={handleDownload}
            className="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors cursor-pointer"
            title="Download"
          >
            <Download className="w-4 sm:w-5 h-4 sm:h-5" />
          </button>
          <button
            onClick={onClose}
            className="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
            title="Close (Esc or click outside)"
          >
            <X className="w-4 sm:w-5 h-4 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Main View Area - Clicking outside the media closes */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
        {mediaType === 'image' || mediaType === 'sticker' ? (
          <img
            src={url}
            alt={fileName}
            onClick={e => e.stopPropagation()}
            className="max-w-full max-h-[85vh] object-contain transition-transform duration-150 ease-out cursor-default shadow-2xl"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`
            }}
          />
        ) : mediaType === 'video' ? (
          <video
            src={url}
            controls
            autoPlay
            onClick={e => e.stopPropagation()}
            className="max-w-full max-h-[85vh] rounded-lg shadow-2xl cursor-default"
          />
        ) : (
          <div
            onClick={e => e.stopPropagation()}
            className="text-white text-center cursor-default"
          >
            <p className="text-lg">Preview not available for this file type.</p>
            <button
              onClick={handleDownload}
              className="mt-4 px-5 py-2.5 bg-[#00a884] text-white rounded-md flex items-center gap-2 mx-auto cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download File
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
