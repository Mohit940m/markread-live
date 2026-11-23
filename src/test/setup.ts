import '@testing-library/jest-dom';

// Mock Web Speech API SpeechSynthesis for tests
class MockSpeechSynthesisUtterance implements SpeechSynthesisUtterance {
  text: string;
  lang: string = 'en-US';
  pitch: number = 1;
  rate: number = 1;
  voice: SpeechSynthesisVoice | null = null;
  volume: number = 1;
  onboundary: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null = null;
  onend: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null = null;
  onerror: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisErrorEvent) => any) | null = null;
  onmark: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null = null;
  onpause: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null = null;
  onresume: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null = null;
  onstart: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null = null;
  addEventListener: (type: string, listener: any) => void = vi.fn();
  removeEventListener: (type: string, listener: any) => void = vi.fn();
  dispatchEvent: (event: Event) => boolean = vi.fn(() => true);

  constructor(text: string = '') {
    this.text = text;
  }
}

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
    name: 'Google UK English Female',
    voiceURI: 'Google UK English Female',
  },
];

const mockSpeechSynthesis = {
  paused: false,
  pending: false,
  speaking: false,
  onvoiceschanged: null as ((this: SpeechSynthesis, ev: Event) => any) | null,
  getVoices: vi.fn(() => mockVoices),
  speak: vi.fn((utterance: SpeechSynthesisUtterance) => {
    mockSpeechSynthesis.speaking = true;
    mockSpeechSynthesis.paused = false;
    if (utterance.onstart) {
      utterance.onstart({} as SpeechSynthesisEvent);
    }
  }),
  cancel: vi.fn(() => {
    mockSpeechSynthesis.speaking = false;
    mockSpeechSynthesis.paused = false;
  }),
  pause: vi.fn(() => {
    mockSpeechSynthesis.paused = true;
    mockSpeechSynthesis.speaking = false;
  }),
  resume: vi.fn(() => {
    mockSpeechSynthesis.paused = false;
    mockSpeechSynthesis.speaking = true;
  }),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(() => true),
};

Object.defineProperty(window, 'SpeechSynthesisUtterance', {
  writable: true,
  value: MockSpeechSynthesisUtterance,
});

Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: mockSpeechSynthesis,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('dark'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Element.prototype.scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();
