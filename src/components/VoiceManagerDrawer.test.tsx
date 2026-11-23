import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { VoiceManagerDrawer } from './VoiceManagerDrawer';
import { PiperTTSEngine } from '../tts/piperEngine';
import { VoiceOption } from '../tts/types';

describe('VoiceManagerDrawer Component (NV-3.1, NV-3.2, NV-3.3)', () => {
  let mockPiperEngine: PiperTTSEngine;
  const mockBrowserVoices: VoiceOption[] = [
    {
      id: 'browser-google-us',
      name: 'Google US English',
      lang: 'en-US',
      engine: 'browser',
      tier: 1,
      quality: 'natural',
    },
    {
      id: 'browser-david',
      name: 'Microsoft David',
      lang: 'en-US',
      engine: 'browser',
      tier: 1,
      quality: 'standard',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    mockPiperEngine = new PiperTTSEngine();
    vi.spyOn(mockPiperEngine, 'listVoices').mockResolvedValue([
      {
        id: 'en_US-lessac-medium',
        name: 'Lessac (US English - High Fidelity)',
        lang: 'en-US',
        engine: 'piper',
        tier: 2,
        quality: 'natural',
        gender: 'female',
        downloadSizeMB: 63,
        isDownloaded: false,
      },
    ]);
    vi.spyOn(mockPiperEngine, 'downloadVoice').mockResolvedValue();
    vi.spyOn(mockPiperEngine, 'deleteVoice').mockResolvedValue();
    vi.spyOn(mockPiperEngine, 'previewVoice').mockResolvedValue();
  });

  it('does not render anything when isOpen is false', () => {
    const { container } = render(
      <VoiceManagerDrawer
        isOpen={false}
        onClose={vi.fn()}
        selectedVoiceId={null}
        onSelectVoice={vi.fn()}
        browserVoices={mockBrowserVoices}
        piperEngine={mockPiperEngine}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders drawer header, offline voices, and browser voices when isOpen is true', async () => {
    await act(async () => {
      render(
        <VoiceManagerDrawer
          isOpen={true}
          onClose={vi.fn()}
          selectedVoiceId="browser-google-us"
          onSelectVoice={vi.fn()}
          browserVoices={mockBrowserVoices}
          piperEngine={mockPiperEngine}
        />
      );
    });

    expect(screen.getByText('Voice Manager')).toBeInTheDocument();
    expect(screen.getByText(/Neural Offline Voices/)).toBeInTheDocument();
    expect(screen.getByText(/Instant Browser Voices/)).toBeInTheDocument();
    expect(screen.getByText('Google US English')).toBeInTheDocument();
    expect(screen.getByText(/Lessac/i)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    await act(async () => {
      render(
        <VoiceManagerDrawer
          isOpen={true}
          onClose={handleClose}
          selectedVoiceId={null}
          onSelectVoice={vi.fn()}
          browserVoices={mockBrowserVoices}
          piperEngine={mockPiperEngine}
        />
      );
    });

    const closeBtn = screen.getByLabelText('Close Voice Manager');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onSelectVoice when an instant browser voice is selected', async () => {
    const handleSelectVoice = vi.fn();
    await act(async () => {
      render(
        <VoiceManagerDrawer
          isOpen={true}
          onClose={vi.fn()}
          selectedVoiceId="browser-david"
          onSelectVoice={handleSelectVoice}
          browserVoices={mockBrowserVoices}
          piperEngine={mockPiperEngine}
        />
      );
    });

    // Click select on Google US English
    const selectButtons = screen.getAllByRole('button', { name: /select/i });
    fireEvent.click(selectButtons[0]);
    expect(handleSelectVoice).toHaveBeenCalledWith(mockBrowserVoices[0]);
  });

  it('triggers downloadVoice when clicking Download on a Piper voice', async () => {
    await act(async () => {
      render(
        <VoiceManagerDrawer
          isOpen={true}
          onClose={vi.fn()}
          selectedVoiceId={null}
          onSelectVoice={vi.fn()}
          browserVoices={mockBrowserVoices}
          piperEngine={mockPiperEngine}
        />
      );
    });

    const downloadButtons = screen.getAllByRole('button', { name: /download/i });
    await act(async () => {
      fireEvent.click(downloadButtons[0]);
    });
    expect(mockPiperEngine.downloadVoice).toHaveBeenCalled();
  });
});
