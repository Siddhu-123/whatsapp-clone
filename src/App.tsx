import React, { useState, useEffect, useCallback } from 'react';
import {
  ChatContact,
  SecurityConfig,
  FileHandleMetadata,
  MediaType
} from './types/chat';
import {
  getSecurityConfig,
  isSessionUnlocked,
  lockSession,
  checkAutoLock,
  updateActivity
} from './services/crypto';
import {
  getSavedMacZipHandle,
  getSavedFileMetadata,
  pickAndSaveMacZipFile,
  readMacZipFile,
  verifyHandlePermission
} from './services/fileStorage';
import {
  parseWhatsAppZip,
  ParseProgress,
  clearMediaCache
} from './services/zipParser';
import { DropZone } from './components/DropZone';
import { LockScreen } from './components/LockScreen';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ChatView } from './components/Chat/ChatView';
import { MediaLightbox } from './components/Media/MediaLightbox';
import { SettingsModal } from './components/SettingsModal';
import { MessageSquare } from 'lucide-react';

export const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig | null>(null);
  const [fileMetadata, setFileMetadata] = useState<FileHandleMetadata | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [showLockSetup, setShowLockSetup] = useState(false);

  const [chats, setChats] = useState<ChatContact[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState<string>('You');
  const [progress, setProgress] = useState<ParseProgress | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [targetJumpMessageId, setTargetJumpMessageId] = useState<string | null>(null);
  const [lightboxMedia, setLightboxMedia] = useState<{
    url: string;
    fileName: string;
    mediaType: MediaType;
    messageId?: string;
  } | null>(null);

  // Active chat reference
  const activeChat = chats.find(c => c.id === activeChatId) || null;

  // Process a loaded zip file
  const processZipFile = useCallback(async (file: File) => {
    try {
      const result = await parseWhatsAppZip(file, p => setProgress(p));
      setChats(result.chats);
      setOwnerName(result.detectedOwnerName);
      if (result.chats.length > 0) {
        setActiveChatId(result.chats[0].id);
      }
    } catch (err: any) {
      console.error('Failed to parse WhatsApp export:', err);
      alert('Error parsing zip file: ' + (err?.message || 'Invalid format'));
    } finally {
      setProgress(null);
    }
  }, []);

  // Check saved credentials and file handle on boot
  useEffect(() => {
    const init = async () => {
      try {
        const secConfig = await getSecurityConfig();
        const meta = await getSavedFileMetadata();
        setSecurityConfig(secConfig);
        setFileMetadata(meta);

        if (secConfig && secConfig.isConfigured) {
          // Locked by default until user enters password/secret
          setIsLocked(true);
        } else if (meta) {
          // Has file but no password set up yet
          setShowLockSetup(true);
        }
      } catch (err) {
        console.warn('Init error:', err);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  // Listen for user activity to manage auto-lock
  useEffect(() => {
    const handleUserActivity = () => {
      updateActivity();
    };
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);

    const interval = setInterval(() => {
      if (securityConfig && !isLocked && isSessionUnlocked()) {
        const shouldLock = checkAutoLock(securityConfig.autoLockMinutes || 15);
        if (shouldLock) {
          setIsLocked(true);
        }
      }
    }, 30000);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      clearInterval(interval);
    };
  }, [securityConfig, isLocked]);

  // Handle Unlocked callback from LockScreen
  const handleUnlocked = async () => {
    setIsLocked(false);
    setShowLockSetup(false);
    const updatedSec = await getSecurityConfig();
    setSecurityConfig(updatedSec);

    // If chats aren't loaded yet, try to load from the Mac linked file!
    if (chats.length === 0) {
      const handle = await getSavedMacZipHandle();
      if (handle) {
        try {
          const hasPerm = await verifyHandlePermission(handle, true);
          if (hasPerm) {
            const file = await readMacZipFile(handle);
            await processZipFile(file);
          }
        } catch (err) {
          console.warn('Could not read saved file handle automatically:', err);
        }
      }
    }
  };

  // Link Mac zip file via File System Access API
  const handleLinkMacZip = async () => {
    try {
      const { file } = await pickAndSaveMacZipFile();
      setFileMetadata({
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        type: file.type
      });

      const secConfig = await getSecurityConfig();
      if (!secConfig || !secConfig.isConfigured) {
        // Prompt password setup immediately to secure the data
        setShowLockSetup(true);
      } else {
        await processZipFile(file);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Failed to pick file:', err);
      }
    }
  };

  // Drag & drop file selection
  const handleFileDrop = async (file: File) => {
    const secConfig = await getSecurityConfig();
    if (!secConfig || !secConfig.isConfigured) {
      setShowLockSetup(true);
    }
    await processZipFile(file);
  };

  const handleManualLock = () => {
    lockSession();
    setIsLocked(true);
  };

  const handleResetAll = () => {
    clearMediaCache();
    setChats([]);
    setActiveChatId(null);
    setSecurityConfig(null);
    setFileMetadata(null);
    setIsLocked(false);
    setShowLockSetup(false);
    setShowSettings(false);
  };

  const handleUpdateOwnerName = (newName: string) => {
    setOwnerName(newName);
    // Re-evaluate outgoing messages
    setChats(prevChats =>
      prevChats.map(c => ({
        ...c,
        messages: c.messages.map(m => ({
          ...m,
          isOutgoing:
            m.sender.toLowerCase() === newName.toLowerCase() ||
            m.sender.toLowerCase() === 'you'
        }))
      }))
    );
  };

  // Collect all unique senders across chats for identity picker
  const allSenders = React.useMemo(() => {
    const s = new Set<string>();
    s.add(ownerName);
    chats.forEach(c => c.participants.forEach(p => s.add(p)));
    return Array.from(s).filter(Boolean);
  }, [chats, ownerName]);

  if (isInitializing) {
    return (
      <div className="w-screen h-screen bg-[#0c1317] flex items-center justify-center text-[#00a884]">
        <div className="w-10 h-10 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 1. Show Lock Screen if locked or setting up password
  if (isLocked || showLockSetup) {
    return (
      <LockScreen
        config={securityConfig}
        fileMetadata={fileMetadata}
        onUnlocked={handleUnlocked}
        onRelinkFile={handleLinkMacZip}
      />
    );
  }

  // 2. Show Landing / DropZone if no chats loaded
  if (chats.length === 0) {
    return (
      <DropZone
        onFileSelected={handleFileDrop}
        onLinkMacZip={handleLinkMacZip}
        progress={progress}
        linkedFileName={fileMetadata?.name}
      />
    );
  }

  // 3. Show WhatsApp Web interface
  return (
    <div className="w-screen h-screen flex overflow-hidden bg-[#0c1317]">
      {/* Sidebar (Chat List) */}
      <div
        className={`${
          activeChatId ? 'hidden md:flex' : 'flex'
        } w-full md:w-auto h-full flex-shrink-0`}
      >
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={id => setActiveChatId(id)}
          ownerName={ownerName}
          onLockApp={handleManualLock}
          onOpenSettings={() => setShowSettings(true)}
          onRelinkFile={handleLinkMacZip}
        />
      </div>

      {/* Main Chat Area */}
      <div
        className={`${
          !activeChatId ? 'hidden md:flex' : 'flex'
        } flex-1 h-full flex flex-col`}
      >
        {activeChat ? (
          <ChatView
            chat={activeChat}
            onBack={() => setActiveChatId(null)}
            jumpMessageId={targetJumpMessageId}
            onOpenMedia={(url, fileName, mediaType, messageId) =>
              setLightboxMedia({ url, fileName, mediaType, messageId })
            }
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#111b21] text-center p-8 text-[#8696a0] select-none">
            <div className="w-20 h-20 rounded-full bg-[#202c33] flex items-center justify-center mb-4 text-[#00a884]">
              <MessageSquare className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-medium text-[#e9edef] mb-2">
              WhatsApp Web Viewer
            </h2>
            <p className="text-sm max-w-sm">
              Select a chat from the sidebar to view conversation history, photos, videos, and voice notes.
            </p>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxMedia && (
        <MediaLightbox
          url={lightboxMedia.url}
          fileName={lightboxMedia.fileName}
          mediaType={lightboxMedia.mediaType}
          messageId={lightboxMedia.messageId}
          onJumpToMessage={msgId => {
            setLightboxMedia(null);
            setTargetJumpMessageId(msgId);
            setTimeout(() => setTargetJumpMessageId(null), 100);
          }}
          onClose={() => setLightboxMedia(null)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          ownerName={ownerName}
          onUpdateOwnerName={handleUpdateOwnerName}
          availableParticipants={allSenders}
          securityConfig={securityConfig}
          onClose={() => setShowSettings(false)}
          onResetAll={handleResetAll}
        />
      )}
    </div>
  );
};
