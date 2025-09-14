// ローディング表示コンポーネント

'use client';

import { useEffect, useState } from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  className?: string;
}

/**
 * ローディングコンポーネント
 */
export function Loader({
  size = 'md',
  variant = 'spinner',
  color = 'primary',
  text,
  fullScreen = false,
  overlay = false,
  className = '',
}: LoaderProps) {
  const [dots, setDots] = useState('');

  // テキストのドット アニメーション
  useEffect(() => {
    if (!text) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [text]);

  const sizeClasses = {
    sm: 'loader--sm',
    md: 'loader--md',
    lg: 'loader--lg',
    xl: 'loader--xl',
  };

  const colorClasses = {
    primary: 'loader--primary',
    secondary: 'loader--secondary',
    white: 'loader--white',
    gray: 'loader--gray',
  };

  const containerClasses = [
    'loader',
    sizeClasses[size],
    colorClasses[color],
    fullScreen ? 'loader--fullscreen' : '',
    overlay ? 'loader--overlay' : '',
    className,
  ].filter(Boolean).join(' ');

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return <DotsLoader />;
      case 'pulse':
        return <PulseLoader />;
      case 'bars':
        return <BarsLoader />;
      default:
        return <SpinnerLoader />;
    }
  };

  return (
    <div className={containerClasses} role="status" aria-label="読み込み中">
      <div className="loader__content">
        {renderLoader()}
        {text && (
          <div className="loader__text" aria-live="polite">
            {text}{dots}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * スピナーローダー
 */
function SpinnerLoader() {
  return (
    <div className="spinner-loader">
      <div className="spinner-loader__circle" />
    </div>
  );
}

/**
 * ドットローダー
 */
function DotsLoader() {
  return (
    <div className="dots-loader">
      <div className="dots-loader__dot dots-loader__dot--1" />
      <div className="dots-loader__dot dots-loader__dot--2" />
      <div className="dots-loader__dot dots-loader__dot--3" />
    </div>
  );
}

/**
 * パルスローダー
 */
function PulseLoader() {
  return (
    <div className="pulse-loader">
      <div className="pulse-loader__circle pulse-loader__circle--1" />
      <div className="pulse-loader__circle pulse-loader__circle--2" />
    </div>
  );
}

/**
 * バーローダー
 */
function BarsLoader() {
  return (
    <div className="bars-loader">
      <div className="bars-loader__bar bars-loader__bar--1" />
      <div className="bars-loader__bar bars-loader__bar--2" />
      <div className="bars-loader__bar bars-loader__bar--3" />
      <div className="bars-loader__bar bars-loader__bar--4" />
    </div>
  );
}

/**
 * インラインローダー（テキスト内で使用）
 */
interface InlineLoaderProps {
  size?: 'xs' | 'sm';
  className?: string;
}

export function InlineLoader({ size = 'xs', className = '' }: InlineLoaderProps) {
  return (
    <div className={`inline-loader inline-loader--${size} ${className}`}>
      <div className="inline-loader__spinner" />
    </div>
  );
}

/**
 * ボタンローダー（ボタン内で使用）
 */
interface ButtonLoaderProps {
  size?: 'sm' | 'md';
  className?: string;
}

export function ButtonLoader({ size = 'sm', className = '' }: ButtonLoaderProps) {
  return (
    <div className={`button-loader button-loader--${size} ${className}`}>
      <div className="button-loader__spinner" />
    </div>
  );
}

/**
 * スケルトンローダー
 */
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = '1rem',
  variant = 'text',
  animation = 'pulse',
  className = '',
}: SkeletonProps) {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  const skeletonClasses = [
    'skeleton',
    `skeleton--${variant}`,
    `skeleton--${animation}`,
    className,
  ].filter(Boolean).join(' ');

  return <div className={skeletonClasses} style={style} />;
}

/**
 * プログレスバー
 */
interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'linear' | 'circular';
  showValue?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  variant = 'linear',
  showValue = false,
  color = 'primary',
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  if (variant === 'circular') {
    return (
      <div className={`progress-circular progress-circular--${size} progress-circular--${color} ${className}`}>
        <svg className="progress-circular__svg" viewBox="0 0 36 36">
          <path
            className="progress-circular__track"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="progress-circular__bar"
            strokeDasharray={`${percentage}, 100`}
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        {showValue && (
          <div className="progress-circular__value">
            {Math.round(percentage)}%
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`progress-linear progress-linear--${size} progress-linear--${color} ${className}`}>
      <div className="progress-linear__track">
        <div
          className="progress-linear__bar"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <div className="progress-linear__value">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
}

/**
 * ローディングオーバーレイ
 */
interface LoadingOverlayProps {
  visible: boolean;
  text?: string;
  variant?: 'spinner' | 'dots' | 'pulse';
  className?: string;
  children?: React.ReactNode;
}

export function LoadingOverlay({
  visible,
  text = '読み込み中...',
  variant = 'spinner',
  className = '',
  children,
}: LoadingOverlayProps) {
  if (!visible) {
    return <>{children}</>;
  }

  return (
    <div className={`loading-overlay ${className}`}>
      {children}
      <div className="loading-overlay__backdrop">
        <div className="loading-overlay__content">
          <Loader variant={variant} text={text} color="white" />
        </div>
      </div>
    </div>
  );
}