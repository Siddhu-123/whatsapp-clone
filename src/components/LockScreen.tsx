import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, Laptop, KeyRound } from 'lucide-react';
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
            className="w-full py-2.5 bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 mt-2"
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

        <div className="mt-6 flex items-center gap-1.5 text-[11px] text-[#8696a0]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00a884]" />
          <span>Secured client-side with AES-GCM 256-bit encryption</span>
        </div>
      </div>
    </div>
  );
};
