// パフォーマンス最適化ユーティリティ

import { useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * デバウンス関数（React用）
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // コールバックを最新に保つ
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );
}

/**
 * スロットル関数（React用）
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  const lastCallRef = useRef<number>(0);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callbackRef.current(...args);
      }
    }) as T,
    [delay]
  );
}

/**
 * メモ化された値（依存関係の深い比較）
 */
export function useDeepMemo<T>(factory: () => T, deps: any[]): T {
  const ref = useRef<{ deps: any[]; value: T }>();

  if (!ref.current || !deepEqual(ref.current.deps, deps)) {
    ref.current = {
      deps: [...deps],
      value: factory(),
    };
  }

  return ref.current.value;
}

/**
 * 深い比較関数
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a == null || b == null) return false;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => deepEqual(a[key], b[key]));
  }
  
  return false;
}

/**
 * パフォーマンス測定フック
 */
export function usePerformanceMonitor(name: string) {
  const startTimeRef = useRef<number>();

  const start = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const end = useCallback(() => {
    if (startTimeRef.current) {
      const duration = performance.now() - startTimeRef.current;
      console.log(`Performance [${name}]: ${duration.toFixed(2)}ms`);
      
      // Performance API に記録
      if ('performance' in window && 'mark' in performance) {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
      }
      
      return duration;
    }
    return 0;
  }, [name]);

  const measure = useCallback((fn: () => void) => {
    start();
    fn();
    return end();
  }, [start, end]);

  return { start, end, measure };
}

/**
 * 仮想化リスト用のフック
 */
export function useVirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length - 1, endIndex + overscan),
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1).map((item, index) => ({
      item,
      index: visibleRange.start + index,
    }));
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  };
}

/**
 * 遅延実行フック
 */
export function useDeferredValue<T>(value: T, delay: number = 0): T {
  const [deferredValue, setDeferredValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDeferredValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return deferredValue;
}

/**
 * バッチ更新フック
 */
export function useBatchedUpdates() {
  const updatesRef = useRef<(() => void)[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const batchUpdate = useCallback((update: () => void) => {
    updatesRef.current.push(update);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const updates = updatesRef.current;
      updatesRef.current = [];
      
      // React の unstable_batchedUpdates を使用（利用可能な場合）
      if (typeof window !== 'undefined' && 'React' in window) {
        // @ts-ignore
        const { unstable_batchedUpdates } = window.React;
        if (unstable_batchedUpdates) {
          unstable_batchedUpdates(() => {
            updates.forEach(update => update());
          });
          return;
        }
      }
      
      // フォールバック: 通常の実行
      updates.forEach(update => update());
    }, 0);
  }, []);

  return batchUpdate;
}

/**
 * メモリ使用量監視
 */
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<{
    used: number;
    total: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      // @ts-ignore - performance.memory は Chrome でのみ利用可能
      if ('performance' in window && 'memory' in performance) {
        // @ts-ignore
        const memory = performance.memory as any;
        const used = memory.usedJSHeapSize;
        const total = memory.totalJSHeapSize;
        
        setMemoryInfo({
          used,
          total,
          percentage: (used / total) * 100,
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // 5秒ごと

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
}

/**
 * レンダリング最適化のためのコンポーネント分割
 */
export function createMemoizedComponent<P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) {
  return React.memo(Component, areEqual);
}

/**
 * 重い計算の最適化
 */
export function useExpensiveCalculation<T, D extends any[]>(
  calculation: (...deps: D) => T,
  deps: D,
  shouldRecalculate?: (prevDeps: D, nextDeps: D) => boolean
): T {
  const memoizedValue = useMemo(() => {
    return calculation(...deps);
  }, shouldRecalculate ? [shouldRecalculate(deps, deps)] : deps);

  return memoizedValue;
}

/**
 * Web Workers を使用した重い処理の最適化
 */
export function useWebWorker<T, R>(
  workerFunction: (data: T) => R,
  dependencies: any[] = []
) {
  const workerRef = useRef<Worker>();
  const [result, setResult] = useState<R | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Web Worker のサポートチェック
    if (typeof Worker === 'undefined') {
      return;
    }

    // Worker スクリプトを動的に作成
    const workerScript = `
      self.onmessage = function(e) {
        try {
          const result = (${workerFunction.toString()})(e.data);
          self.postMessage({ type: 'success', result });
        } catch (error) {
          self.postMessage({ type: 'error', error: error.message });
        }
      };
    `;

    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    
    workerRef.current = new Worker(workerUrl);

    workerRef.current.onmessage = (e) => {
      const { type, result, error } = e.data;
      
      if (type === 'success') {
        setResult(result);
        setError(null);
      } else if (type === 'error') {
        setError(new Error(error));
      }
      
      setLoading(false);
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        URL.revokeObjectURL(workerUrl);
      }
    };
  }, dependencies);

  const execute = useCallback((data: T) => {
    if (workerRef.current) {
      setLoading(true);
      setError(null);
      workerRef.current.postMessage(data);
    }
  }, []);

  return { result, loading, error, execute };
}

import { useState } from 'react';
import React from 'react';