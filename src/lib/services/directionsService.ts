// Google Directions API サービス

import type { 
  StationInfo, 
  StationSearchRequest, 
  StationSearchResponse,
  ApiError 
} from '../../types';
import { 
  handleFetchError, 
  handleHttpError, 
  handlePlacesApiError,
  withRetry,
  calculateDistance
} from '../../utils';
import { PLACES_API } from '../../utils/constants';

/**
 * Google Directions API クライアント
 */
class DirectionsService {
  private readonly apiKey: string;
  private readonly placesBaseUrl = 'https://maps.googleapis.com/maps/api/place';
  private readonly directionsBaseUrl = 'https://maps.googleapis.com/maps/api/directions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 最寄り駅を検索し、指定駅数分の駅リストを取得
   */
  async searchStationsInRange(request: StationSearchRequest): Promise<StationSearchResponse> {
    // テストキーの場合はモックデータを返す
    if (this.apiKey === 'test_key' || !this.apiKey || this.apiKey.length < 10) {
      console.log('Using mock data for Directions API');
      return this.getMockStationResponse(request);
    }

    try {
      return await withRetry(async () => {
        // 1. 最寄り駅を検索
        const nearestStation = await this.findNearestStation(request.location);
        
        // 2. 指定駅数分の駅を取得
        const stationsInRange = await this.getStationsInRange(
          nearestStation, 
          request.stationCount
        );

        return {
          nearestStation,
          stationsInRange,
          status: 'OK',
        };
      }, 3, 1000);
    } catch (error) {
      console.error('DirectionsService error:', error);
      if (error instanceof Error && 'code' in error) {
        throw error as ApiError;
      }
      // エラーオブジェクトを適切にシリアライズ
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw handleFetchError(new Error(errorMessage));
    }
  }

  /**
   * 最寄り駅を検索
   */
  private async findNearestStation(location: { lat: number; lng: number }): Promise<StationInfo> {
    const url = this.buildNearbyStationSearchUrl(location);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw handleHttpError(response);
    }

    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw handlePlacesApiError(data.status);
    }

    if (!data.results || data.results.length === 0) {
      throw {
        code: 'INVALID_REQUEST',
        message: '近くに駅が見つかりませんでした',
        details: { location },
      } as ApiError;
    }

    // 最も近い駅を選択
    const nearestPlace = data.results[0];
    const distance = calculateDistance(
      location.lat,
      location.lng,
      nearestPlace.geometry.location.lat,
      nearestPlace.geometry.location.lng
    );

    return {
      placeId: nearestPlace.place_id,
      name: nearestPlace.name,
      location: {
        lat: nearestPlace.geometry.location.lat,
        lng: nearestPlace.geometry.location.lng,
      },
      distance,
    };
  }

  /**
   * 指定駅数分の駅リストを取得
   */
  private async getStationsInRange(
    startStation: StationInfo, 
    stationCount: number
  ): Promise<StationInfo[]> {
    const stations: StationInfo[] = [startStation];
    
    try {
      // 各方向（上り・下り）で駅を検索
      const directions = await this.getDirectionsFromStation(startStation, stationCount);
      
      for (const direction of directions) {
        const stationsInDirection = await this.extractStationsFromRoute(direction, stationCount);
        stations.push(...stationsInDirection);
      }

      // 重複を除去し、距離でソート
      const uniqueStations = this.removeDuplicateStations(stations);
      return uniqueStations.slice(0, stationCount + 1); // 最寄り駅 + 指定駅数
    } catch (error) {
      // Directions APIが失敗した場合は、Places APIで周辺の駅を検索
      return this.fallbackStationSearch(startStation, stationCount);
    }
  }

  /**
   * 駅からの経路情報を取得
   */
  private async getDirectionsFromStation(
    station: StationInfo, 
    stationCount: number
  ): Promise<any[]> {
    // 駅から各方向への仮想的な目的地を設定
    const destinations = this.generateDestinationsAroundStation(station.location, stationCount);
    const directions: any[] = [];

    for (const destination of destinations) {
      try {
        const url = this.buildDirectionsUrl(station.location, destination, 'transit');
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'OK' && data.routes.length > 0) {
            directions.push(data.routes[0]);
          }
        }
      } catch (error) {
        // 個別の方向検索エラーは無視して続行
        console.warn('Direction search failed:', error);
      }
    }

    return directions;
  }

  /**
   * 駅周辺の仮想目的地を生成
   */
  private generateDestinationsAroundStation(
    stationLocation: { lat: number; lng: number }, 
    stationCount: number
  ): Array<{ lat: number; lng: number }> {
    const radius = stationCount * 2000; // 駅数 × 2km の範囲
    const destinations: Array<{ lat: number; lng: number }> = [];
    
    // 4方向に仮想的な目的地を設定
    const directions = [
      { lat: 1, lng: 0 },   // 北
      { lat: 0, lng: 1 },   // 東
      { lat: -1, lng: 0 },  // 南
      { lat: 0, lng: -1 },  // 西
    ];

    for (const dir of directions) {
      const lat = stationLocation.lat + (dir.lat * radius / 111000); // 緯度1度 ≈ 111km
      const lng = stationLocation.lng + (dir.lng * radius / (111000 * Math.cos(stationLocation.lat * Math.PI / 180)));
      
      destinations.push({ lat, lng });
    }

    return destinations;
  }

  /**
   * ルートから駅情報を抽出
   */
  private async extractStationsFromRoute(route: any, maxStations: number): Promise<StationInfo[]> {
    const stations: StationInfo[] = [];
    
    try {
      // ルートの各ステップから駅情報を抽出
      for (const leg of route.legs) {
        for (const step of leg.steps) {
          if (step.travel_mode === 'TRANSIT' && step.transit_details) {
            const departureStop = step.transit_details.departure_stop;
            const arrivalStop = step.transit_details.arrival_stop;
            
            // 出発駅
            if (departureStop && stations.length < maxStations) {
              const stationInfo = await this.createStationInfoFromTransitStop(departureStop);
              if (stationInfo) {
                stations.push(stationInfo);
              }
            }
            
            // 到着駅
            if (arrivalStop && stations.length < maxStations) {
              const stationInfo = await this.createStationInfoFromTransitStop(arrivalStop);
              if (stationInfo) {
                stations.push(stationInfo);
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to extract stations from route:', error);
    }

    return stations;
  }

  /**
   * Transit stopからStationInfoを作成
   */
  private async createStationInfoFromTransitStop(transitStop: any): Promise<StationInfo | null> {
    try {
      return {
        placeId: transitStop.place_id || '',
        name: transitStop.name,
        location: {
          lat: transitStop.location.lat,
          lng: transitStop.location.lng,
        },
        distance: 0, // 後で計算
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * フォールバック: Places APIで周辺の駅を検索
   */
  private async fallbackStationSearch(
    centerStation: StationInfo, 
    stationCount: number
  ): Promise<StationInfo[]> {
    const radius = stationCount * 2000; // 駅数 × 2km
    const url = this.buildNearbyStationSearchUrl(centerStation.location, radius);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return [centerStation]; // 最寄り駅のみ返す
    }

    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results) {
      return [centerStation];
    }

    const stations: StationInfo[] = [centerStation];
    
    for (const place of data.results.slice(0, stationCount)) {
      if (place.place_id !== centerStation.placeId) {
        const distance = calculateDistance(
          centerStation.location.lat,
          centerStation.location.lng,
          place.geometry.location.lat,
          place.geometry.location.lng
        );

        stations.push({
          placeId: place.place_id,
          name: place.name,
          location: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
          },
          distance,
        });
      }
    }

    return stations.slice(0, stationCount + 1);
  }

  /**
   * 重複する駅を除去
   */
  private removeDuplicateStations(stations: StationInfo[]): StationInfo[] {
    const seen = new Set<string>();
    const unique: StationInfo[] = [];

    for (const station of stations) {
      const key = station.placeId || `${station.name}_${station.location.lat}_${station.location.lng}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(station);
      }
    }

    return unique.sort((a, b) => a.distance - b.distance);
  }

  /**
   * モックデータを生成（テスト・開発用）
   */
  private getMockStationResponse(request: StationSearchRequest): StationSearchResponse {
    const mockNearestStation: StationInfo = {
      placeId: 'mock_station_1',
      name: '渋谷駅',
      location: {
        lat: request.location.lat + 0.001,
        lng: request.location.lng + 0.001,
      },
      distance: 200,
    };

    const mockStations: StationInfo[] = [
      mockNearestStation,
      {
        placeId: 'mock_station_2',
        name: '新宿駅',
        location: {
          lat: request.location.lat + 0.01,
          lng: request.location.lng - 0.005,
        },
        distance: 1500,
      },
      {
        placeId: 'mock_station_3',
        name: '原宿駅',
        location: {
          lat: request.location.lat - 0.005,
          lng: request.location.lng + 0.008,
        },
        distance: 800,
      },
    ];

    return {
      nearestStation: mockNearestStation,
      stationsInRange: mockStations.slice(0, request.stationCount + 1),
      status: 'OK',
    };
  }

  /**
   * 駅検索用のURLを構築
   */
  private buildNearbyStationSearchUrl(
    location: { lat: number; lng: number }, 
    radius: number = 2000
  ): string {
    const params = new URLSearchParams({
      location: `${location.lat},${location.lng}`,
      radius: radius.toString(),
      type: PLACES_API.TYPES.TRAIN_STATION,
      key: this.apiKey,
    });

    return `${this.placesBaseUrl}/nearbysearch/json?${params.toString()}`;
  }

  /**
   * Directions APIのURLを構築
   */
  private buildDirectionsUrl(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    mode: string = 'transit'
  ): string {
    const params = new URLSearchParams({
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      mode,
      key: this.apiKey,
    });

    return `${this.directionsBaseUrl}/json?${params.toString()}`;
  }
}

// シングルトンインスタンス
let directionsServiceInstance: DirectionsService | null = null;

/**
 * Directions サービスのインスタンスを取得
 */
export function getDirectionsService(): DirectionsService {
  if (!directionsServiceInstance) {
    const apiKey = process.env.GOOGLE_DIRECTIONS_API_KEY || 'test_key';
    console.log('DirectionsService API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined');
    console.log('DirectionsService Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      hasApiKey: !!process.env.GOOGLE_DIRECTIONS_API_KEY,
      apiKeyLength: process.env.GOOGLE_DIRECTIONS_API_KEY?.length || 0,
    });
    directionsServiceInstance = new DirectionsService(apiKey);
  }
  return directionsServiceInstance;
}

/**
 * 駅検索（エクスポート用の便利関数）
 */
export async function searchStationsInRange(request: StationSearchRequest): Promise<StationSearchResponse> {
  const service = getDirectionsService();
  return service.searchStationsInRange(request);
}

/**
 * 最寄り駅を検索（エクスポート用の便利関数）
 */
export async function findNearestStation(location: { lat: number; lng: number }): Promise<StationInfo> {
  const service = getDirectionsService();
  const response = await service.searchStationsInRange({ location, stationCount: 1 });
  return response.nearestStation;
}