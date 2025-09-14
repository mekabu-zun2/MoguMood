// 気分入力 UI コンポーネント

'use client';

import { useState, useEffect, useRef } from 'react';
import { getRandomMoodPlaceholder } from '../utils';

interface MoodInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  placeholder?: string;
  maxLength?: number;
  showCharCount?: boolean;
  autoFocus?: boolean;
  className?: string;
}

/**
 * 気分入力コンポーネント
 */
export function MoodInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  loading = false,
  error = null,
  placeholder,
  maxLength = 100,
  showCharCount = true,
  autoFocus = false,
  className = '',
}: MoodInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(
    placeholder || getRandomMoodPlaceholder()
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // プレースホルダーをランダムに変更
  useEffect(() => {
    if (!placeholder) {
      const interval = setInterval(() => {
        if (!isFocused && !value) {
          setCurrentPlaceholder(getRandomMoodPlaceholder());
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [placeholder, isFocused, value]);

  // テキストエリアの高さを自動調整
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(textarea.scrollHeight, 80)}px`;
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (onSubmit && value.trim()) {
        onSubmit();
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const remainingChars = maxLength - value.length;
  const isNearLimit = remainingChars <= 20;
  const isOverLimit = remainingChars < 0;

  return (
    <div className={`mood-input ${className}`}>
      <div className="mood-input__label">
        <label htmlFor="mood-textarea" className="text-sm font-medium text-gray-700">
          今の気分を教えてください
        </label>
        {showCharCount && (
          <span 
            className={`mood-input__char-count ${
              isOverLimit ? 'mood-input__char-count--error' : 
              isNearLimit ? 'mood-input__char-count--warning' : ''
            }`}
          >
            {value.length}/{maxLength}
          </span>
        )}
      </div>

      <div className={`mood-input__container ${
        isFocused ? 'mood-input__container--focused' : ''
      } ${error ? 'mood-input__container--error' : ''} ${
        disabled ? 'mood-input__container--disabled' : ''
      }`}>
        <textarea
          ref={textareaRef}
          id="mood-textarea"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled || loading}
          placeholder={currentPlaceholder}
          className="mood-input__textarea"
          rows={3}
          autoFocus={autoFocus}
          aria-describedby={error ? 'mood-error' : undefined}
          aria-invalid={!!error}
        />

        {loading && (
          <div className="mood-input__loading">
            <div className="mood-input__spinner" />
          </div>
        )}
      </div>

      {error && (
        <div id="mood-error" className="mood-input__error" role="alert">
          <svg
            className="mood-input__error-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      <div className="mood-input__help">
        <p className="text-xs text-gray-500">
          例: 「疲れた時に食べたい温かいもの」「さっぱりしたものが食べたい」
          <br />
          Enterキーで検索、Shift+Enterで改行
        </p>
      </div>
    </div>
  );
}

/**
 * シンプルな気分入力コンポーネント
 */
interface SimpleMoodInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function SimpleMoodInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = '今の気分は？',
  className = '',
}: SimpleMoodInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit && value.trim()) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className={`simple-mood-input ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className="simple-mood-input__field"
        maxLength={100}
      />
    </div>
  );
}

/**
 * 気分入力の候補表示コンポーネント
 */
interface MoodSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  visible: boolean;
  className?: string;
}

export function MoodSuggestions({
  suggestions,
  onSelect,
  visible,
  className = '',
}: MoodSuggestionsProps) {
  if (!visible || suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`mood-suggestions ${className}`}>
      <div className="mood-suggestions__title">
        <span className="text-xs font-medium text-gray-600">よく使われる気分</span>
      </div>
      <div className="mood-suggestions__list">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            type="button"
            className="mood-suggestions__item"
            onClick={() => onSelect(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * デフォルトの気分候補
 */
export const DEFAULT_MOOD_SUGGESTIONS = [
  '疲れた時に食べたい温かいもの',
  'さっぱりしたものが食べたい',
  'がっつり肉料理が食べたい',
  '甘いものでほっとしたい',
  'ヘルシーなものが食べたい',
  '辛いものでスッキリしたい',
  'お酒に合うおつまみ',
  '家族で楽しめる料理',
];