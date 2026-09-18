import React, { useState, useEffect } from 'react';
import { X, User, Shield, Trash2, Check, Database } from 'lucide-react';
import { SecurityConfig } from '../types/chat';
import { resetSecurityConfig } from '../services/crypto';
import { clearSavedMacZipHandle } from '../services/fileStorage';

interface SettingsModalProps {
  ownerName: string;
  onUpdateOwnerName: (name: string) => void;
  availableParticipants: string[];
  securityConfig: SecurityConfig | null;
  onClose: () => void;
  onResetAll: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  ownerName,
  onUpdateOwnerName,
  availableParticipants,
  securityConfig,
  onClose,
  onResetAll
}) => {
  const [selectedOwner, setSelectedOwner] = useState(ownerName);
  const [customOwner, setCustomOwner] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [storageStats, setStorageStats] = useState<{ usedMb: string; percentQuota: string } | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      navigator.storage
        .estimate()
        .then(({ usage, quota }) => {
          if (usage !== undefined) {
            const mb = (usage / (1024 * 1024)).toFixed(2);
            const pct = quota ? ((usage / quota) * 100).toFixed(4) : '< 0.01';
            setStorageStats({ usedMb: `${mb} MB`, percentQuota: `${pct}%` });
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleSaveIdentity = () => {
    const finalName = customOwner.trim() || selectedOwner;
    if (finalName) {
      onUpdateOwnerName(finalName);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to disconnect your file and reset settings?')) {
      await resetSecurityConfig();
      await clearSavedMacZipHandle();
      onResetAll();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none text-[#e9edef] cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#202c33] rounded-2xl max-w-md w-full border border-[#2a3942] shadow-2xl flex flex-col overflow-hidden cursor-default"
      >
        {/* Header */}
        <div className="h-14 px-4 bg-[#111b21] flex items-center justify-between border-b border-[#222d34]">
          <h2 className="font-semibold text-base">WhatsApp Settings</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full text-[#aebac1] hover:text-white transition-colors cursor-pointer"
            title="Close Settings (or click outside)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Identity Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#00a884]">
              <User className="w-4 h-4" />
              <span>Identity ("Who is You?")</span>
            </div>
            <p className="text-xs text-[#8696a0]">
              Select which sender name represents you. Outgoing messages will appear as green bubbles on the right.
            </p>

            <select
              value={selectedOwner}
              onChange={e => {
                setSelectedOwner(e.target.value);
                setCustomOwner('');
              }}
              className="w-full bg-[#111b21] border border-[#2a3942] rounded-lg px-3 py-2 text-sm text-[#e9edef] outline-none"
            >
              {availableParticipants.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <div className="pt-1">
              <input
                type="text"
                placeholder="Or type a custom name..."
                value={customOwner}
                onChange={e => setCustomOwner(e.target.value)}
                className="w-full bg-[#111b21] border border-[#2a3942] rounded-lg px-3 py-1.5 text-xs text-[#e9edef] outline-none placeholder-[#8696a0]"
              />
            </div>

            <button
              onClick={handleSaveIdentity}
              className="px-4 py-2 bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-semibold rounded-md shadow flex items-center gap-1.5 transition-colors"
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Update Identity</span>
              )}
            </button>
          </div>

          {/* Security Status */}
          <div className="pt-4 border-t border-[#2a3942] space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#00a884]">
              <Shield className="w-4 h-4" />
              <span>Security & Encryption</span>
            </div>
            <div className="bg-[#111b21] p-3 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#8696a0]">Protection:</span>
                <span className="font-medium text-[#00a884]">Extension Password</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8696a0]">Cipher:</span>
                <span className="font-mono text-gray-300">AES-GCM 256</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8696a0]">Auto-Lock:</span>
                <span className="text-gray-300">
                  {securityConfig?.autoLockMinutes
                    ? `${securityConfig.autoLockMinutes} minutes`
                    : 'On tab close'}
                </span>
              </div>
            </div>
          </div>

          {/* Browser Storage Usage */}
          <div className="pt-4 border-t border-[#2a3942] space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#00a884]">
              <Database className="w-4 h-4" />
              <span>Browser Storage Footprint</span>
            </div>
            <div className="bg-[#111b21] p-3 rounded-lg text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#8696a0]">Storage Used:</span>
                <span className="font-semibold text-[#00a884]">
                  {storageStats ? storageStats.usedMb : 'Estimating...'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8696a0]">Quota Used:</span>
                <span className="text-gray-300">
                  {storageStats ? storageStats.percentQuota : '< 0.01%'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8696a0]">Media Storage:</span>
                <span className="text-[#8696a0]">0 MB (streamed from Mac)</span>
              </div>
            </div>
            <p className="text-[11px] text-[#8696a0] leading-relaxed">
              Only text is cached for instant reload (~50ms). Photos, audio notes, and videos remain strictly inside your Mac's zip file.
            </p>
          </div>

          {/* Reset / Unlink */}
          <div className="pt-4 border-t border-[#2a3942] space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-400">
              <Trash2 className="w-4 h-4" />
              <span>Disconnect & Reset</span>
            </div>
            <p className="text-xs text-[#8696a0]">
              Removes the Mac local zip file handle and resets encryption settings from this browser.
            </p>
            <button
              onClick={handleClearAll}
              className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg border border-red-500/30 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Disconnect File & Reset Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
