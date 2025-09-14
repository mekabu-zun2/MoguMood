// モード切替 UI コンポーネント

'use client';

import { useState } from 'react';
import type { SearchMode } from '../types';

interface ModeToggleProps {
  mode: SearchMode;
  onChange: (mode: SearchMode) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * 検索モード切替コンポーネント
 */
export function ModeToggle({ mode, onChange, disabled = false, className = '' }: ModeToggleProps) {
  const [focusedMode, setFocusedMode] = useState<SearchMode | null>(null);

  const handleModeChange = (newMode: SearchMode) => {
    if (!disabled && newMode !== mode) {
      onChange(newMode);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, targetMode: SearchMode) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleModeChange(targetMode);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const newMode = targetMode === 'radius' ? 'station' : 'radius';
      handleModeChange(newMode);
    }
  };

  return (
    <div className={`mode-toggle ${className}`}>
      <div className="mode-toggle__label">
        <span className="text-sm font-medium text-gray-700">検索モード</span>
      </div>
      
      <div 
        className="mode-toggle__container"
        role="radiogroup"
        aria-label="検索モード選択"
      >
        {/* 半径モード */}
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'radius'}
          aria-label="半径モード - 現在地から指定した半径内で検索"
          className={`mode-toggle__option ${
            mode === 'radius' ? 'mode-toggle__option--active' : ''
          } ${disabled ? 'mode-toggle__option--disabled' : ''}`}
          onClick={() => handleModeChange('radius')}
          onKeyDown={(e) => handleKeyDown(e, 'radius')}
          onFocus={() => setFocusedMode('radius')}
          onBlur={() => setFocusedMode(null)}
          disabled={disabled}
          tabIndex={disabled ? -1 : 0}
        >
          <div className="mode-toggle__icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <div className="mode-toggle__content">
            <div className="mode-toggle__title">半径モード</div>
            <div className="mode-toggle__description">現在地から指定距離内</div>
          </div>
        </button>

        {/* 駅数モード */}
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'station'}
          aria-label="駅数モード - 最寄り駅から指定した駅数分の範囲で検索"
          className={`mode-toggle__option ${
            mode === 'station' ? 'mode-toggle__option--active' : ''
          } ${disabled ? 'mode-toggle__option--disabled' : ''}`}
          onClick={() => handleModeChange('station')}
          onKeyDown={(e) => handleKeyDown(e, 'station')}
          onFocus={() => setFocusedMode('station')}
          onBlur={() => setFocusedMode(null)}
          disabled={disabled}
          tabIndex={disabled ? -1 : 0}
        >
          <div className="mode-toggle__icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <div className="mode-toggle__content">
            <div className="mode-toggle__title">駅数モード</div>
            <div className="mode-toggle__description">最寄り駅から指定駅数分</div>
          </div>
        </button>
      </div>
    </div>
  );
}

/**
 * シンプルなトグルスイッチ版
 */
interface SimpleToggleProps {
  mode: SearchMode;
  onChange: (mode: SearchMode) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SimpleModeToggle({ 
  mode, 
  onChange, 
  disabled = false, 
  size = 'md',
  className = '' 
}: SimpleToggleProps) {
  const sizeClasses = {
    sm: 'simple-toggle--sm',
    md: 'simple-toggle--md',
    lg: 'simple-toggle--lg',
  };

  return (
    <div className={`simple-toggle ${sizeClasses[size]} ${className}`}>
      <div 
        className="simple-toggle__track"
        role="switch"
        aria-checked={mode === 'station'}
        aria-label={`検索モード: ${mode === 'radius' ? '半径' : '駅数'}モード`}
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && onChange(mode === 'radius' ? 'station' : 'radius')}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            onChange(mode === 'radius' ? 'station' : 'radius');
          }
        }}
      >
        <div className={`simple-toggle__thumb ${mode === 'station' ? 'simple-toggle__thumb--right' : ''}`} />
        <div className="simple-toggle__labels">
          <span className={`simple-toggle__label ${mode === 'radius' ? 'simple-toggle__label--active' : ''}`}>
            半径
          </span>
          <span className={`simple-toggle__label ${mode === 'station' ? 'simple-toggle__label--active' : ''}`}>
            駅数
          </span>
        </div>
      </div>
    </div>
  );
}