import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimerPasar } from './use-timer-pasar';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useTimerPasar', () => {
  it('mulai di ketukan 0', () => {
    const { result } = renderHook(() => useTimerPasar({ beku: false, onHabis: () => {} }));
    expect(result.current.ketukan).toBe(0);
  });

  it('naik satu ketukan tiap 5 detik', () => {
    const { result } = renderHook(() => useTimerPasar({ beku: false, onHabis: () => {} }));
    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.ketukan).toBe(1);
    act(() => { vi.advanceTimersByTime(10000); });
    expect(result.current.ketukan).toBe(3);
  });

  it('memanggil onHabis setelah 20 detik', () => {
    const onHabis = vi.fn();
    renderHook(() => useTimerPasar({ beku: false, onHabis }));
    act(() => { vi.advanceTimersByTime(20000); });
    expect(onHabis).toHaveBeenCalledTimes(1);
  });

  it('BEKU: ketukan tidak maju sama sekali — dipakai Fase 5 §8.1', () => {
    const { result } = renderHook(() => useTimerPasar({ beku: true, onHabis: () => {} }));
    act(() => { vi.advanceTimersByTime(20000); });
    expect(result.current.ketukan).toBe(0);
  });

  it('BEKU: onHabis tidak pernah terpanggil', () => {
    const onHabis = vi.fn();
    renderHook(() => useTimerPasar({ beku: true, onHabis }));
    act(() => { vi.advanceTimersByTime(60000); });
    expect(onHabis).not.toHaveBeenCalled();
  });

  it('melanjutkan dari ketukan yang sama setelah beku dicabut', () => {
    const { result, rerender } = renderHook(
      ({ beku }) => useTimerPasar({ beku, onHabis: () => {} }),
      { initialProps: { beku: false } },
    );
    act(() => { vi.advanceTimersByTime(5000); });
    rerender({ beku: true });
    act(() => { vi.advanceTimersByTime(30000); });
    expect(result.current.ketukan).toBe(1);
    rerender({ beku: false });
    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.ketukan).toBe(2);
  });
});
