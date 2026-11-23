import { FC, useState, useEffect, useCallback, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { GripVertical } from 'lucide-react';

interface SplitDividerProps {
  splitRatio: number;
  onRatioChange: (ratio: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  minRatio?: number;
  maxRatio?: number;
}

export const SplitDivider: FC<SplitDividerProps> = ({
  splitRatio,
  onRatioChange,
  containerRef,
  minRatio = 20,
  maxRatio = 80,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const updateRatioFromClientX = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const rawRatio = ((clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(minRatio, Math.min(maxRatio, Math.round(rawRatio * 10) / 10));
      onRatioChange(clamped);
    },
    [containerRef, minRatio, maxRatio, onRatioChange]
  );

  const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleTouchStart = (_e: ReactTouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
  };

  const handleDoubleClick = () => {
    onRatioChange(50);
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onRatioChange(Math.max(minRatio, splitRatio - 2));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onRatioChange(Math.min(maxRatio, splitRatio + 2));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onRatioChange(minRatio);
    } else if (e.key === 'End') {
      e.preventDefault();
      onRatioChange(maxRatio);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRatioChange(50);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      updateRatioFromClientX(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    const handleTouchMove = (e: globalThis.TouchEvent) => {
      if (e.touches.length > 0) {
        updateRatioFromClientX(e.touches[0].clientX);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, updateRatioFromClientX]);

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-valuenow={splitRatio}
      aria-valuemin={minRatio}
      aria-valuemax={maxRatio}
      aria-label="Drag to resize editor and preview panes. Double click to reset to 50%."
      title="Drag to resize panes (Double-click to reset 50%)"
      data-testid="split-divider"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      className={`group relative hidden md:flex items-center justify-center w-3 cursor-col-resize select-none shrink-0 transition-colors z-20 outline-none focus:ring-1 focus:ring-accent ${
        isDragging ? 'bg-accent/10' : 'hover:bg-accent/5'
      }`}
    >
      {/* Central Divider Line */}
      <div
        className={`w-0.5 h-full transition-colors rounded-full ${
          isDragging ? 'bg-accent' : 'bg-borderSubtle group-hover:bg-accent/70'
        }`}
      />

      {/* Mini Drag Handle Pill */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 w-4 h-9 rounded-md flex items-center justify-center border shadow-sm transition-all ${
          isDragging
            ? 'bg-accent text-canvas border-accent scale-105'
            : 'bg-surface border-borderSubtle text-textMuted group-hover:text-accent group-hover:border-accent/40'
        }`}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};
