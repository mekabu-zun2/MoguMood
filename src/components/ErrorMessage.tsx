// エラー表示コンポーネント

'use client';

import React, { useState } from 'react';

import type { ApiError } from '../types';
import { getErrorRecoveryActions, isRetryableError, isTemporaryError } from '../utils/errorHandling';

interface ErrorMessageProps {
  error: string | ApiError | Error | null;
  variant?: 'inline' | 'card' | 'banner' | 'toast';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showRetry?: boolean;
  showDismiss?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

/**
 * エラーメッセージコンポーネント
 */
export function ErrorMessage({
  error,
  variant = 'card',
  size = 'md',
  showIcon = true,
  showRetry = true,
  showDismiss = false,
  onRetry,
  onDismiss,
  className = '',
}: ErrorMessageProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!error || isDismissed) {
    return null;
  }

  const errorInfo = parseError(error);
  const canRetry = showRetry && onRetry && (isRetryableError(errorInfo) || isTemporaryError(errorInfo));
  const recoveryActions = getErrorRecoveryActions(errorInfo);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const variantClasses = {
    inline: 'error-message--inline',
    card: 'error-message--card',
    banner: 'error-message--banner',
    toast: 'error-message--toast',
  };

  const sizeClasses = {
    sm: 'error-message--sm',
    md: 'error-message--md',
    lg: 'error-message--lg',
  };

  const errorClasses = [
    'error-message',
    variantClasses[variant],
    sizeClasses[size],
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={errorClasses} role="alert">
      <div className="error-message__content">
        {showIcon && (
          <div className="error-message__icon">
            <ErrorIcon errorCode={errorInfo.code} />
          </div>
        )}

        <div className="error-message__body">
          <div className="error-message__title">
            {getErrorTitle(errorInfo.code)}
          </div>
          
          <div className="error-message__description">
            {errorInfo.message}
          </div>

          {recoveryActions.length > 0 && (
            <div className="error-message__recovery">
              <p className="error-message__recovery-title">解決方法:</p>
              <ul className="error-message__recovery-list">
                {recoveryActions.map((action, index) => (
                  <li key={index} className="error-message__recovery-item">
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="error-message__actions">
          {canRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="error-message__retry-button"
            >
              <svg
                className="error-message__retry-icon"
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
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
              </svg>
              再試行
            </button>
          )}

          {showDismiss && (
            <button
              type="button"
              onClick={handleDismiss}
              className="error-message__dismiss-button"
              aria-label="エラーメッセージを閉じる"
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * エラーアイコンコンポーネント
 */
function ErrorIcon({ errorCode }: { errorCode: string }) {
  const getIcon = () => {
    switch (errorCode) {
      case 'NETWORK_ERROR':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
          </svg>
        );
      case 'LOCATION_ERROR':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      case 'API_KEY_ERROR':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <circle cx="12" cy="16" r="1" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        );
      case 'RATE_LIMIT_ERROR':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
    }
  };

  return (
    <div className="error-icon">
      {getIcon()}
    </div>
  );
}

/**
 * トーストエラーメッセージ
 */
interface ToastErrorProps {
  error: string | ApiError | Error | null;
  visible: boolean;
  onClose: () => void;
  duration?: number;
  position?: 'top' | 'bottom';
}

export function ToastError({
  error,
  visible,
  onClose,
  duration = 5000,
  position = 'top',
}: ToastErrorProps) {
  const [isVisible, setIsVisible] = useState(visible);

  // 自動閉じる
  useState(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // アニメーション完了後に閉じる
      }, duration);

      return () => clearTimeout(timer);
    }
  });

  if (!error || !isVisible) {
    return null;
  }

  const errorInfo = parseError(error);

  return (
    <div className={`toast-error toast-error--${position} ${visible ? 'toast-error--visible' : ''}`}>
      <ErrorMessage
        error={error}
        variant="toast"
        showDismiss={true}
        onDismiss={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
      />
    </div>
  );
}

/**
 * エラー境界コンポーネント
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

/**
 * デフォルトエラーフォールバック
 */
function DefaultErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="error-fallback">
      <div className="error-fallback__content">
        <h2 className="error-fallback__title">予期しないエラーが発生しました</h2>
        <p className="error-fallback__message">
          アプリケーションでエラーが発生しました。ページを再読み込みするか、しばらく時間をおいてから再度お試しください。
        </p>
        <div className="error-fallback__actions">
          <button onClick={retry} className="error-fallback__retry-button">
            再試行
          </button>
          <button
            onClick={() => window.location.reload()}
            className="error-fallback__reload-button"
          >
            ページを再読み込み
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="error-fallback__details">
            <summary>エラー詳細（開発用）</summary>
            <pre className="error-fallback__stack">{error.stack}</pre>
          </details>
        )}
      </div>
    </div>
  );
}

/**
 * エラーを統一形式に変換
 */
function parseError(error: string | ApiError | Error): ApiError {
  if (typeof error === 'string') {
    return {
      code: 'UNKNOWN_ERROR',
      message: error,
    };
  }

  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      details: { originalError: error },
    };
  }

  return error;
}

/**
 * エラーコードに対応するタイトルを取得
 */
function getErrorTitle(errorCode: string): string {
  const titleMap: Record<string, string> = {
    NETWORK_ERROR: 'ネットワークエラー',
    LOCATION_ERROR: '位置情報エラー',
    API_KEY_ERROR: '認証エラー',
    RATE_LIMIT_ERROR: 'リクエスト制限',
    INVALID_REQUEST: '入力エラー',
    UNKNOWN_ERROR: 'エラー',
  };

  return titleMap[errorCode] || 'エラー';
}