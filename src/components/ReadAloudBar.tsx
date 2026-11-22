import { FC, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Gauge,
  Volume2,
  ChevronDown,
} from 'lucide-react';
import { ReadAloudStatus } from '../hooks/useReadAloud';

interface ReadAloudBarProps {
  status: ReadAloudStatus;
  currentChunkIndex: number;
  totalChunks: number;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrev: () => void;
  rate: number;
  onChangeRate: (rate: number) => void;
  voices: SpeechSynthesisVoice[];
  selectedVoiceURI: string | null;
  onChangeVoice: (voiceURI: string) => void;
}

const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 2.0];

export const ReadAloudBar: FC<ReadAloudBarProps> = ({
  status,
  currentChunkIndex,
  totalChunks,
  onPlay,
  onPause,
  onResume,
  onStop,
  onNext,
  onPrev,
  rate,
  onChangeRate,
  voices,
  selectedVoiceURI,
  onChangeVoice,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  // Keyboard shortcut: Space toggles Play/Pause when not typing in textarea or input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'textarea' || activeTag === 'input') {
        return;
      }

      if (e.code === 'Space' && totalChunks > 0) {
        e.preventDefault();
        if (status === 'playing') {
          onPause();
        } else if (status === 'paused') {
          onResume();
        } else {
          onPlay();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, totalChunks, onPlay, onPause, onResume]);

  if (totalChunks === 0) {
    return null;
  }

  const isPlaying = status === 'playing';
  const isPaused = status === 'paused';
  const isActive = isPlaying || isPaused;

  const handlePlayPause = () => {
    if (isPlaying) {
      onPause();
    } else if (isPaused) {
      onResume();
    } else {
      onPlay();
    }
  };

  return (
    <div
      data-testid="read-aloud-bar"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-xl pb-[env(safe-area-inset-bottom)] animate-slide-up"
    >
      <div className="bg-surface/95 backdrop-blur-md border border-borderSubtle shadow-2xl rounded-2xl px-3 md:px-5 py-2.5 flex flex-col gap-2 transition-all">
        {/* Main Controls Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Progress & Indicator */}
          <div className="flex items-center gap-2 text-xs font-mono text-textMuted select-none">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isPlaying ? 'bg-emerald-400 animate-pulse' : isPaused ? 'bg-amber-400' : 'bg-textMuted/40'
              }`}
            />
            <span className="font-medium text-textPrimary text-[13px]">
              {isActive ? `${currentChunkIndex + 1} / ${totalChunks}` : `${totalChunks} chunks`}
            </span>
          </div>

          {/* Center Playback Controls */}
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Previous Sentence */}
            <button
              type="button"
              onClick={onPrev}
              disabled={!isActive || currentChunkIndex <= 0}
              title="Previous sentence"
              aria-label="Previous sentence"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-elevated hover:bg-borderSubtle text-textPrimary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play / Pause Toggle Button */}
            <button
              type="button"
              onClick={handlePlayPause}
              title={isPlaying ? 'Pause reading (Space)' : 'Play reading (Space)'}
              aria-label={isPlaying ? 'Pause reading' : 'Play reading'}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-accent hover:bg-accent-hover text-canvas shadow-md transition-transform active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current text-[#0F1117]" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5 text-[#0F1117]" />
              )}
            </button>

            {/* Next Sentence */}
            <button
              type="button"
              onClick={onNext}
              disabled={!isActive || currentChunkIndex >= totalChunks - 1}
              title="Next sentence"
              aria-label="Next sentence"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-elevated hover:bg-borderSubtle text-textPrimary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Stop Button */}
            <button
              type="button"
              onClick={onStop}
              disabled={!isActive}
              title="Stop reading"
              aria-label="Stop reading"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-elevated hover:bg-red-500/10 hover:text-red-400 text-textMuted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>

          {/* Settings Toggle Button (Speed & Voice) */}
          <button
            type="button"
            onClick={() => setShowSettings((prev) => !prev)}
            title="Audio voice and speed settings"
            aria-label="Audio voice and speed settings"
            className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-colors ${
              showSettings
                ? 'bg-accent/15 border-accent text-accent'
                : 'bg-elevated border-borderSubtle text-textMuted hover:text-textPrimary'
            }`}
          >
            <Gauge className="w-4 h-4" />
          </button>
        </div>

        {/* Audio Settings Panel (Speed & Voice) */}
        {showSettings && (
          <div className="pt-2 border-t border-borderSubtle flex flex-wrap items-center justify-between gap-3 text-xs animate-fade-in">
            {/* Speed Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-textMuted font-mono">Speed:</span>
              <div className="flex items-center gap-1 bg-elevated p-0.5 rounded-lg border border-borderSubtle">
                {SPEED_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onChangeRate(s)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors ${
                      rate === s
                        ? 'bg-accent text-canvas font-bold'
                        : 'text-textMuted hover:text-textPrimary'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Dropdown */}
            {voices.length > 0 && (
              <div className="flex items-center gap-1.5 flex-1 max-w-[200px] md:max-w-[240px]">
                <Volume2 className="w-3.5 h-3.5 text-textMuted shrink-0" />
                <div className="relative w-full">
                  <select
                    value={selectedVoiceURI || ''}
                    onChange={(e) => onChangeVoice(e.target.value)}
                    aria-label="Select reading voice"
                    className="w-full appearance-none bg-elevated border border-borderSubtle text-textPrimary rounded-lg px-2.5 py-1 pr-6 text-xs truncate focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="">Default Voice</option>
                    {voices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-textMuted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
