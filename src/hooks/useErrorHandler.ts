import { useCallback, useState } from 'react';
import type { ApiError } from '../types';
import { getErrorMessage, getErrorRecoveryActions } from '../utils/errorHandling';

interface ErrorState {
  error: ApiError | null;
  isVisible: boolean;
  recoveryActions: string[];
}

/**
 * 統一されたエラーハンドリングフック
 */
export function useErrorHandler() {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isVisible: false,
    recoveryActions: [],
  });

  /**
   * エラーを表示
   */
  const showError = useCallback((error: ApiError | Error | string) => {
    let apiError: ApiError;

    if (typeof error === 'string') {
      apiError = {
        code: 'UNKNOWN_ERROR',
        message: error,
        details: {},
      };
    } else if (error instanceof Error) {
      apiError = {
        code: 'UNKNOWN_ERROR',
        message: error.message,
        details: { originalError: error.name },
      };
    } else {
      apiError = error;
    }

    const recoveryActions = getErrorRecoveryActions(apiError);

    setErrorState({
      error: apiError,
      isVisible: true,
      recoveryActions,
    });

    // エラーログ出力
    console.error('Error handled:', apiError);
  }, []);

  /**
   * エラーをクリア
   */
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isVisible: false,
      recoveryActions: [],
    });
  }, []);

  /**
   * エラーを一時的に非表示
   */
  const hideError = useCallback(() => {
    setErrorState(prev => ({
      ...prev,
      isVisible: false,
    }));
  }, []);

  /**
   * エラーメッセージを取得
   */
  const getDisplayMessage = useCallback(() => {
    if (!errorState.error) return '';
    return getErrorMessage(errorState.error.code);
  }, [errorState.error]);

  /**
   * リトライ可能かどうか
   */
  const canRetry = useCallback(() => {
    if (!errorState.error) return false;
    
    const retryableErrors = [
      'NETWORK_ERROR',
      'RATE_LIMIT_ERROR',
      'UNKNOWN_ERROR',
    ];
    
    return retryableErrors.includes(errorState.error.code);
  }, [errorState.error]);

  /**
   * 一時的なエラーかどうか
   */
  const isTemporary = useCallback(() => {
    if (!errorState.error) return false;
    
    const temporaryErrors = [
      'NETWORK_ERROR',
      'RATE_LIMIT_ERROR',
      'UNKNOWN_ERROR',
    ];
    
    return temporaryErrors.includes(errorState.error.code);
  }, [errorState.error]);

  return {
    // 状態
    error: errorState.error,
    isVisible: errorState.isVisible,
    recoveryActions: errorState.recoveryActions,
    
    // アクション
    showError,
    clearError,
    hideError,
    
    // ヘルパー
    getDisplayMessage,
    canRetry,
    isTemporary,
  };
}