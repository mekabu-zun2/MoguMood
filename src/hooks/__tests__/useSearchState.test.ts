// useSearchState フックのテスト

import { renderHook, act } from '@testing-library/react';
import { useSearchState, validateSearchParams } from '../useSearchState';
import { SEARCH_RADIUS, STATION_COUNT } from '../../utils/constants';

describe('useSearchState', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSearchState());

    expect(result.current.searchState.mode).toBe('radius');
    expect(result.current.searchState.mood).toBe('');
    expect(result.current.searchState.radius).toBe(SEARCH_RADIUS.DEFAULT);
    expect(result.current.searchState.stationCount).toBe(STATION_COUNT.DEFAULT);
    expect(result.current.searchState.location).toBeNull();
    expect(result.current.searchState.results).toEqual([]);
    expect(result.current.searchState.loading).toBe(false);
    expect(result.current.searchState.error).toBeNull();
  });

  it('should initialize with custom values', () => {
    const { result } = renderHook(() => 
      useSearchState({
        initialMode: 'station',
        initialRadius: 2000,
        initialStationCount: 3,
      })
    );

    expect(result.current.searchState.mode).toBe('station');
    expect(result.current.searchState.radius).toBe(2000);
    expect(result.current.searchState.stationCount).toBe(3);
  });

  it('should update mode', () => {
    const { result } = renderHook(() => useSearchState());

    act(() => {
      result.current.setMode('station');
    });

    expect(result.current.searchState.mode).toBe('station');
    expect(result.current.searchState.error).toBeNull();
  });

  it('should update mood', () => {
    const { result } = renderHook(() => useSearchState());

    act(() => {
      result.current.setMood('疲れた時に食べたい温かいもの');
    });

    expect(result.current.searchState.mood).toBe('疲れた時に食べたい温かいもの');
  });

  it('should update radius within bounds', () => {
    const { result } = renderHook(() => useSearchState());

    act(() => {
      result.current.setRadius(1500);
    });

    expect(result.current.searchState.radius).toBe(1500);

    // 最小値以下の場合
    act(() => {
      result.current.setRadius(100);
    });

    expect(result.current.searchState.radius).toBe(SEARCH_RADIUS.MIN);

    // 最大値以上の場合
    act(() => {
      result.current.setRadius(10000);
    });

    expect(result.current.searchState.radius).toBe(SEARCH_RADIUS.MAX);
  });

  it('should update station count within bounds', () => {
    const { result } = renderHook(() => useSearchState());

    act(() => {
      result.current.setStationCount(3);
    });

    expect(result.current.searchState.stationCount).toBe(3);

    // 最小値以下の場合
    act(() => {
      result.current.setStationCount(0);
    });

    expect(result.current.searchState.stationCount).toBe(STATION_COUNT.MIN);

    // 最大値以上の場合
    act(() => {
      result.current.setStationCount(10);
    });

    expect(result.current.searchState.stationCount).toBe(STATION_COUNT.MAX);
  });

  it('should set location', () => {
    const { result } = renderHook(() => useSearchState());
    const mockLocation = {
      latitude: 35.6812,
      longitude: 139.7671,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    };

    act(() => {
      result.current.setLocation(mockLocation);
    });

    expect(result.current.searchState.location).toEqual(mockLocation);
  });

  it('should set and clear results', () => {
    const { result } = renderHook(() => useSearchState());
    const mockResults = [
      {
        placeId: 'test1',
        name: 'Test Restaurant 1',
        rating: 4.5,
        priceLevel: 2,
        types: ['restaurant'],
        vicinity: 'Test Address 1',
        photos: [],
        googleMapsUrl: 'https://maps.google.com/test1',
      },
    ];

    act(() => {
      result.current.setResults(mockResults);
    });

    expect(result.current.searchState.results).toEqual(mockResults);

    act(() => {
      result.current.clearResults();
    });

    expect(result.current.searchState.results).toEqual([]);
  });

  it('should set and clear error', () => {
    const { result } = renderHook(() => useSearchState());

    act(() => {
      result.current.setError('Test error');
    });

    expect(result.current.searchState.error).toBe('Test error');
    expect(result.current.searchState.loading).toBe(false);

    act(() => {
      result.current.clearError();
    });

    expect(result.current.searchState.error).toBeNull();
  });

  it('should reset search state', () => {
    const { result } = renderHook(() => useSearchState());

    // 状態を変更
    act(() => {
      result.current.setMode('station');
      result.current.setMood('test mood');
      result.current.setError('test error');
    });

    // リセット
    act(() => {
      result.current.resetSearch();
    });

    expect(result.current.searchState.mode).toBe('radius');
    expect(result.current.searchState.mood).toBe('');
    expect(result.current.searchState.error).toBeNull();
  });
});

describe('validateSearchParams', () => {
  const mockLocation = {
    latitude: 35.6812,
    longitude: 139.7671,
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  };

  it('should return null for valid params', () => {
    const validState = {
      mode: 'radius' as const,
      mood: '疲れた時に食べたい',
      radius: 1000,
      stationCount: 2,
      location: mockLocation,
      results: [],
      loading: false,
      error: null,
    };

    expect(validateSearchParams(validState)).toBeNull();
  });

  it('should return error for empty mood', () => {
    const invalidState = {
      mode: 'radius' as const,
      mood: '',
      radius: 1000,
      stationCount: 2,
      location: mockLocation,
      results: [],
      loading: false,
      error: null,
    };

    expect(validateSearchParams(invalidState)).toBe('気分を入力してください');
  });

  it('should return error for missing location', () => {
    const invalidState = {
      mode: 'radius' as const,
      mood: '疲れた時に食べたい',
      radius: 1000,
      stationCount: 2,
      location: null,
      results: [],
      loading: false,
      error: null,
    };

    expect(validateSearchParams(invalidState)).toBe('位置情報を取得してください');
  });

  it('should return error for invalid radius', () => {
    const invalidState = {
      mode: 'radius' as const,
      mood: '疲れた時に食べたい',
      radius: 100,
      stationCount: 2,
      location: mockLocation,
      results: [],
      loading: false,
      error: null,
    };

    expect(validateSearchParams(invalidState)).toContain('半径は');
  });

  it('should return error for invalid station count', () => {
    const invalidState = {
      mode: 'station' as const,
      mood: '疲れた時に食べたい',
      radius: 1000,
      stationCount: 10,
      location: mockLocation,
      results: [],
      loading: false,
      error: null,
    };

    expect(validateSearchParams(invalidState)).toContain('駅数は');
  });
});