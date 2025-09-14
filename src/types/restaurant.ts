// レストラン関連の型定義

export interface RestaurantResult {
  placeId: string;
  name: string;
  rating: number;
  priceLevel: number;
  types: string[];
  vicinity: string;
  photos: string[];
  distance?: number;
  nearestStation?: string;
  googleMapsUrl: string;
}

export interface PlacePhoto {
  photoReference: string;
  height: number;
  width: number;
  htmlAttributions: string[];
}

export interface PlaceGeometry {
  location: {
    lat: number;
    lng: number;
  };
  viewport?: {
    northeast: {
      lat: number;
      lng: number;
    };
    southwest: {
      lat: number;
      lng: number;
    };
  };
}

export interface GooglePlace {
  place_id: string;
  name: string;
  rating?: number;
  price_level?: number;
  types: string[];
  vicinity: string;
  photos?: PlacePhoto[];
  geometry: PlaceGeometry;
  opening_hours?: {
    open_now: boolean;
  };
}