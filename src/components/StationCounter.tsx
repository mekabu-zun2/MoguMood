// 駅数指定 UI コンポーネント

'use client';

import { useState } from 'react';
import { STATION_COUNT } from '../utils/constants';

interface StationCounterProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  showLabel?: boolean;
  className?: string;
}

/**
 * 駅数指定カウンターコンポーネント
 */
export function StationCounter({
  value,
  onChange,
  disabled = false,
  min = STATION_COUNT.MIN,
  max = STATION_COUNT.MAX,
  showLabel = true,
  className = '',
}: StationCounterProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleIncrement = () => {
    if (!disabled && value < max) {
      onChange(value + 1);
    }
  };

  const handleDecrement = () => {
    if (!disabled && value > min) {
      onChange(value - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
      case '+':
        e.preventDefault();
        handleIncrement();
        break;
      case 'ArrowDown':
      case '-':
        e.preventDefault();
        handleDecrement();
        break;
      case 'Home':
        e.preventDefault();
        if (!disabled) onChange(min);
        break;
      case 'End':
        e.preventDefault();
        if (!disabled) onChange(max);
        break;
    }
  };

  const canDecrement = !disabled && value > min;
  const canIncrement = !disabled && value < max;

  return (
    <div className={`station-counter ${className}`}>
      {showLabel && (
        <div className="station-counter__label">
          <span className="text-sm font-medium text-gray-700">駅数</span>
          <span className="text-xs text-gray-500 ml-2">
            最寄り駅から{value}駅分
          </span>
        </div>
      )}

      <div className={`station-counter__container ${
        isFocused ? 'station-counter__container--focused' : ''
      } ${disabled ? 'station-counter__container--disabled' : ''}`}>
        {/* 減少ボタン */}
        <button
          type="button"
          className={`station-counter__button station-counter__button--decrement ${
            !canDecrement ? 'station-counter__button--disabled' : ''
          }`}
          onClick={handleDecrement}
          disabled={!canDecrement}
          aria-label="駅数を減らす"
          tabIndex={disabled ? -1 : 0}
        >
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
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* 値表示 */}
        <div
          className="station-counter__value"
          role="spinbutton"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-label="駅数"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        >
          <span className="station-counter__number">{value}</span>
          <span className="station-counter__unit">駅</span>
        </div>

        {/* 増加ボタン */}
        <button
          type="button"
          className={`station-counter__button station-counter__button--increment ${
            !canIncrement ? 'station-counter__button--disabled' : ''
          }`}
          onClick={handleIncrement}
          disabled={!canIncrement}
          aria-label="駅数を増やす"
          tabIndex={disabled ? -1 : 0}
        >
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
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      <div className="station-counter__help">
        <p className="text-xs text-gray-500">
          ボタンまたは矢印キーで調整できます（{min}〜{max}駅）
        </p>
      </div>
    </div>
  );
}

/**
 * セレクトボックス版の駅数選択コンポーネント
 */
interface StationSelectProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  className?: string;
}

export function StationSelect({
  value,
  onChange,
  disabled = false,
  min = STATION_COUNT.MIN,
  max = STATION_COUNT.MAX,
  className = '',
}: StationSelectProps) {
  const options = [];
  for (let i = min; i <= max; i++) {
    options.push(i);
  }

  return (
    <div className={`station-select ${className}`}>
      <label className="station-select__label">
        駅数
      </label>
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        disabled={disabled}
        className="station-select__field"
        aria-label="検索する駅数を選択"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}駅分
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * ボタン選択版の駅数選択コンポーネント
 */
interface StationButtonsProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  className?: string;
}

export function StationButtons({
  value,
  onChange,
  disabled = false,
  min = STATION_COUNT.MIN,
  max = STATION_COUNT.MAX,
  className = '',
}: StationButtonsProps) {
  const options = [];
  for (let i = min; i <= max; i++) {
    options.push(i);
  }

  return (
    <div className={`station-buttons ${className}`}>
      <div className="station-buttons__label">
        <span className="text-sm font-medium text-gray-700">駅数</span>
      </div>
      <div className="station-buttons__options">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`station-buttons__option ${
              value === option ? 'station-buttons__option--active' : ''
            }`}
            onClick={() => !disabled && onChange(option)}
            disabled={disabled}
            aria-label={`${option}駅分で検索`}
            aria-pressed={value === option}
          >
            <span className="station-buttons__number">{option}</span>
            <span className="station-buttons__unit">駅</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * スライダー版の駅数選択コンポーネント
 */
interface StationSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  className?: string;
}

export function StationSlider({
  value,
  onChange,
  disabled = false,
  min = STATION_COUNT.MIN,
  max = STATION_COUNT.MAX,
  className = '',
}: StationSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    onChange(newValue);
  };

  return (
    <div className={`station-slider ${className}`}>
      <div className="station-slider__header">
        <label className="station-slider__label">
          駅数
        </label>
        <span className="station-slider__value">
          {value}駅分
        </span>
      </div>

      <div className="station-slider__container">
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="station-slider__input"
          aria-label="検索する駅数"
        />
        
        <div className="station-slider__track">
          <div 
            className="station-slider__progress"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="station-slider__markers">
          {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((num) => (
            <div
              key={num}
              className="station-slider__marker"
              style={{ left: `${((num - min) / (max - min)) * 100}%` }}
            >
              <div className="station-slider__marker-dot" />
              <div className="station-slider__marker-label">{num}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}