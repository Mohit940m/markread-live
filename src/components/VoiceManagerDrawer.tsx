import { FC, useState, useEffect } from 'react';
import {
  X,
  Download,
  Trash2,
  Play,
  Square,
  Check,
  Sparkles,
  HardDrive,
  Key,
  Volume2,
} from 'lucide-react';
import { VoiceOption } from '../tts/types';
import { CURATED_PIPER_VOICES } from '../tts/voiceCatalog';
import { PiperTTSEngine } from '../tts/piperEngine';
import { GoogleByokEngine } from '../tts/googleByokEngine';

interface VoiceManagerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoiceId: string | null;
  onSelectVoice: (voice: VoiceOption) => void;
  browserVoices: VoiceOption[];
  piperEngine: PiperTTSEngine;
  googleByokEngine?: GoogleByokEngine;
}

export const VoiceManagerDrawer: FC<VoiceManagerDrawerProps> = ({
  isOpen,
  onClose,
  selectedVoiceId,
  onSelectVoice,
  browserVoices,
  piperEngine,
  googleByokEngine,
}) => {
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [downloadedVoiceIds, setDownloadedVoiceIds] = useState<Set<string>>(new Set());
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [showByok, setShowByok] = useState<boolean>(false);

  // Sync downloaded voice status on drawer open
  useEffect(() => {
    if (isOpen) {
      piperEngine.listVoices().then((voices) => {
        const stored = new Set(voices.filter((v) => v.isDownloaded).map((v) => v.id));
        setDownloadedVoiceIds(stored);
      });

      const existingKey = localStorage.getItem('markread_gcloud_tts_key');
      if (existingKey) {
        setApiKeyInput(existingKey);
        setHasApiKey(true);
        googleByokEngine?.setApiKey(existingKey);
      }
    }
  }, [isOpen, piperEngine, googleByokEngine]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = async (voice: VoiceOption) => {
    if (downloadProgress[voice.id] !== undefined) return;

    setDownloadProgress((prev) => ({ ...prev, [voice.id]: 0 }));

    try {
      await piperEngine.downloadVoice(voice.id, (percent) => {
        setDownloadProgress((prev) => ({ ...prev, [voice.id]: percent }));
      });
      setDownloadedVoiceIds((prev) => new Set([...prev, voice.id]));
      setDownloadProgress((prev) => {
        const copy = { ...prev };
        delete copy[voice.id];
        return copy;
      });
      // Automatically select newly downloaded voice
      onSelectVoice({ ...voice, isDownloaded: true });
    } catch (err) {
      console.warn('Voice download failed:', err);
      setDownloadProgress((prev) => {
        const copy = { ...prev };
        delete copy[voice.id];
        return copy;
      });
    }
  };

  const handleDelete = async (voiceId: string) => {
    await piperEngine.deleteVoice(voiceId);
    setDownloadedVoiceIds((prev) => {
      const copy = new Set(prev);
      copy.delete(voiceId);
      return copy;
    });
  };

  const handlePreview = async (voice: VoiceOption) => {
    if (previewingVoiceId === voice.id) {
      piperEngine.stopPreview();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setPreviewingVoiceId(null);
      return;
    }

    setPreviewingVoiceId(voice.id);

    try {
      if (voice.engine === 'piper') {
        await piperEngine.previewVoice(voice);
      } else if (voice.engine === 'browser') {
        const synth = window.speechSynthesis;
        synth.cancel();
        const utterance = new SpeechSynthesisUtterance(
          'MarkRead brings your markdown to life with natural voices.'
        );
        const match = synth.getVoices().find((v) => v.voiceURI === voice.id);
        if (match) utterance.voice = match;
        utterance.onend = () => setPreviewingVoiceId(null);
        utterance.onerror = () => setPreviewingVoiceId(null);
        synth.speak(utterance);
      }
    } catch {
      setPreviewingVoiceId(null);
    }
  };

  const handleSaveApiKey = () => {
    const trimmed = apiKeyInput.trim();
    if (trimmed) {
      localStorage.setItem('markread_gcloud_tts_key', trimmed);
      googleByokEngine?.setApiKey(trimmed);
      setHasApiKey(true);
    }
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('markread_gcloud_tts_key');
    googleByokEngine?.setApiKey(null);
    setApiKeyInput('');
    setHasApiKey(false);
  };

  // Estimate total OPFS cache usage
  const totalCachedMb = CURATED_PIPER_VOICES.filter((v) =>
    downloadedVoiceIds.has(v.id)
  ).reduce((acc, v) => acc + (v.downloadSizeMB || 0), 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-manager-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full bg-surface border-l border-borderSubtle flex flex-col shadow-2xl text-textPrimary overflow-hidden animate-slide-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-borderSubtle flex items-center justify-between bg-canvas/40">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-accent" />
            <div>
              <h2 id="voice-manager-title" className="text-base font-bold text-textPrimary">
                Voice Manager
              </h2>
              <p className="text-[11px] text-textMuted flex items-center gap-1.5 mt-0.5">
                <HardDrive className="w-3 h-3" />
                <span>
                  {downloadedVoiceIds.size} offline {downloadedVoiceIds.size === 1 ? 'voice' : 'voices'} (~{totalCachedMb} MB)
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Voice Manager"
            className="p-1.5 rounded-lg text-textMuted hover:text-textPrimary hover:bg-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Section 1: Neural Offline Voices (Piper) */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-textPrimary">
                  Neural Offline Voices (Piper WASM)
                </h3>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/15 text-accent font-medium">
                100% Private
              </span>
            </div>
            <p className="text-xs text-textMuted mb-3">
              On-device neural speech running in a background Web Worker. Zero external servers.
            </p>

            <div className="space-y-2.5">
              {CURATED_PIPER_VOICES.map((v) => {
                const isDownloaded = downloadedVoiceIds.has(v.id);
                const isSelected = selectedVoiceId === v.id;
                const progress = downloadProgress[v.id];
                const isDownloading = progress !== undefined;
                const isPreviewing = previewingVoiceId === v.id;

                return (
                  <div
                    key={v.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                        : 'border-borderSubtle bg-elevated/70 hover:border-borderSubtle/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-textPrimary truncate">
                            {v.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface border border-borderSubtle text-textMuted">
                            {v.accent || v.lang}
                          </span>
                          <span className="text-[10px] text-textMuted capitalize">
                            {v.gender}
                          </span>
                        </div>
                        <p className="text-[11px] text-textMuted mt-0.5">
                          ~{v.downloadSizeMB} MB download • ONNX Medium
                        </p>
                      </div>

                      {/* Preview Button */}
                      {isDownloaded && (
                        <button
                          type="button"
                          onClick={() => handlePreview(v)}
                          title={isPreviewing ? 'Stop sample' : 'Test sample'}
                          aria-label={isPreviewing ? 'Stop sample' : 'Test sample'}
                          className="p-1.5 rounded-lg bg-surface hover:bg-borderSubtle text-textMuted hover:text-textPrimary transition-colors"
                        >
                          {isPreviewing ? (
                            <Square className="w-3.5 h-3.5 fill-current text-accent" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Progress Bar when downloading */}
                    {isDownloading && (
                      <div className="mt-2.5">
                        <div className="flex justify-between text-[11px] font-mono text-textMuted mb-1">
                          <span>Downloading WASM weights...</span>
                          <span className="text-accent font-bold">{progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent transition-all duration-150"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Actions Row */}
                    {!isDownloading && (
                      <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-borderSubtle/60 text-xs">
                        {isDownloaded ? (
                          <>
                            <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium">
                              <Check className="w-3.5 h-3.5" />
                              <span>Ready Offline</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDelete(v.id)}
                                title="Delete voice from browser storage"
                                className="p-1 text-textMuted hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onSelectVoice({ ...v, isDownloaded: true })}
                                disabled={isSelected}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                                  isSelected
                                    ? 'bg-accent/20 text-accent cursor-default'
                                    : 'bg-accent text-canvas font-bold hover:bg-accent-hover'
                                }`}
                              >
                                {isSelected ? 'Active' : 'Select'}
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="text-[11px] text-textMuted">Not downloaded</span>
                            <button
                              type="button"
                              onClick={() => handleDownload(v)}
                              className="px-2.5 py-1 rounded-lg bg-elevated hover:bg-borderSubtle text-textPrimary text-[11px] font-medium flex items-center gap-1.5 border border-borderSubtle transition-colors"
                            >
                              <Download className="w-3 h-3 text-accent" />
                              <span>Download</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 2: Instant Browser Voices */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-textPrimary">
                Instant Browser Voices (Zero Download)
              </h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-borderSubtle text-textMuted">
                Instant
              </span>
            </div>
            <p className="text-xs text-textMuted mb-3">
              Fast, built-in voices provided by Chrome, Edge, and your operating system.
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {browserVoices.map((v) => {
                const isSelected = selectedVoiceId === v.id;
                const isNatural = v.quality === 'natural';
                const isPreviewing = previewingVoiceId === v.id;

                return (
                  <div
                    key={v.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                      isSelected
                        ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                        : 'border-borderSubtle bg-elevated/50 hover:border-borderSubtle/80'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-medium text-textPrimary truncate">
                          {v.name}
                        </span>
                        {isNatural && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
                            Natural
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-textMuted">{v.lang}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePreview(v)}
                        title={isPreviewing ? 'Stop sample' : 'Test sample'}
                        className="p-1.5 rounded-lg bg-surface hover:bg-borderSubtle text-textMuted hover:text-textPrimary transition-colors"
                      >
                        {isPreviewing ? (
                          <Square className="w-3.5 h-3.5 fill-current text-accent" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectVoice(v)}
                        disabled={isSelected}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                          isSelected
                            ? 'bg-accent/20 text-accent cursor-default'
                            : 'bg-elevated hover:bg-borderSubtle text-textPrimary border border-borderSubtle'
                        }`}
                      >
                        {isSelected ? 'Active' : 'Select'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 3: Optional Google Cloud TTS (BYOK) */}
          <section className="pt-2 border-t border-borderSubtle">
            <button
              type="button"
              onClick={() => setShowByok((prev) => !prev)}
              className="w-full flex items-center justify-between text-left text-xs font-semibold text-textMuted hover:text-textPrimary transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-accent" />
                <span>Google Cloud TTS (BYOK — Optional)</span>
              </div>
              <span className="text-[11px]">{showByok ? 'Hide' : 'Configure'}</span>
            </button>

            {showByok && (
              <div className="mt-3 p-3 rounded-xl bg-elevated border border-borderSubtle space-y-2.5 animate-fade-in text-xs">
                <p className="text-textMuted text-[11px]">
                  Paste your personal Google Cloud Text-to-Speech API key to use official Google WaveNet and Neural2 voices.
                  Key is saved strictly in your browser&apos;s localStorage.
                </p>

                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="flex-1 bg-surface border border-borderSubtle rounded-lg px-2.5 py-1.5 text-textPrimary text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <button
                    type="button"
                    onClick={handleSaveApiKey}
                    className="px-3 py-1.5 rounded-lg bg-accent text-canvas font-bold text-xs hover:bg-accent-hover transition-colors"
                  >
                    Save
                  </button>
                  {hasApiKey && (
                    <button
                      type="button"
                      onClick={handleClearApiKey}
                      className="px-2 py-1.5 rounded-lg bg-surface hover:bg-red-500/15 hover:text-red-400 text-textMuted border border-borderSubtle transition-colors text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {hasApiKey && (
                  <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> API Key saved locally
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
