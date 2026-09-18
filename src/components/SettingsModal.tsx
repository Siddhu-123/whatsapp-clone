import React, { useState } from 'react';
import {
  X,
  User,
  Shield,
  Trash2,
  Check,
  Database,
  Palette,
  HelpCircle,
  FolderSync,
  Lock,
  Download,
  ExternalLink
} from 'lucide-react';
import { SecurityConfig, ChatContact } from '../types/chat';
import { resetSecurityConfig } from '../services/crypto';
import { clearSavedMacZipHandle } from '../services/fileStorage';
import { ManageStorageView } from './Settings/ManageStorageView';

export type SettingsTab = 'profile' | 'storage' | 'privacy' | 'chats' | 'help';

interface SettingsModalProps {
  ownerName: string;
  onUpdateOwnerName: (name: string) => void;
  availableParticipants: string[];
  securityConfig: SecurityConfig | null;
  chats: ChatContact[];
  onOpenChat: (chatId: string) => void;
  onClose: () => void;
  onResetAll: () => void;
  onRelinkFile?: () => void;
  initialTab?: SettingsTab;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  ownerName,
  onUpdateOwnerName,
  availableParticipants,
  securityConfig,
  chats,
  onOpenChat,
  onClose,
  onResetAll,
  onRelinkFile,
  initialTab = 'storage'
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [selectedOwner, setSelectedOwner] = useState(ownerName);
  const [customOwner, setCustomOwner] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [autoLockVal, setAutoLockVal] = useState(securityConfig?.autoLockMinutes ?? 15);
  const [selectedWallpaper, setSelectedWallpaper] = useState<'default' | 'solid' | 'green'>('default');

  const handleSaveIdentity = () => {
    const finalName = customOwner.trim() || selectedOwner;
    if (finalName) {
      onUpdateOwnerName(finalName);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleClearAll = async () => {
    if (
      confirm(
        'Are you sure you want to disconnect your file, clear all cached storage, and reset settings?'
      )
    ) {
      await resetSecurityConfig();
      await clearSavedMacZipHandle();
      onResetAll();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 select-none text-[#e9edef] cursor-pointer animate-in fade-in duration-150"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#202c33] rounded-none sm:rounded-2xl max-w-4xl w-full h-full sm:h-[90vh] sm:max-h-[780px] border-0 sm:border border-[#2a3942] shadow-2xl flex flex-col md:flex-row overflow-hidden cursor-default"
      >
        {/* Left Settings Navigation Bar (WhatsApp Web Style) */}
        <div className="w-full md:w-64 bg-[#111b21] border-b md:border-b-0 md:border-r border-[#222d34] flex flex-col flex-shrink-0">
          {/* Header */}
          <div className="h-14 sm:h-16 px-4 flex items-center justify-between border-b border-[#222d34]">
            <h2 className="font-semibold text-base sm:text-lg text-[#e9edef]">Settings</h2>
            <button
              onClick={onClose}
              className="md:hidden w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full text-[#aebac1] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Mini Badge (Desktop Only) */}
          <div className="hidden md:flex p-4 border-b border-[#222d34] items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#00a884] text-white flex items-center justify-center font-bold text-base shadow-md flex-shrink-0">
              {ownerName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-[#e9edef] truncate">{ownerName}</p>
              <p className="text-xs text-[#8696a0] truncate">Available</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="p-1.5 sm:p-2 gap-1 md:space-y-1 overflow-x-auto md:overflow-y-auto flex md:flex-col flex-row flex-shrink-0 custom-scrollbar border-b md:border-b-0 border-[#222d34]">
            <button
              onClick={() => setActiveTab('storage')}
              className={`flex items-center gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all text-left whitespace-nowrap cursor-pointer ${
                activeTab === 'storage'
                  ? 'bg-[#2a3942] text-[#00a884]'
                  : 'text-[#8696a0] hover:bg-[#202c33] hover:text-[#e9edef]'
              }`}
            >
              <Database className="w-4 h-4 flex-shrink-0" />
              <span>Storage & Data</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all text-left whitespace-nowrap cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-[#2a3942] text-[#00a884]'
                  : 'text-[#8696a0] hover:bg-[#202c33] hover:text-[#e9edef]'
              }`}
            >
              <User className="w-4 h-4 flex-shrink-0" />
              <span>Profile & Identity</span>
            </button>

            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all text-left whitespace-nowrap cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-[#2a3942] text-[#00a884]'
                  : 'text-[#8696a0] hover:bg-[#202c33] hover:text-[#e9edef]'
              }`}
            >
              <Shield className="w-4 h-4 flex-shrink-0" />
              <span>Privacy & Security</span>
            </button>

            <button
              onClick={() => setActiveTab('chats')}
              className={`flex items-center gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all text-left whitespace-nowrap cursor-pointer ${
                activeTab === 'chats'
                  ? 'bg-[#2a3942] text-[#00a884]'
                  : 'text-[#8696a0] hover:bg-[#202c33] hover:text-[#e9edef]'
              }`}
            >
              <Palette className="w-4 h-4 flex-shrink-0" />
              <span>Chats & Wallpaper</span>
            </button>

            <button
              onClick={() => setActiveTab('help')}
              className={`flex items-center gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all text-left whitespace-nowrap cursor-pointer ${
                activeTab === 'help'
                  ? 'bg-[#2a3942] text-[#00a884]'
                  : 'text-[#8696a0] hover:bg-[#202c33] hover:text-[#e9edef]'
              }`}
            >
              <HelpCircle className="w-4 h-4 flex-shrink-0" />
              <span>Archive & Reset</span>
            </button>
          </div>
        </div>

        {/* Right Tab Content Area */}
        <div className="flex-1 flex flex-col bg-[#202c33] min-w-0">
          {/* Content Header (Desktop Close Button) */}
          <div className="h-16 px-6 bg-[#202c33] border-b border-[#2a3942] hidden md:flex items-center justify-between">
            <h3 className="font-semibold text-base text-[#e9edef] capitalize">
              {activeTab === 'storage' && 'Storage and Data'}
              {activeTab === 'profile' && 'Profile & Identity'}
              {activeTab === 'privacy' && 'Privacy & Security'}
              {activeTab === 'chats' && 'Chats & Wallpaper'}
              {activeTab === 'help' && 'Archive Management & Reset'}
            </h3>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full text-[#aebac1] hover:text-white transition-colors cursor-pointer"
              title="Close Settings (or press Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            {/* TAB 1: Storage and Data */}
            {activeTab === 'storage' && (
              <ManageStorageView
                chats={chats}
                onOpenChat={chatId => {
                  onClose();
                  onOpenChat(chatId);
                }}
              />
            )}

            {/* TAB 2: Profile & Identity */}
            {activeTab === 'profile' && (
              <div className="max-w-lg space-y-6">
                <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4 pb-6 border-b border-[#2a3942]">
                  <div className="w-20 h-20 rounded-full bg-[#00a884] text-white flex items-center justify-center font-bold text-2xl shadow-lg flex-shrink-0">
                    {ownerName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="space-y-1 text-center sm:text-left">
                    <h4 className="text-base font-semibold text-[#e9edef]">Your Identity</h4>
                    <p className="text-xs text-[#8696a0]">
                      Messages sent by this name are marked as outgoing (right-hand green bubbles).
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold text-[#00a884] uppercase tracking-wider block">
                    Select Identity Name
                  </label>
                  <select
                    value={selectedOwner}
                    onChange={e => {
                      setSelectedOwner(e.target.value);
                      setCustomOwner('');
                    }}
                    className="w-full bg-[#111b21] border border-[#2a3942] rounded-lg px-3 py-2.5 text-sm text-[#e9edef] outline-none cursor-pointer"
                  >
                    {availableParticipants.map(p => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>

                  <div className="pt-2">
                    <label className="text-xs text-[#8696a0] block mb-1">
                      Or enter custom sender name:
                    </label>
                    <input
                      type="text"
                      placeholder="Type custom name..."
                      value={customOwner}
                      onChange={e => setCustomOwner(e.target.value)}
                      className="w-full bg-[#111b21] border border-[#2a3942] rounded-lg px-3 py-2 text-sm text-[#e9edef] outline-none placeholder-[#8696a0]"
                    />
                  </div>

                  <button
                    onClick={handleSaveIdentity}
                    className="px-5 py-2.5 bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-semibold rounded-lg shadow flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isSaved ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Saved Successfully!</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>

                <div className="pt-4 border-t border-[#2a3942] space-y-2">
                  <label className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider block">
                    About
                  </label>
                  <div className="bg-[#111b21] p-3 rounded-lg text-xs text-[#e9edef]">
                    Hey there! I am using WhatsApp.
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Privacy & Security */}
            {activeTab === 'privacy' && (
              <div className="max-w-lg space-y-6">
                <div className="bg-[#111b21] p-4 rounded-xl border border-[#2a3942] space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#00a884]">
                    <Shield className="w-4 h-4" />
                    <span>Authentication & Encryption</span>
                  </div>
                  <p className="text-xs text-[#8696a0]">
                    Your session is locked with AES-GCM 256-bit encryption derived via PBKDF2 from your deterministic password generator extension.
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-[#202c33] p-2.5 rounded-lg border border-[#2a3942]">
                      <span className="text-[#8696a0] block text-[11px]">Method</span>
                      <span className="font-medium text-[#00a884]">Extension Password</span>
                    </div>
                    <div className="bg-[#202c33] p-2.5 rounded-lg border border-[#2a3942]">
                      <span className="text-[#8696a0] block text-[11px]">Cipher</span>
                      <span className="font-mono text-[#e9edef]">AES-GCM 256</span>
                    </div>
                  </div>
                </div>

                {/* Auto-Lock Settings */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#00a884] uppercase tracking-wider">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Screen Lock / Auto-Lock</span>
                  </div>
                  <p className="text-xs text-[#8696a0]">
                    Automatically lock the screen after a period of inactivity on this device.
                  </p>

                  <select
                    value={autoLockVal}
                    onChange={e => setAutoLockVal(parseInt(e.target.value, 10))}
                    className="w-full bg-[#111b21] border border-[#2a3942] rounded-lg px-3 py-2.5 text-sm text-[#e9edef] outline-none cursor-pointer"
                  >
                    <option value={1}>After 1 minute of inactivity</option>
                    <option value={15}>After 15 minutes of inactivity (Recommended)</option>
                    <option value={60}>After 1 hour</option>
                    <option value={0}>Only on tab close</option>
                  </select>
                </div>

                {/* Zero Network Privacy Notice */}
                <div className="p-4 bg-[#00a884]/10 rounded-xl border border-[#00a884]/30 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-[#00a884]">
                    <Check className="w-4 h-4" />
                    <span>100% Client-Side Private</span>
                  </div>
                  <p className="text-[#8696a0] leading-relaxed">
                    Zero network requests are made with your messages, media, or passwords. Everything runs strictly in your local Mac browser.
                  </p>
                </div>

                {/* Secret Password Generator Extension Spotlight Card */}
                <div className="bg-[#111b21] p-4 rounded-xl border border-[#00a884]/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔐</span>
                      <h4 className="text-sm font-semibold text-[#e9edef]">
                        Secret Password Generator
                      </h4>
                    </div>
                    <span className="text-[10px] bg-[#00a884]/20 text-[#00a884] font-medium px-2.5 py-0.5 rounded-full">
                      Free Extension
                    </span>
                  </div>
                  <p className="text-xs text-[#8696a0] leading-relaxed">
                    A private deterministic password generator Chrome extension. Derives 12-character passwords on-the-fly using 600,000 PBKDF2 rounds, crying cat masking, and 20-second clipboard clearing with zero cloud storage.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <a
                      href="https://chromewebstore.google.com/detail/secret-password-generator/mfgnlfigpdcgfmndaljciagcgjiicnal"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center shadow"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Chrome Web Store</span>
                    </a>
                    <a
                      href="./secret-password-generator.zip"
                      download="secret-password-generator.zip"
                      className="py-2 px-3 bg-[#202c33] hover:bg-[#2a3942] border border-[#2a3942] text-gray-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                      title="Download offline zip"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download (.zip)</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Chats & Wallpaper */}
            {activeTab === 'chats' && (
              <div className="max-w-lg space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#00a884] uppercase tracking-wider">
                    <Palette className="w-3.5 h-3.5" />
                    <span>Chat Wallpaper</span>
                  </div>
                  <p className="text-xs text-[#8696a0]">
                    Customize the background of your WhatsApp chat conversation screen.
                  </p>

                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <button
                      onClick={() => setSelectedWallpaper('default')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs transition-all cursor-pointer ${
                        selectedWallpaper === 'default'
                          ? 'border-[#00a884] bg-[#00a884]/15 text-[#e9edef]'
                          : 'border-[#2a3942] bg-[#111b21] text-[#8696a0] hover:text-[#e9edef]'
                      }`}
                    >
                      <div className="w-full h-14 rounded bg-[#0b141a] flex items-center justify-center text-[10px] text-[#8696a0] border border-[#222d34]">
                        Doodle
                      </div>
                      <span className="font-medium">WhatsApp Doodle</span>
                    </button>

                    <button
                      onClick={() => setSelectedWallpaper('solid')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs transition-all cursor-pointer ${
                        selectedWallpaper === 'solid'
                          ? 'border-[#00a884] bg-[#00a884]/15 text-[#e9edef]'
                          : 'border-[#2a3942] bg-[#111b21] text-[#8696a0] hover:text-[#e9edef]'
                      }`}
                    >
                      <div className="w-full h-14 rounded bg-[#111b21] flex items-center justify-center text-[10px] text-[#8696a0] border border-[#222d34]">
                        Dark
                      </div>
                      <span className="font-medium">Solid Dark</span>
                    </button>

                    <button
                      onClick={() => setSelectedWallpaper('green')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs transition-all cursor-pointer ${
                        selectedWallpaper === 'green'
                          ? 'border-[#00a884] bg-[#00a884]/15 text-[#e9edef]'
                          : 'border-[#2a3942] bg-[#111b21] text-[#8696a0] hover:text-[#e9edef]'
                      }`}
                    >
                      <div className="w-full h-14 rounded bg-[#06241e] flex items-center justify-center text-[10px] text-[#00a884] border border-[#0b3d33]">
                        Classic
                      </div>
                      <span className="font-medium">Classic Green</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#2a3942] space-y-3">
                  <label className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider block">
                    Theme
                  </label>
                  <div className="bg-[#111b21] p-3 rounded-lg text-xs flex items-center justify-between text-[#e9edef]">
                    <span>Color Theme</span>
                    <span className="text-[#00a884] font-medium">WhatsApp Dark (Default)</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: Archive & Reset */}
            {activeTab === 'help' && (
              <div className="max-w-lg space-y-6">
                {/* Archive File Link */}
                <div className="bg-[#111b21] p-4 rounded-xl border border-[#2a3942] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#00a884]">
                      <FolderSync className="w-4 h-4" />
                      <span>Mac Local Zip Connection</span>
                    </div>
                    <span className="text-xs text-[#00a884] bg-[#00a884]/15 px-2 py-0.5 rounded-full">
                      Connected
                    </span>
                  </div>
                  <p className="text-xs text-[#8696a0]">
                    Your chats and media are read directly from your local WhatsApp export zip file on this Mac via the browser File System Access API.
                  </p>

                  {onRelinkFile && (
                    <button
                      onClick={() => {
                        onClose();
                        onRelinkFile();
                      }}
                      className="px-4 py-2 bg-[#202c33] hover:bg-[#2a3942] text-xs font-semibold rounded-lg border border-[#2a3942] text-[#e9edef] transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <FolderSync className="w-4 h-4 text-[#00a884]" />
                      <span>Switch / Re-link Zip File</span>
                    </button>
                  )}
                </div>

                {/* Reset Section */}
                <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-red-400">
                    <Trash2 className="w-4 h-4" />
                    <span>Disconnect File & Clear All Storage</span>
                  </div>
                  <p className="text-xs text-[#8696a0] leading-relaxed">
                    Removes all cached chats from IndexedDB, disconnects the Mac local zip file handle, and resets all encryption settings from this browser.
                  </p>
                  <button
                    onClick={handleClearAll}
                    className="w-full py-2.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-semibold rounded-lg border border-red-500/40 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Disconnect File & Reset Settings</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
