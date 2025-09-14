// 半径指定 UI コンポーネント

'use client';

import { useState, useRef, useEffect } from 'react';
import { SEARCH_RADIUS } from '../utils/constants';
import { formatDistance } from '../utils/helpers';

interface RadiusSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
  showMarkers?: boolean;
  className?: string;
}

/**
 * 半径指定スライダーコンポーネント
 */
export function RadiusSlider({
  value,
  onChange,
  disabled = false,
  min = SEARCH_RADIUS.MIN,
  max = SEARCH_RADIUS.MAX,
  step = SEARCH_RADIUS.STEP,
  showValue = true,
  showMarkers = true,
  className = '',
}: RadiusSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const sliderRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  // 値が変更された時の同期
  useEffect(() => {
    setTempValue(value);
  }, [value]);

  // 値を範囲内に制限
  const clampValue = (val: number): number => {
    return Math.max(min, Math.min(max, Math.round(val / step) * step));
  };

  // パーセンテージを計算
  const getPercentage = (val: number): number => {
    return ((val - min) / (max - min)) * 100;
  };

  // 位置から値を計算
  const getValueFromPosition = (clientX: number): number => {
    if (!sliderRef.current) return value;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const rawValue = min + (percentage / 100) * (max - min);
    return clampValue(rawValue);
  };

  // マウス/タッチイベントハンドラー
  const handleStart = (clientX: number) => {
    if (disabled) return;
    
    setIsDragging(true);
    const newValue = getValueFromPosition(clientX);
    setTempValue(newValue);
    onChange(newValue);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || disabled) return;
    
    const newValue = getValueFromPosition(clientX);
    setTempValue(newValue);
    onChange(newValue);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  // マウスイベント
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // タッチイベント
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // グローバルイベントリスナー
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging]);

  // キーボード操作
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    let newValue = value;
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        newValue = clampValue(value - step);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        newValue = clampValue(value + step);
        break;
      case 'Home':
        e.preventDefault();
        newValue = min;
        break;
      case 'End':
        e.preventDefault();
        newValue = max;
        break;
      case 'PageDown':
        e.preventDefault();
        newValue = clampValue(value - step * 5);
        break;
      case 'PageUp':
        e.preventDefault();
        newValue = clampValue(value + step * 5);
        break;
      default:
        return;
    }

    setTempValue(newValue);
    onChange(newValue);
  };

  // マーカーの値
  const markers = showMarkers ? [
    { value: 500, label: '500m' },
    { value: 1000, label: '1km' },
    { value: 2000, label: '2km' },
    { value: 3000, label: '3km' },
    { value: 5000, label: '5km' },
  ] : [];

  const currentPercentage = getPercentage(tempValue);

  return (
    <div className={`radius-slider ${className}`}>
      <div className="radius-slider__header">
        <label className="radius-slider__label">
          検索範囲
        </label>
        {showValue && (
          <span className="radius-slider__value">
            {formatDistance(tempValue)}
          </span>
        )}
      </div>

      <div className="radius-slider__container">
        <div
          ref={sliderRef}
          className={`radius-slider__track ${disabled ? 'radius-slider__track--disabled' : ''}`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* プログレスバー */}
          <div
            className="radius-slider__progress"
            style={{ width: `${currentPercentage}%` }}
          />

          {/* マーカー */}
          {markers.map((marker) => (
            <div
              key={marker.value}
              className="radius-slider__marker"
              style={{ left: `${getPercentage(marker.value)}%` }}
            >
              <div className="radius-slider__marker-dot" />
              <div className="radius-slider__marker-label">
                {marker.label}
              </div>
            </div>
          ))}

          {/* スライダーのつまみ */}
          <div
            ref={thumbRef}
            className={`radius-slider__thumb ${isDragging ? 'radius-slider__thumb--dragging' : ''} ${
              disabled ? 'radius-slider__thumb--disabled' : ''
            }`}
            style={{ left: `${currentPercentage}%` }}
            tabIndex={disabled ? -1 : 0}
            role="slider"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={tempValue}
            aria-valuetext={formatDistance(tempValue)}
            aria-label="検索範囲を指定"
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>

      <div className="radius-slider__help">
        <p className="text-xs text-gray-500">
          スライダーをドラッグするか、矢印キーで調整できます
        </p>
      </div>
    </div>
  );
}

/**
 * シンプルな半径選択コンポーネント
 */
interface SimpleRadiusSelectorProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  options?: Array<{ value: number; label: string }>;
  className?: string;
}

export function SimpleRadiusSelector({
  value,
  onChange,
  disabled = false,
  options = [
    { value: 500, label: '500m' },
    { value: 1000, label: '1km' },
    { value: 2000, label: '2km' },
    { value: 3000, label: '3km' },
    { value: 5000, label: '5km' },
  ],
  className = '',
}: SimpleRadiusSelectorProps) {
  return (
    <div className={`simple-radius-selector ${className}`}>
      <div className="simple-radius-selector__label">
        <span className="text-sm font-medium text-gray-700">検索範囲</span>
      </div>
      <div className="simple-radius-selector__options">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`simple-radius-selector__option ${
              value === option.value ? 'simple-radius-selector__option--active' : ''
            }`}
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * 半径入力フィールドコンポーネント
 */
interface RadiusInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  className?: string;
}

export function RadiusInput({
  value,
  onChange,
  disabled = false,
  min = SEARCH_RADIUS.MIN,
  max = SEARCH_RADIUS.MAX,
  className = '',
}: RadiusInputProps) {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    const numValue = parseInt(newValue, 10);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue);
    }
  };

  const handleBlur = () => {
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue) || numValue < min || numValue > max) {
      setInputValue(value.toString());
    }
  };

  return (
    <div className={`radius-input ${className}`}>
      <label className="radius-input__label">
        検索範囲 (m)
      </label>
      <input
        type="number"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        min={min}
        max={max}
        className="radius-input__field"
        placeholder="1000"
      />
    </div>
  );
}