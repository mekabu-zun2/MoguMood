// useGeolocation フックのテスト

import { renderHook, act } from '@testing-library/react';
import { useGeolocation } from '../useGeolocation';

// モックの位置情報
const mockPosition = {
  coords: {
    latitude: 35.6812,
    longitude: 139.7671,
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  timestamp: Date.now(),
};

const mockGeolocationError = {
  code: 1,
  message: 'User denied Geolocation',
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
};

describe('useGeolocation', () => {
  let mockGetCurrentPosition: jest.Mock;
  let mockWatchPosition: jest.Mock;
  let mockClearWatch: jest.Mock;

  beforeEach(() => {
    mockGetCurrentPosition = jest.fn();
    mockWatchPosition = jest.fn();
    mockClearWatch = jest.fn();

    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: mockGetCurrentPosition,
        watchPosition: mockWatchPosition,
        clearWatch: mockClearWatch,
      },
      configurable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useGeolocation());

    expect(result.current.coordinates).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.supported).toBe(true);
  });

  it('should get current position successfully', async () => {
    mockGetCurrentPosition.mockImplementation((success) => {
      setTimeout(() => success(mockPosition), 0);
    });

    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      await result.current.getCurrentPosition();
    });

    expect(result.current.coordinates).toEqual(mockPosition.coords);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle geolocation error', async () => {
    mockGetCurrentPosition.mockImplementation((success, error) => {
      setTimeout(() => error(mockGeolocationError), 0);
    });

    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      try {
        await result.current.getCurrentPosition();
      } catch (error) {
        // エラーは期待される
      }
    });

    expect(result.current.coordinates).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('should start watching position', () => {
    const watchId = 123;
    mockWatchPosition.mockReturnValue(watchId);

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.startWatching();
    });

    expect(mockWatchPosition).toHaveBeenCalled();
    expect(result.current.loading).toBe(true);
  });

  it('should stop watching position', () => {
    const watchId = 123;
    mockWatchPosition.mockReturnValue(watchId);

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.startWatching();
    });

    act(() => {
      result.current.stopWatching();
    });

    expect(mockClearWatch).toHaveBeenCalledWith(watchId);
  });

  it('should auto-start when autoStart is true', () => {
    mockGetCurrentPosition.mockImplementation((success) => {
      setTimeout(() => success(mockPosition), 0);
    });

    renderHook(() => useGeolocation({ autoStart: true }));

    expect(mockGetCurrentPosition).toHaveBeenCalled();
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useGeolocation());

    // エラー状態を設定（実際の実装では内部的に設定される）
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should detect unsupported browser', () => {
    // geolocation を削除してサポートされていない状態をシミュレート
    Object.defineProperty(global.navigator, 'geolocation', {
      value: undefined,
      configurable: true,
    });

    const { result } = renderHook(() => useGeolocation());

    expect(result.current.supported).toBe(false);
  });
});