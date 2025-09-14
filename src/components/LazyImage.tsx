// 遅延読み込み画像コンポーネント

'use client';

import { useState, useRef, useEffect, memo } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  threshold?: number;
  rootMargin?: string;
}

/**
 * 遅延読み込み画像コンポーネント
 */
export const LazyImage = memo(function LazyImage({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder,
  fallback,
  onLoad,
  onError,
  threshold = 0.1,
  rootMargin = '50px',
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer の設定
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current = observer;

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // エラー時のフォールバック
  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div
      ref={imgRef}
      className={`lazy-image ${className}`}
      style={{ width, height }}
    >
      {isInView ? (
        <>
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={`lazy-image__img ${isLoaded ? 'lazy-image__img--loaded' : ''}`}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
          />
          {!isLoaded && (
            <div className="lazy-image__placeholder">
              {placeholder ? (
                <img
                  src={placeholder}
                  alt=""
                  className="lazy-image__placeholder-img"
                />
              ) : (
                <div className="lazy-image__skeleton" />
              )}
            </div>
          )}
        </>
      ) : (
        <div className="lazy-image__placeholder">
          {placeholder ? (
            <img
              src={placeholder}
              alt=""
              className="lazy-image__placeholder-img"
            />
          ) : (
            <div className="lazy-image__skeleton" />
          )}
        </div>
      )}
    </div>
  );
});

/**
 * 画像プリロードフック
 */
export function useImagePreload(urls: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const preloadImage = (url: string) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        
        img.onload = () => {
          setLoadedImages(prev => new Set(prev).add(url));
          resolve();
        };
        
        img.onerror = () => {
          setFailedImages(prev => new Set(prev).add(url));
          resolve();
        };
        
        img.src = url;
      });
    };

    // 並列でプリロード
    Promise.all(urls.map(preloadImage));
  }, [urls]);

  return {
    loadedImages,
    failedImages,
    isLoaded: (url: string) => loadedImages.has(url),
    hasFailed: (url: string) => failedImages.has(url),
  };
}

/**
 * 画像最適化ユーティリティ
 */
export const imageUtils = {
  /**
   * WebP対応チェック
   */
  supportsWebP: (() => {
    if (typeof window === 'undefined') return false;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  })(),

  /**
   * 最適な画像フォーマットを取得
   */
  getOptimalFormat: (originalUrl: string): string => {
    if (imageUtils.supportsWebP && !originalUrl.includes('.webp')) {
      // WebP対応の場合、URLパラメータで変換を指示
      // 実際の実装では画像CDNのAPIに依存
      return originalUrl + '?format=webp';
    }
    return originalUrl;
  },

  /**
   * レスポンシブ画像URLを生成
   */
  generateResponsiveUrls: (baseUrl: string, sizes: number[]): string[] => {
    return sizes.map(size => `${baseUrl}?w=${size}&h=${size}&fit=crop`);
  },

  /**
   * 画像サイズを最適化
   */
  optimizeSize: (url: string, width: number, height?: number): string => {
    const params = new URLSearchParams();
    params.set('w', width.toString());
    if (height) {
      params.set('h', height.toString());
    }
    params.set('fit', 'crop');
    params.set('auto', 'format,compress');
    
    return `${url}?${params.toString()}`;
  },
};