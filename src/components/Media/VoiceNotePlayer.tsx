import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';
import { getMediaBlobUrl } from '../../services/zipParser';

interface VoiceNotePlayerProps {
  chatId: string;
  fileName: string;
  isOutgoing: boolean;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({ chatId, fileName, isOutgoing }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadAudio = async () => {
      setIsLoading(true);
      const url = await getMediaBlobUrl(chatId, fileName);
      if (isMounted && url) {
        setBlobUrl(url);
      }
      if (isMounted) setIsLoading(false);
    };
    loadAudio();
    return () => {
      isMounted = false;
    };
  }, [chatId, fileName]);

  const togglePlay = () => {
    if (!audioRef.current || !blobUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Playback error:', err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && isFinite(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const cycleSpeed = () => {
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatSeconds = (sec: number) => {
    if (!sec || !isFinite(sec)) return '0:00';
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Generate 26 faux waveform bar heights for authentic WhatsApp look
  const waveformBars = [
    25, 40, 60, 30, 80, 45, 90, 70, 40, 85, 95, 60, 35, 75, 90, 50, 65, 80, 40, 70, 55, 30, 65, 45, 80, 35
  ];

  return (
    <div className="flex items-center gap-3 py-1 px-1 min-w-[260px] max-w-[340px]">
      {blobUrl && (
        <audio
          ref={audioRef}
          src={blobUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          preload="metadata"
        />
      )}

      {/* Mic Avatar Icon */}
      <div className="relative flex-shrink-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isOutgoing ? 'bg-[#00a884] text-white' : 'bg-[#53bdeb] text-white'
        }`}>
          <Mic className="w-5 h-5" />
        </div>
      </div>

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        disabled={isLoading || !blobUrl}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
          isOutgoing
            ? 'text-[#005c4b] dark:text-[#d9fdd3] hover:bg-black/10'
            : 'text-gray-700 dark:text-[#aebac1] hover:bg-white/10'
        }`}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-6 h-6 fill-current" />
        ) : (
          <Play className="w-6 h-6 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform & Scrubber */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="relative h-7 flex items-center group cursor-pointer">
          {/* Waveform Visualizer */}
          <div className="flex items-center gap-[2.5px] w-full h-full overflow-hidden">
            {waveformBars.map((height, i) => {
              const barPercent = (i / waveformBars.length) * 100;
              const isPlayed = barPercent <= progressPercent;
              return (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-colors ${
                    isPlayed
                      ? isOutgoing
                        ? 'bg-[#00a884] dark:bg-[#00a884]'
                        : 'bg-[#53bdeb] dark:bg-[#53bdeb]'
                      : 'bg-gray-400/40 dark:bg-gray-500/40'
                  }`}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>

          {/* Invisible Range Slider */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            disabled={!blobUrl}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Time and Speed Multiplier */}
        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
          <span>{isPlaying || currentTime > 0 ? formatSeconds(currentTime) : formatSeconds(duration)}</span>
          <button
            onClick={cycleSpeed}
            className="px-1.5 py-0.2 text-[10px] font-semibold rounded bg-black/10 dark:bg-white/10 hover:bg-black/20 transition-colors"
            title="Cycle Playback Speed"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
};
