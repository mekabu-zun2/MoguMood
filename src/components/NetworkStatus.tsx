// ネットワーク状態監視コンポーネント

'use client';

import { useState, useEffect } from 'react';

interface NetworkStatusProps {
  onOnline?: () => void;
  onOffline?: () => void;
  showNotification?: boolean;
}

/**
 * ネットワーク状態監視コンポーネント
 */
export function NetworkStatus({ 
  onOnline, 
  onOffline, 
  showNotification = true 
}: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      if (online) {
        onOnline?.();
        setShowOfflineMessage(false);
      } else {
        onOffline?.();
        setShowOfflineMessage(true);
      }
    };

    // 初期状態を設定
    updateOnlineStatus();

    // イベントリスナーを追加
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [onOnline, onOffline]);

  if (!showNotification || isOnline) {
    return null;
  }

  return (
    <div className="network-status network-status--offline" role="alert">
      <div className="network-status__content">
        <svg
          className="network-status__icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
        <div className="network-status__message">
          <div className="network-status__title">オフライン</div>
          <div className="network-status__description">
            インターネット接続を確認してください
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ネットワーク状態フック
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      
      if (!isOnline && online) {
        // オフラインからオンラインに復帰
        setWasOffline(true);
      }
      
      setIsOnline(online);
    };

    updateOnlineStatus();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [isOnline]);

  const clearOfflineFlag = () => {
    setWasOffline(false);
  };

  return {
    isOnline,
    wasOffline,
    clearOfflineFlag,
  };
}

/**
 * 接続復旧時の自動リトライコンポーネント
 */
interface AutoRetryProps {
  onRetry: () => void;
  enabled?: boolean;
  delay?: number;
  children?: React.ReactNode;
}

export function AutoRetry({ 
  onRetry, 
  enabled = true, 
  delay = 1000,
  children 
}: AutoRetryProps) {
  const { isOnline, wasOffline, clearOfflineFlag } = useNetworkStatus();

  useEffect(() => {
    if (enabled && isOnline && wasOffline) {
      const timer = setTimeout(() => {
        onRetry();
        clearOfflineFlag();
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [enabled, isOnline, wasOffline, onRetry, delay, clearOfflineFlag]);

  return <>{children}</>;
}

/**
 * オフライン時のフォールバック表示
 */
interface OfflineFallbackProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function OfflineFallback({ children, fallback }: OfflineFallbackProps) {
  const { isOnline } = useNetworkStatus();

  if (!isOnline && fallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * デフォルトのオフライン表示
 */
export function DefaultOfflineFallback() {
  return (
    <div className="offline-fallback">
      <div className="offline-fallback__content">
        <svg
          className="offline-fallback__icon"
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
        <h3 className="offline-fallback__title">オフラインです</h3>
        <p className="offline-fallback__message">
          インターネット接続を確認して、再度お試しください。
        </p>
        <button
          onClick={() => window.location.reload()}
          className="offline-fallback__retry-button"
        >
          再読み込み
        </button>
      </div>
    </div>
  );
}