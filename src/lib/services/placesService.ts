// Google Places API サービス

import type { 
  RestaurantResult, 
  GooglePlace, 
  PlacesSearchRequest, 
  PlacesSearchResponse,
  ApiError 
} from '../../types';
import { 
  handleFetchError, 
  handleHttpError, 
  handlePlacesApiError,
  withRetry,
  calculateDistance,
  generateGoogleMapsUrl
} from '../../utils';
import { PLACES_API } from '../../utils/constants';

/**
 * Google Places API クライアント
 */
class PlacesService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/place';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 周辺の飲食店を検索
   */
  async searchNearbyRestaurants(request: PlacesSearchRequest): Promise<PlacesSearchResponse> {
    try {
      return await withRetry(async () => {
        const url = this.buildNearbySearchUrl(request);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw handleHttpError(response);
        }

        const data = await response.json();
        
        // Google Places APIのステータスチェック
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
          throw handlePlacesApiError(data.status);
        }

        const results = await this.processSearchResults(data.results || [], request.location);
        
        return {
          results,
          status: data.status,
          nextPageToken: data.next_page_token,
        };
      }, 3, 1000);
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error as ApiError;
      }
      throw handleFetchError(error);
    }
  }

  /**
   * Place IDから詳細情報を取得
   */
  async getPlaceDetails(placeId: string): Promise<GooglePlace> {
    try {
      return await withRetry(async () => {
        const url = this.buildPlaceDetailsUrl(placeId);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw handleHttpError(response);
        }

        const data = await response.json();
        
        if (data.status !== 'OK') {
          throw handlePlacesApiError(data.status);
        }

        return data.result;
      }, 3, 1000);
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error as ApiError;
      }
      throw handleFetchError(error);
    }
  }

  /**
   * 写真URLを取得
   */
  getPhotoUrl(photoReference: string, maxWidth: number = PLACES_API.PHOTO_MAX_WIDTH): string {
    const params = new URLSearchParams({
      photoreference: photoReference,
      maxwidth: maxWidth.toString(),
      key: this.apiKey,
    });

    return `${this.baseUrl}/photo?${params.toString()}`;
  }

  /**
   * Nearby Search APIのURLを構築
   */
  private buildNearbySearchUrl(request: PlacesSearchRequest): string {
    const params = new URLSearchParams({
      location: `${request.location.lat},${request.location.lng}`,
      radius: (request.radius || 1000).toString(),
      type: request.type || PLACES_API.TYPES.RESTAURANT,
      keyword: request.query,
      key: this.apiKey,
    });

    return `${this.baseUrl}/nearbysearch/json?${params.toString()}`;
  }

  /**
   * Place Details APIのURLを構築
   */
  private buildPlaceDetailsUrl(placeId: string): string {
    const fields = [
      'place_id',
      'name',
      'rating',
      'price_level',
      'types',
      'vicinity',
      'photos',
      'geometry',
      'opening_hours',
    ].join(',');

    const params = new URLSearchParams({
      place_id: placeId,
      fields,
      key: this.apiKey,
    });

    return `${this.baseUrl}/details/json?${params.toString()}`;
  }

  /**
   * 検索結果を処理してRestaurantResult形式に変換
   */
  private async processSearchResults(
    places: GooglePlace[], 
    userLocation: { lat: number; lng: number }
  ): Promise<RestaurantResult[]> {
    const results: RestaurantResult[] = [];

    for (const place of places.slice(0, PLACES_API.MAX_RESULTS)) {
      try {
        const result = await this.convertToRestaurantResult(place, userLocation);
        results.push(result);
      } catch (error) {
        // 個別の変換エラーはログに記録するが、全体の処理は継続
        console.warn('Failed to convert place to restaurant result:', error);
      }
    }

    // 距離でソート
    return results.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  /**
   * GooglePlaceをRestaurantResultに変換
   */
  private async convertToRestaurantResult(
    place: GooglePlace, 
    userLocation: { lat: number; lng: number }
  ): Promise<RestaurantResult> {
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      place.geometry.location.lat,
      place.geometry.location.lng
    );

    // 写真URLを生成
    const photos = place.photos?.slice(0, 3).map(photo => 
      this.getPhotoUrl(photo.photoReference)
    ) || [];

    const result: RestaurantResult = {
      placeId: place.place_id,
      name: place.name,
      rating: place.rating || 0,
      priceLevel: place.price_level || 0,
      types: place.types,
      vicinity: place.vicinity,
      photos,
      distance,
      googleMapsUrl: '', // 後で設定
    };

    // Google Maps URLを生成
    result.googleMapsUrl = generateGoogleMapsUrl(result);

    return result;
  }

  /**
   * テキスト検索を実行
   */
  async searchByText(query: string, location: { lat: number; lng: number }, radius: number = 1000): Promise<PlacesSearchResponse> {
    try {
      return await withRetry(async () => {
        const url = this.buildTextSearchUrl(query, location, radius);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw handleHttpError(response);
        }

        const data = await response.json();
        
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
          throw handlePlacesApiError(data.status);
        }

        const results = await this.processSearchResults(data.results || [], location);
        
        return {
          results,
          status: data.status,
          nextPageToken: data.next_page_token,
        };
      }, 3, 1000);
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error as ApiError;
      }
      throw handleFetchError(error);
    }
  }

  /**
   * Text Search APIのURLを構築
   */
  private buildTextSearchUrl(query: string, location: { lat: number; lng: number }, radius: number): string {
    const params = new URLSearchParams({
      query: `${query} restaurant`,
      location: `${location.lat},${location.lng}`,
      radius: radius.toString(),
      type: PLACES_API.TYPES.RESTAURANT,
      key: this.apiKey,
    });

    return `${this.baseUrl}/textsearch/json?${params.toString()}`;
  }

  /**
   * 駅周辺の飲食店を検索
   */
  async searchRestaurantsNearStation(
    stationLocation: { lat: number; lng: number },
    query: string,
    radius: number = 500
  ): Promise<RestaurantResult[]> {
    const searchRequest: PlacesSearchRequest = {
      location: stationLocation,
      radius,
      query,
      type: PLACES_API.TYPES.RESTAURANT,
    };

    const response = await this.searchNearbyRestaurants(searchRequest);
    return response.results;
  }
}

// シングルトンインスタンス
let placesServiceInstance: PlacesService | null = null;

/**
 * Places サービスのインスタンスを取得
 */
export function getPlacesService(): PlacesService {
  if (!placesServiceInstance) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY environment variable is not set');
    }
    placesServiceInstance = new PlacesService(apiKey);
  }
  return placesServiceInstance;
}

/**
 * 周辺の飲食店を検索（エクスポート用の便利関数）
 */
export async function searchNearbyRestaurants(request: PlacesSearchRequest): Promise<PlacesSearchResponse> {
  const service = getPlacesService();
  return service.searchNearbyRestaurants(request);
}

/**
 * テキストで飲食店を検索（エクスポート用の便利関数）
 */
export async function searchRestaurantsByText(
  query: string, 
  location: { lat: number; lng: number }, 
  radius?: number
): Promise<PlacesSearchResponse> {
  const service = getPlacesService();
  return service.searchByText(query, location, radius);
}

/**
 * 駅周辺の飲食店を検索（エクスポート用の便利関数）
 */
export async function searchRestaurantsNearStation(
  stationLocation: { lat: number; lng: number },
  query: string,
  radius?: number
): Promise<RestaurantResult[]> {
  const service = getPlacesService();
  return service.searchRestaurantsNearStation(stationLocation, query, radius);
}