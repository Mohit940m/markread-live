import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ReadAloudBar } from './ReadAloudBar';

describe('ReadAloudBar Component (US-4.3 & US-4.4)', () => {
  const mockVoices: SpeechSynthesisVoice[] = [
    {
      default: true,
      lang: 'en-US',
      localService: true,
      name: 'Google US English',
      voiceURI: 'Google US English',
    },
    {
      default: false,
      lang: 'en-GB',
      localService: true,
      name: 'Google UK English',
      voiceURI: 'Google UK English',
    },
  ];

  const defaultProps = {
    status: 'idle' as const,
    currentChunkIndex: 0,
    totalChunks: 5,
    onPlay: vi.fn(),
    onPause: vi.fn(),
    onResume: vi.fn(),
    onStop: vi.fn(),
    onNext: vi.fn(),
    onPrev: vi.fn(),
    rate: 1.0,
    onChangeRate: vi.fn(),
    voices: mockVoices,
    selectedVoiceURI: null,
    onChangeVoice: vi.fn(),
  };

  it('renders progress indicator and playback controls', () => {
    render(<ReadAloudBar {...defaultProps} />);
    expect(screen.getByText('5 chunks')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /play reading/i })).toBeInTheDocument();
  });

  it('calls onPlay when Play button is clicked in idle state', () => {
    const handlePlay = vi.fn();
    render(<ReadAloudBar {...defaultProps} onPlay={handlePlay} />);

    const playBtn = screen.getByRole('button', { name: /play reading/i });
    fireEvent.click(playBtn);
    expect(handlePlay).toHaveBeenCalledTimes(1);
  });

  it('calls onPause when Pause button is clicked in playing state', () => {
    const handlePause = vi.fn();
    render(
      <ReadAloudBar
        {...defaultProps}
        status="playing"
        currentChunkIndex={2}
        onPause={handlePause}
      />
    );

    expect(screen.getByText('3 / 5')).toBeInTheDocument();
    const pauseBtn = screen.getByRole('button', { name: /pause reading/i });
    fireEvent.click(pauseBtn);
    expect(handlePause).toHaveBeenCalledTimes(1);
  });

  it('toggles playback via Space keyboard shortcut when not in inputs', () => {
    const handlePlay = vi.fn();
    render(<ReadAloudBar {...defaultProps} onPlay={handlePlay} />);

    fireEvent.keyDown(window, { code: 'Space' });
    expect(handlePlay).toHaveBeenCalledTimes(1);
  });

  it('allows adjusting speed rate and selecting voices in settings panel', () => {
    const handleChangeRate = vi.fn();
    const handleChangeVoice = vi.fn();

    render(
      <ReadAloudBar
        {...defaultProps}
        onChangeRate={handleChangeRate}
        onChangeVoice={handleChangeVoice}
      />
    );

    // Open settings panel
    const settingsBtn = screen.getByRole('button', { name: /audio voice and speed settings/i });
    fireEvent.click(settingsBtn);

    // Change speed
    const speed15 = screen.getByRole('button', { name: '1.5x' });
    fireEvent.click(speed15);
    expect(handleChangeRate).toHaveBeenCalledWith(1.5);

    // Change voice
    const select = screen.getByLabelText(/select reading voice/i);
    fireEvent.change(select, { target: { value: 'Google UK English' } });
    expect(handleChangeVoice).toHaveBeenCalledWith('Google UK English');
  });
});
