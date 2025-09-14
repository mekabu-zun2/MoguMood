// 検索結果一覧コンポーネント

'use client';

import { useState, useEffect, useRef } from 'react';
import { ResultCard, CompactResultCard, ResultCardSkeleton } from './ResultCard';
import type { RestaurantResult } from '../types';

interface ResultListProps {
  results: RestaurantResult[];
  loading?: boolean;
  error?: string | null;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onResultClick?: (restaurant: RestaurantResult) => void;
  layout?: 'card' | 'compact';
  showDistance?: boolean;
  showStation?: boolean;
  emptyMessage?: string;
  className?: string;
}

/**
 * 検索結果一覧コンポーネント
 */
export function ResultList({
  results,
  loading = false,
  error = null,
  hasMore = false,
  onLoadMore,
  onResultClick,
  layout = 'card',
  showDistance = true,
  showStation = false,
  emptyMessage = '条件に合う飲食店が見つかりませんでした。',
  className = '',
}: ResultListProps) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);

  // 無限スクロール用のIntersection Observer
  useEffect(() => {
    if (!hasMore || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !loading && !isLoadingMore) {
          setIsLoadingMore(true);
          onLoadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    intersectionObserverRef.current = observer;

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasMore, onLoadMore, loading, isLoadingMore]);

  // ロード完了時にisLoadingMoreをリセット
  useEffect(() => {
    if (!loading) {
      setIsLoadingMore(false);
    }
  }, [loading]);

  // エラー状態
  if (error) {
    return (
      <div className={`result-list result-list--error ${className}`}>
        <div className="result-list__error">
          <svg
            className="result-list__error-icon"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <h3 className="result-list__error-title">検索エラー</h3>
          <p className="result-list__error-message">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="result-list__retry-button"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  // 初回ローディング状態
  if (loading && results.length === 0) {
    return (
      <div className={`result-list result-list--loading ${className}`}>
        <div className="result-list__loading">
          <div className="result-list__spinner" />
          <p className="result-list__loading-text">飲食店を検索中...</p>
        </div>
        
        {/* スケルトンローダー */}
        <div className={`result-list__skeleton ${layout === 'compact' ? 'result-list__skeleton--compact' : ''}`}>
          {Array.from({ length: 6 }, (_, index) => (
            <ResultCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  // 空の結果
  if (!loading && results.length === 0) {
    return (
      <div className={`result-list result-list--empty ${className}`}>
        <div className="result-list__empty">
          <svg
            className="result-list__empty-icon"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
            <path d="M16 16l-4-4" />
          </svg>
          <h3 className="result-list__empty-title">検索結果なし</h3>
          <p className="result-list__empty-message">{emptyMessage}</p>
          <div className="result-list__empty-suggestions">
            <p className="text-sm text-gray-600 mb-2">検索のヒント:</p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• 気分の表現を変えてみてください</li>
              <li>• 検索範囲を広げてみてください</li>
              <li>• 別の場所で検索してみてください</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // 結果表示
  return (
    <div className={`result-list ${className}`}>
      {/* 結果ヘッダー */}
      <div className="result-list__header">
        <h2 className="result-list__title">
          検索結果 ({results.length}件)
        </h2>
        
        {/* ソート・フィルターオプション（将来の拡張用） */}
        <div className="result-list__controls">
          {/* 今後、ソートやフィルター機能を追加する場合はここに配置 */}
        </div>
      </div>

      {/* 結果一覧 */}
      <div className={`result-list__grid ${
        layout === 'compact' ? 'result-list__grid--compact' : 'result-list__grid--card'
      }`}>
        {results.map((restaurant, index) => (
          layout === 'compact' ? (
            <CompactResultCard
              key={`${restaurant.placeId}-${index}`}
              restaurant={restaurant}
              onClick={onResultClick}
            />
          ) : (
            <ResultCard
              key={`${restaurant.placeId}-${index}`}
              restaurant={restaurant}
              onClick={onResultClick}
              showDistance={showDistance}
              showStation={showStation}
            />
          )
        ))}
      </div>

      {/* 追加ローディング */}
      {isLoadingMore && (
        <div className="result-list__load-more-loading">
          <div className="result-list__spinner" />
          <span>さらに読み込み中...</span>
        </div>
      )}

      {/* 無限スクロール用のトリガー要素 */}
      {hasMore && !isLoadingMore && (
        <div ref={observerRef} className="result-list__load-trigger" />
      )}

      {/* 手動ロードボタン（フォールバック） */}
      {hasMore && !isLoadingMore && onLoadMore && (
        <div className="result-list__load-more">
          <button
            type="button"
            onClick={() => {
              setIsLoadingMore(true);
              onLoadMore();
            }}
            className="result-list__load-more-button"
          >
            さらに表示
          </button>
        </div>
      )}

      {/* 全件表示完了メッセージ */}
      {!hasMore && results.length > 0 && (
        <div className="result-list__end-message">
          <p className="text-sm text-gray-500 text-center">
            全ての検索結果を表示しました
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * 検索結果統計コンポーネント
 */
interface ResultStatsProps {
  results: RestaurantResult[];
  searchTime?: number;
  className?: string;
}

export function ResultStats({
  results,
  searchTime,
  className = '',
}: ResultStatsProps) {
  if (results.length === 0) return null;

  const averageRating = results.reduce((sum, r) => sum + (r.rating || 0), 0) / results.length;
  const averageDistance = results.reduce((sum, r) => sum + (r.distance || 0), 0) / results.length;

  return (
    <div className={`result-stats ${className}`}>
      <div className="result-stats__grid">
        <div className="result-stats__item">
          <div className="result-stats__value">{results.length}</div>
          <div className="result-stats__label">件</div>
        </div>
        
        {averageRating > 0 && (
          <div className="result-stats__item">
            <div className="result-stats__value">
              <svg
                className="result-stats__star"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {averageRating.toFixed(1)}
            </div>
            <div className="result-stats__label">平均評価</div>
          </div>
        )}

        {averageDistance > 0 && (
          <div className="result-stats__item">
            <div className="result-stats__value">
              {averageDistance < 1000 
                ? `${Math.round(averageDistance)}m`
                : `${(averageDistance / 1000).toFixed(1)}km`
              }
            </div>
            <div className="result-stats__label">平均距離</div>
          </div>
        )}

        {searchTime && (
          <div className="result-stats__item">
            <div className="result-stats__value">{searchTime.toFixed(1)}s</div>
            <div className="result-stats__label">検索時間</div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 検索結果フィルターコンポーネント（将来の拡張用）
 */
interface ResultFilterProps {
  onFilterChange: (filters: {
    minRating?: number;
    maxDistance?: number;
    priceLevel?: number[];
    types?: string[];
  }) => void;
  className?: string;
}

export function ResultFilter({
  onFilterChange,
  className = '',
}: ResultFilterProps) {
  // 将来の拡張用のプレースホルダー
  return (
    <div className={`result-filter ${className}`}>
      {/* フィルター機能は将来実装 */}
    </div>
  );
}