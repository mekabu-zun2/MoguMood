// 検索結果カードコンポーネント

'use client';

import { useState, memo, useCallback } from 'react';
import { LazyImage } from './LazyImage';
import type { RestaurantResult } from '../types';
import { formatDistance, formatRating, formatPriceLevel } from '../utils/helpers';

interface ResultCardProps {
  restaurant: RestaurantResult;
  showDistance?: boolean;
  showStation?: boolean;
  onClick?: (restaurant: RestaurantResult) => void;
  className?: string;
}

/**
 * 検索結果カードコンポーネント（メモ化）
 */
export const ResultCard = memo(function ResultCard({
  restaurant,
  showDistance = true,
  showStation = false,
  onClick,
  className = '',
}: ResultCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleCardClick = useCallback(() => {
    if (onClick) {
      onClick(restaurant);
    }
  }, [onClick, restaurant]);

  const handleGoogleMapsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(restaurant.googleMapsUrl, '_blank', 'noopener,noreferrer');
  }, [restaurant.googleMapsUrl]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  const primaryImage = restaurant.photos[0];
  const hasValidRating = restaurant.rating > 0;
  const hasValidPrice = restaurant.priceLevel > 0;

  return (
    <div
      className={`result-card ${onClick ? 'result-card--clickable' : ''} ${className}`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : -1}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? `${restaurant.name}の詳細を表示` : undefined}
    >
      {/* 画像セクション */}
      <div className="result-card__image-container">
        {primaryImage && !imageError ? (
          <LazyImage
            src={primaryImage}
            alt={`${restaurant.name}の写真`}
            className="result-card__image"
            onLoad={handleImageLoad}
            onError={handleImageError}
            fallback={
              <div className="result-card__image-fallback">
                <svg
                  className="result-card__fallback-icon"
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
                  <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
            }
          />
        ) : (
          <div className="result-card__image-fallback">
            <svg
              className="result-card__fallback-icon"
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
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        )}

        {/* 評価バッジ */}
        {hasValidRating && (
          <div className="result-card__rating-badge">
            <svg
              className="result-card__star-icon"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span>{restaurant.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* コンテンツセクション */}
      <div className="result-card__content">
        {/* ヘッダー */}
        <div className="result-card__header">
          <h3 className="result-card__name">{restaurant.name}</h3>
          {hasValidPrice && (
            <div className="result-card__price">
              {formatPriceLevel(restaurant.priceLevel)}
            </div>
          )}
        </div>

        {/* メタ情報 */}
        <div className="result-card__meta">
          {/* ジャンル */}
          {restaurant.types.length > 0 && (
            <div className="result-card__types">
              {restaurant.types
                .filter(type => !['establishment', 'point_of_interest'].includes(type))
                .slice(0, 2)
                .map((type, index) => (
                  <span key={index} className="result-card__type-tag">
                    {formatRestaurantType(type)}
                  </span>
                ))}
            </div>
          )}

          {/* 距離・駅情報 */}
          <div className="result-card__location">
            {showDistance && restaurant.distance !== undefined && (
              <div className="result-card__distance">
                <svg
                  className="result-card__location-icon"
                  width="14"
                  height="14"
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
                <span>{formatDistance(restaurant.distance)}</span>
              </div>
            )}

            {showStation && restaurant.nearestStation && (
              <div className="result-card__station">
                <svg
                  className="result-card__station-icon"
                  width="14"
                  height="14"
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
                <span>{restaurant.nearestStation}</span>
              </div>
            )}
          </div>
        </div>

        {/* 住所 */}
        {restaurant.vicinity && (
          <div className="result-card__vicinity">
            {restaurant.vicinity}
          </div>
        )}

        {/* アクションボタン */}
        <div className="result-card__actions">
          <button
            type="button"
            onClick={handleGoogleMapsClick}
            className="result-card__maps-button"
            aria-label={`${restaurant.name}をGoogleマップで開く`}
          >
            <svg
              className="result-card__maps-icon"
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
            <span>Googleマップで開く</span>
          </button>
        </div>
      </div>
    </div>
  );
});

/**
 * コンパクトな検索結果カードコンポーネント（メモ化）
 */
interface CompactResultCardProps {
  restaurant: RestaurantResult;
  onClick?: (restaurant: RestaurantResult) => void;
  className?: string;
}

export const CompactResultCard = memo(function CompactResultCard({
  restaurant,
  onClick,
  className = '',
}: CompactResultCardProps) {
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(restaurant);
    }
  }, [onClick, restaurant]);

  const handleGoogleMapsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(restaurant.googleMapsUrl, '_blank', 'noopener,noreferrer');
  }, [restaurant.googleMapsUrl]);

  return (
    <div
      className={`compact-result-card ${onClick ? 'compact-result-card--clickable' : ''} ${className}`}
      onClick={handleClick}
    >
      <div className="compact-result-card__content">
        <div className="compact-result-card__header">
          <h4 className="compact-result-card__name">{restaurant.name}</h4>
          {restaurant.rating > 0 && (
            <div className="compact-result-card__rating">
              <svg
                className="compact-result-card__star"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span>{restaurant.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="compact-result-card__meta">
          {restaurant.distance !== undefined && (
            <span className="compact-result-card__distance">
              {formatDistance(restaurant.distance)}
            </span>
          )}
          {restaurant.priceLevel > 0 && (
            <span className="compact-result-card__price">
              {formatPriceLevel(restaurant.priceLevel)}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleMapsClick}
        className="compact-result-card__maps-button"
        aria-label={`${restaurant.name}をGoogleマップで開く`}
      >
        <svg
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
      </button>
    </div>
  );
});

/**
 * レストランタイプを日本語に変換
 */
function formatRestaurantType(type: string): string {
  const typeMap: Record<string, string> = {
    restaurant: 'レストラン',
    food: '飲食店',
    meal_takeaway: 'テイクアウト',
    cafe: 'カフェ',
    bar: 'バー',
    bakery: 'ベーカリー',
    meal_delivery: 'デリバリー',
    night_club: 'ナイトクラブ',
    lodging: '宿泊施設',
    tourist_attraction: '観光地',
  };

  return typeMap[type] || type;
}

/**
 * 検索結果カードのスケルトンローダー
 */
export function ResultCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`result-card-skeleton ${className}`}>
      <div className="result-card-skeleton__image" />
      <div className="result-card-skeleton__content">
        <div className="result-card-skeleton__header">
          <div className="result-card-skeleton__name" />
          <div className="result-card-skeleton__price" />
        </div>
        <div className="result-card-skeleton__meta">
          <div className="result-card-skeleton__type" />
          <div className="result-card-skeleton__distance" />
        </div>
        <div className="result-card-skeleton__vicinity" />
        <div className="result-card-skeleton__button" />
      </div>
    </div>
  );
}