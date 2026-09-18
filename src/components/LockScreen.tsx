import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, Laptop, KeyRound, Download, ExternalLink, X } from 'lucide-react';
import { SecurityConfig, FileHandleMetadata } from '../types/chat';
import { authenticate, setupSecurity } from '../services/crypto';

interface LockScreenProps {
  config: SecurityConfig | null;
  fileMetadata: FileHandleMetadata | null;
  onUnlocked: () => void;
  onRelinkFile: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  config,
  fileMetadata,
  onUnlocked,
  onRelinkFile
}) => {
  const isSetup = !config || !config.isConfigured;

  const [passwordInput, setPasswordInput] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmed = passwordInput.trim();
    if (!trimmed) {
      setErrorMsg('Please enter or paste your password');
      triggerShake();
      return;
    }

    setIsAuthenticating(true);
    try {
      if (isSetup) {
        // First time: secure local storage with this password
        await setupSecurity(trimmed, 15, rememberMe);
        onUnlocked();
      } else {
        // Returning visit: verify password
        const ok = await authenticate(trimmed, rememberMe);
        if (ok) {
          onUnlocked();
        } else {
          setErrorMsg('Incorrect password. Please generate it from your extension and try again.');
          triggerShake();
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication error');
      triggerShake();
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="w-full min-h-[100dvh] flex items-center justify-center bg-[#0c1317] p-3 sm:p-4 overflow-y-auto select-none text-[#e9edef]">
      <div
        className={`max-w-md w-full bg-[#202c33] rounded-2xl p-5 sm:p-8 my-auto shadow-2xl border border-[#2a3942] flex flex-col items-center text-center transition-transform ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        {/* Padlock Icon */}
        <div className="w-16 h-16 rounded-full bg-[#00a884]/20 border border-[#00a884] flex items-center justify-center text-[#00a884] mb-4 shadow-lg">
          <Lock className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold mb-1">WhatsApp is Locked</h1>
        <p className="text-xs text-[#8696a0] mb-6">
          {isSetup
            ? 'Generate your password with your browser extension and paste it here to secure your chats.'
            : 'Paste your password generated from your browser extension to unlock.'}
        </p>

        {/* Mac File Connection Badge */}
        {fileMetadata && (
          <div className="w-full bg-[#111b21] px-3.5 py-2.5 rounded-xl border border-[#2a3942] flex items-center justify-between text-xs mb-6">
            <div className="flex items-center gap-2 min-w-0">
              <Laptop className="w-4 h-4 text-[#00a884] flex-shrink-0" />
              <div className="text-left truncate">
                <span className="text-gray-300 font-medium block truncate">
                  {fileMetadata.name}
                </span>
                <span className="text-[10px] text-[#8696a0]">
                  {(fileMetadata.size / (1024 * 1024)).toFixed(1)} MB on this Mac
                </span>
              </div>
            </div>
            <button
              onClick={onRelinkFile}
              className="text-[#00a884] hover:underline text-[11px] ml-2 flex-shrink-0"
            >
              Change File
            </button>
          </div>
        )}

        {/* Unlock Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="text-left space-y-1.5">
            <label className="text-[11px] font-medium text-[#8696a0] flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#00a884]" />
              <span>Password</span>
            </label>
            <input
              type="password"
              placeholder="Paste password from your extension"
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              className="w-full bg-[#111b21] border border-[#2a3942] focus:border-[#00a884] rounded-lg px-3.5 py-2.5 text-sm text-[#e9edef] outline-none placeholder-[#8696a0]/60 font-mono tracking-wider"
              autoFocus
            />
            <p className="text-[10px] text-[#8696a0] pt-0.5">
              Click your Secret Password extension icon in the toolbar, generate the password, and paste it here.
            </p>
          </div>

          {/* Stay signed in checkbox */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-gray-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#00a884] accent-[#00a884] cursor-pointer"
              />
              <span>Keep me signed in on this Mac</span>
            </label>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 text-left">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full py-2.5 bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            {isAuthenticating ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Unlock WhatsApp</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Secret Password Generator Extension Spotlight Card */}
        <div className="w-full mt-5 p-3.5 bg-[#111b21] rounded-xl border border-[#00a884]/40 text-left space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🔐</span>
              <span className="text-xs font-semibold text-[#e9edef]">Secret Password Generator</span>
            </div>
            <span className="text-[10px] bg-[#00a884]/20 text-[#00a884] font-medium px-2 py-0.5 rounded-full">
              Chrome Web Store
            </span>
          </div>
          <p className="text-[11px] text-[#8696a0] leading-relaxed">
            Generate your 12-character master secret password on-the-fly using the official Chrome extension. Zero cloud storage.
          </p>
          <div className="flex items-center gap-2 pt-0.5">
            <a
              href="https://chromewebstore.google.com/detail/secret-password-generator/mfgnlfigpdcgfmndaljciagcgjiicnal"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 px-3 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Get on Chrome Web Store</span>
            </a>
            <button
              type="button"
              onClick={() => setShowExtensionModal(true)}
              className="py-2 px-2.5 bg-[#202c33] hover:bg-[#2a3942] text-gray-300 border border-[#2a3942] rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              How it works
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-[#8696a0]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00a884]" />
          <span>Secured client-side with AES-GCM 256-bit encryption</span>
        </div>
      </div>

      {/* Extension Installation Guide Modal */}
      {showExtensionModal && (
        <div
          onClick={() => setShowExtensionModal(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none text-[#e9edef] cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-[#202c33] rounded-2xl max-w-md w-full border border-[#2a3942] shadow-2xl p-6 space-y-4 cursor-default text-left"
          >
            <div className="flex items-center justify-between border-b border-[#2a3942] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔐</span>
                <h3 className="font-semibold text-base text-[#e9edef]">Secret Password Generator</h3>
              </div>
              <button
                onClick={() => setShowExtensionModal(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-[#8696a0] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#8696a0] leading-relaxed">
              The official <strong>Secret Password Generator</strong> Chrome extension derives fixed 12-character passwords locally from your secret phrase using 600,000 PBKDF2 iterations with zero passwords stored anywhere.
            </p>

            <div className="space-y-2.5 text-xs text-gray-300">
              <h4 className="font-semibold text-[#00a884] uppercase tracking-wider text-[11px]">
                How to Use with WhatsApp Web:
              </h4>
              <div className="bg-[#111b21] p-3 rounded-lg space-y-2">
                <p>
                  <strong>1. Install:</strong> Click the button below to install directly from the official Chrome Web Store.
                </p>
                <p>
                  <strong>2. Open Extension:</strong> Click the extension icon in your browser toolbar and type your personal secret word.
                </p>
                <p>
                  <strong>3. Unlock:</strong> Click the crying cat masked password to copy, then paste it here into WhatsApp to unlock!
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <a
                href="https://chromewebstore.google.com/detail/secret-password-generator/mfgnlfigpdcgfmndaljciagcgjiicnal"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-3 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors text-center shadow"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Add to Chrome (Official Web Store)</span>
              </a>
              <a
                href="./secret-password-generator.zip"
                download="secret-password-generator.zip"
                className="py-2.5 px-3 bg-[#111b21] hover:bg-[#202c33] border border-[#2a3942] text-gray-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors text-center"
                title="Download offline zip"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Offline .zip</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
