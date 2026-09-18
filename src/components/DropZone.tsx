import React, { useState, useRef } from 'react';
import { UploadCloud, FolderLock, ShieldCheck, FileArchive, Laptop } from 'lucide-react';
import { isFileSystemAccessSupported } from '../services/fileStorage';
import { ParseProgress } from '../services/zipParser';

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  onLinkMacZip: () => void;
  progress: ParseProgress | null;
  linkedFileName?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFileSelected,
  onLinkMacZip,
  progress,
  linkedFileName
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileSelected(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const hasFSAccess = isFileSystemAccessSupported();

  return (
    <div className="w-full min-h-full flex items-center justify-center bg-[#111b21] p-3 sm:p-8 overflow-y-auto select-none text-[#e9edef]">
      <div className="max-w-xl w-full bg-[#202c33] rounded-2xl p-5 sm:p-10 my-auto shadow-2xl border border-[#2a3942] flex flex-col items-center text-center">
        {/* WhatsApp Icon */}
        <div className="w-20 h-20 rounded-full bg-[#00a884]/20 border-2 border-[#00a884] flex items-center justify-center text-[#00a884] mb-5 shadow-lg">
          <FileArchive className="w-10 h-10" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-2">WhatsApp Web Export Viewer</h1>
        <p className="text-sm text-[#8696a0] mb-8 max-w-md">
          View your chats, voice notes, stickers, photos, and videos exactly like WhatsApp Web.
        </p>

        {/* Progress State */}
        {progress ? (
          <div className="w-full bg-[#111b21] p-6 rounded-xl border border-[#2a3942] space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-[#00a884]">{progress.status}</span>
              <span className="text-[#8696a0] font-mono">{progress.percent}%</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-[#2a3942] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00a884] transition-all duration-300 ease-out"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            {progress.currentChat && (
              <p className="text-xs text-[#8696a0] truncate">
                Processing: {progress.currentChat}
              </p>
            )}
          </div>
        ) : (
          <div className="w-full space-y-5">
            {/* Mac Browser Auto-Login Connector */}
            {hasFSAccess && (
              <div className="bg-[#111b21] p-4 rounded-xl border border-[#00a884]/40 flex flex-col items-center text-center">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#00a884] mb-1">
                  <Laptop className="w-4 h-4" />
                  <span>Mac Local Storage Auto-Login</span>
                </div>
                <p className="text-xs text-[#8696a0] mb-3 max-w-sm">
                  Select your Mac's <code className="text-gray-300">whatsapp_exports.zip</code> once.
                  The browser securely remembers it so you never have to re-upload!
                </p>
                <button
                  onClick={onLinkMacZip}
                  className="px-5 py-2.5 bg-[#00a884] hover:bg-[#008f6f] text-white font-medium text-sm rounded-lg shadow-md transition-colors flex items-center gap-2"
                >
                  <FolderLock className="w-4 h-4" />
                  <span>{linkedFileName ? `Reconnect ${linkedFileName}` : 'Link Mac Zip File'}</span>
                </button>
              </div>
            )}

            {/* Drag & Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all flex flex-col items-center justify-center ${
                isDragOver
                  ? 'border-[#00a884] bg-[#00a884]/10 scale-[1.01]'
                  : 'border-[#3b4a54] hover:border-[#00a884]/70 bg-[#111b21]/50 hover:bg-[#111b21]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={e => {
                  if (e.target.files && e.target.files.length > 0) {
                    onFileSelected(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <UploadCloud className="w-10 h-10 text-[#8696a0] mb-3 group-hover:text-[#00a884]" />
              <p className="text-sm font-medium mb-1">
                Drag & drop your <span className="text-[#00a884]">WhatsApp .zip</span> here
              </p>
              <p className="text-xs text-[#8696a0]">
                Supports master multi-chat exports or individual chat zips
              </p>
            </div>
          </div>
        )}

        {/* Security & Privacy Guarantee */}
        <div className="mt-8 flex items-center gap-2 text-xs text-[#8696a0]">
          <ShieldCheck className="w-4 h-4 text-[#00a884]" />
          <span>100% Client-Side Privacy: No data leaves your computer.</span>
        </div>
      </div>
    </div>
  );
};
