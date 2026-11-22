import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SplitDivider } from './SplitDivider';
import { createRef } from 'react';

describe('SplitDivider Component (Issue 2)', () => {
  const setup = (initialRatio = 50) => {
    const container = document.createElement('div');
    Object.defineProperty(container, 'getBoundingClientRect', {
      value: () => ({
        left: 0,
        top: 0,
        width: 1000,
        height: 800,
        right: 1000,
        bottom: 800,
      }),
    });
    const containerRef = createRef<HTMLDivElement>();
    (containerRef as any).current = container;

    const onRatioChange = vi.fn();

    render(
      <SplitDivider
        splitRatio={initialRatio}
        onRatioChange={onRatioChange}
        containerRef={containerRef}
      />
    );

    const divider = screen.getByTestId('split-divider');
    return { divider, onRatioChange, container };
  };

  it('renders divider with separator role and accessibility attributes', () => {
    const { divider } = setup(45);
    expect(divider).toHaveAttribute('role', 'separator');
    expect(divider).toHaveAttribute('aria-valuenow', '45');
    expect(divider).toHaveAttribute('aria-valuemin', '20');
    expect(divider).toHaveAttribute('aria-valuemax', '80');
  });

  it('resets ratio to 50% on double click', () => {
    const { divider, onRatioChange } = setup(35);
    fireEvent.doubleClick(divider);
    expect(onRatioChange).toHaveBeenCalledWith(50);
  });

  it('adjusts ratio on ArrowLeft and ArrowRight keyboard navigation', () => {
    const { divider, onRatioChange } = setup(50);

    fireEvent.keyDown(divider, { key: 'ArrowLeft' });
    expect(onRatioChange).toHaveBeenCalledWith(48);

    fireEvent.keyDown(divider, { key: 'ArrowRight' });
    expect(onRatioChange).toHaveBeenCalledWith(52);
  });

  it('handles mouse drag to resize ratio clamped within bounds', () => {
    const { divider, onRatioChange } = setup(50);

    // Mouse down starts drag
    fireEvent.mouseDown(divider);

    // Mouse move to 300px (30%)
    fireEvent.mouseMove(window, { clientX: 300 });
    expect(onRatioChange).toHaveBeenCalledWith(30);

    // Mouse move to 950px (clamps to max 80%)
    fireEvent.mouseMove(window, { clientX: 950 });
    expect(onRatioChange).toHaveBeenCalledWith(80);

    // Mouse move to 50px (clamps to min 20%)
    fireEvent.mouseMove(window, { clientX: 50 });
    expect(onRatioChange).toHaveBeenCalledWith(20);

    // Mouse up ends drag
    fireEvent.mouseUp(window);
  });
});
