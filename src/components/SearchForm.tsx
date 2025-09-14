// 検索フォームコンポーネント

'use client';

import { useState, useEffect } from 'react';
import { ModeToggle } from './ModeToggle';
import { MoodInput } from './MoodInput';
import { RadiusSlider } from './RadiusSlider';
import { StationCounter } from './StationCounter';
import { useGeolocation, useSearchState, useMoodConversion } from '../hooks';
import type { SearchMode } from '../types';
import { validateSearchParams } from '../hooks/useSearchState';

interface SearchFormProps {
  onSearch: (searchParams: {
    mode: SearchMode;
    mood: string;
    location: { lat: number; lng: number };
    radius?: number;
    stationCount?: number;
    searchQuery: string;
  }) => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * 検索フォームコンポーネント
 */
export function SearchForm({
  onSearch,
  loading = false,
  disabled = false,
  className = '',
}: SearchFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // カスタムフック
  const {
    coordinates,
    loading: locationLoading,
    error: locationError,
    getCurrentPosition,
    retry: retryLocation,
  } = useGeolocation({ autoStart: true });

  const {
    searchState,
    setMode,
    setMood,
    setRadius,
    setStationCount,
    setLocation,
    setError,
    clearError,
  } = useSearchState();

  const {
    result: moodResult,
    loading: moodLoading,
    error: moodError,
    convertMood,
    clearError: clearMoodError,
  } = useMoodConversion({ autoConvert: false });

  // 位置情報が取得されたら状態に設定
  useEffect(() => {
    if (coordinates) {
      setLocation(coordinates);
      clearError();
    }
  }, [coordinates, setLocation, clearError]);

  // 位置情報エラーがあれば表示
  useEffect(() => {
    if (locationError) {
      setError(locationError);
    }
  }, [locationError, setError]);

  // フォーム送信処理
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (disabled || loading || isSubmitting) {
      return;
    }

    // バリデーション
    const validationError = validateSearchParams(searchState);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    if (!coordinates) {
      setFormError('位置情報を取得してください');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    clearMoodError();

    try {
      // 気分を検索クエリに変換
      const moodConversionResult = await convertMood(searchState.mood);
      
      if (!moodConversionResult) {
        throw new Error('気分の変換に失敗しました');
      }

      // 検索実行
      const searchParams = {
        mode: searchState.mode,
        mood: searchState.mood,
        location: {
          lat: coordinates.latitude,
          lng: coordinates.longitude,
        },
        radius: searchState.mode === 'radius' ? searchState.radius : undefined,
        stationCount: searchState.mode === 'station' ? searchState.stationCount : undefined,
        searchQuery: moodConversionResult.searchQuery,
      };

      onSearch(searchParams);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '検索に失敗しました';
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 位置情報再取得
  const handleRetryLocation = async () => {
    try {
      await getCurrentPosition();
    } catch (error) {
      // エラーは useGeolocation で処理される
    }
  };

  const isFormDisabled = disabled || isSubmitting;
  const isSearchDisabled = isFormDisabled || !coordinates || !searchState.mood.trim();
  const currentError = formError || moodError || searchState.error;

  return (
    <form onSubmit={handleSubmit} className={`search-form ${className}`}>
      {/* 位置情報状態表示 */}
      <div className="search-form__location-status">
        {locationLoading && (
          <div className="search-form__location-loading">
            <div className="search-form__spinner" />
            <span>位置情報を取得中...</span>
          </div>
        )}
        
        {locationError && (
          <div className="search-form__location-error">
            <svg
              className="search-form__error-icon"
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
            <span>{locationError}</span>
            <button
              type="button"
              onClick={handleRetryLocation}
              className="search-form__retry-button"
              disabled={locationLoading}
            >
              再試行
            </button>
          </div>
        )}

        {coordinates && !locationError && (
          <div className="search-form__location-success">
            <svg
              className="search-form__success-icon"
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
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>位置情報を取得しました</span>
          </div>
        )}
      </div>

      {/* 検索モード切替 */}
      <div className="search-form__section">
        <ModeToggle
          mode={searchState.mode}
          onChange={setMode}
          disabled={isFormDisabled}
        />
      </div>

      {/* 気分入力 */}
      <div className="search-form__section">
        <MoodInput
          value={searchState.mood}
          onChange={setMood}
          onSubmit={handleSubmit}
          disabled={isFormDisabled}
          loading={moodLoading}
          error={moodError}
          autoFocus={true}
        />
      </div>

      {/* 範囲指定 */}
      <div className="search-form__section">
        {searchState.mode === 'radius' ? (
          <RadiusSlider
            value={searchState.radius}
            onChange={setRadius}
            disabled={isFormDisabled}
          />
        ) : (
          <StationCounter
            value={searchState.stationCount}
            onChange={setStationCount}
            disabled={isFormDisabled}
          />
        )}
      </div>

      {/* エラー表示 */}
      {currentError && (
        <div className="search-form__error" role="alert">
          <svg
            className="search-form__error-icon"
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
          {currentError}
        </div>
      )}

      {/* 検索ボタン */}
      <div className="search-form__actions">
        <button
          type="submit"
          disabled={isSearchDisabled}
          className={`search-form__submit-button ${
            isSearchDisabled ? 'search-form__submit-button--disabled' : ''
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="search-form__button-spinner" />
              <span>検索中...</span>
            </>
          ) : (
            <>
              <svg
                className="search-form__search-icon"
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
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <span>飲食店を検索</span>
            </>
          )}
        </button>
      </div>

      {/* 気分変換結果表示 */}
      {moodResult && (
        <div className="search-form__mood-result">
          <div className="search-form__mood-result-title">
            検索タグ:
          </div>
          <div className="search-form__mood-result-tags">
            {moodResult.searchTags.map((tag, index) => (
              <span key={index} className="search-form__mood-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}

/**
 * シンプルな検索フォームコンポーネント
 */
interface SimpleSearchFormProps {
  onSearch: (mood: string) => void;
  loading?: boolean;
  className?: string;
}

export function SimpleSearchForm({
  onSearch,
  loading = false,
  className = '',
}: SimpleSearchFormProps) {
  const [mood, setMood] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mood.trim()) {
      onSearch(mood.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`simple-search-form ${className}`}>
      <div className="simple-search-form__input-group">
        <input
          type="text"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          placeholder="今の気分を教えてください"
          disabled={loading}
          className="simple-search-form__input"
          maxLength={100}
        />
        <button
          type="submit"
          disabled={loading || !mood.trim()}
          className="simple-search-form__button"
        >
          {loading ? (
            <div className="simple-search-form__spinner" />
          ) : (
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
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
}