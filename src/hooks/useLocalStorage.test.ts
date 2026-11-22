import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage Hook (US-1.3)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns the initial value when key is not in localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default-val'));
    expect(result.current[0]).toBe('default-val');
  });

  it('supports lazy initial value function', () => {
    const { result } = renderHook(() => useLocalStorage('test-lazy', () => 42));
    expect(result.current[0]).toBe(42);
  });

  it('reads pre-existing stored value from localStorage', () => {
    window.localStorage.setItem('test-existing', JSON.stringify({ theme: 'dark' }));
    const { result } = renderHook(() => useLocalStorage('test-existing', { theme: 'light' }));
    expect(result.current[0]).toEqual({ theme: 'dark' });
  });

  it('updates state and persists to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('speed', 1.0));
    act(() => {
      result.current[1](1.5);
    });

    expect(result.current[0]).toBe(1.5);
    expect(window.localStorage.getItem('speed')).toBe(JSON.stringify(1.5));
  });

  it('supports updater function like standard useState', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 10));
    act(() => {
      result.current[1]((prev) => prev + 5);
    });

    expect(result.current[0]).toBe(15);
    expect(window.localStorage.getItem('counter')).toBe('15');
  });

  it('removes item from storage and resets state when removeValue is called', () => {
    window.localStorage.setItem('temp', JSON.stringify('val'));
    const { result } = renderHook(() => useLocalStorage('temp', 'init'));

    act(() => {
      result.current[2]();
    });

    expect(result.current[0]).toBe('init');
    expect(window.localStorage.getItem('temp')).toBeNull();
  });

  it('gracefully handles JSON parse error and falls back to initial value', () => {
    window.localStorage.setItem('corrupt', 'not-valid-json{');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useLocalStorage('corrupt', 'fallback'));
    expect(result.current[0]).toBe('fallback');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('gracefully handles storage quota or security error on write', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    const { result } = renderHook(() => useLocalStorage('overflow', 'initial'));
    act(() => {
      result.current[1]('new-value');
    });

    // In-memory state still updates even if storage write fails
    expect(result.current[0]).toBe('new-value');
    expect(warnSpy).toHaveBeenCalled();
  });
});
