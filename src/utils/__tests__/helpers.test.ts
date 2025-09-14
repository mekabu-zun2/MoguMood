// ヘルパー関数のユニットテスト

import {
  calculateDistance,
  formatDistance,
  formatRating,
  formatPriceLevel,
  generateGoogleMapsUrl,
  debounce,
  validation,
} from "../helpers";
import type { RestaurantResult } from "../../types";

describe("helpers", () => {
  describe("calculateDistance", () => {
    it("should calculate distance between two points correctly", () => {
      // 東京駅と新宿駅の距離（約7.5km）
      const tokyoLat = 35.6812;
      const tokyoLng = 139.7671;
      const shinjukuLat = 35.6896;
      const shinjukuLng = 139.7006;

      const distance = calculateDistance(
        tokyoLat,
        tokyoLng,
        shinjukuLat,
        shinjukuLng
      );

      // 実際の距離は約7.5kmなので、7000-8000mの範囲内であることを確認
      expect(distance).toBeGreaterThan(7000);
      expect(distance).toBeLessThan(8000);
    });

    it("should return 0 for same coordinates", () => {
      const distance = calculateDistance(35.6812, 139.7671, 35.6812, 139.7671);
      expect(distance).toBe(0);
    });
  });

  describe("formatDistance", () => {
    it("should format distance in meters for values less than 1000", () => {
      expect(formatDistance(500)).toBe("500m");
      expect(formatDistance(999)).toBe("999m");
    });

    it("should format distance in kilometers for values 1000 or more", () => {
      expect(formatDistance(1000)).toBe("1.0km");
      expect(formatDistance(1500)).toBe("1.5km");
      expect(formatDistance(2000)).toBe("2.0km");
    });
  });

  describe("formatRating", () => {
    it("should format rating with stars", () => {
      expect(formatRating(4.5)).toBe("★★★★☆");
      expect(formatRating(5.0)).toBe("★★★★★");
      expect(formatRating(3.2)).toBe("★★★☆☆");
      expect(formatRating(0)).toBe("☆☆☆☆☆");
    });
  });

  describe("formatPriceLevel", () => {
    it("should format price level with yen symbols", () => {
      expect(formatPriceLevel(1)).toBe("¥");
      expect(formatPriceLevel(2)).toBe("¥¥");
      expect(formatPriceLevel(3)).toBe("¥¥¥");
      expect(formatPriceLevel(4)).toBe("¥¥¥¥");
    });

    it("should return message for price level 0", () => {
      expect(formatPriceLevel(0)).toBe("価格情報なし");
    });
  });

  describe("generateGoogleMapsUrl", () => {
    it("should generate correct Google Maps URL", () => {
      const restaurant: RestaurantResult = {
        placeId: "ChIJ123",
        name: "テストレストラン",
        rating: 4.5,
        priceLevel: 2,
        types: ["restaurant"],
        vicinity: "テスト住所",
        photos: [],
        googleMapsUrl: "",
      };

      const url = generateGoogleMapsUrl(restaurant);

      expect(url).toContain("https://www.google.com/maps/search/");
      expect(url).toContain("api=1");
      expect(url).toContain("query=テストレストラン");
      expect(url).toContain("query_place_id=ChIJ123");
    });
  });

  describe("debounce", () => {
    jest.useFakeTimers();

    it("should debounce function calls", () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn("arg1");
      debouncedFn("arg2");
      debouncedFn("arg3");

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith("arg3");
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });

  describe("validation", () => {
    describe("mood", () => {
      it("should validate mood input correctly", () => {
        expect(validation.mood("疲れた時に食べたい")).toBe(true);
        expect(validation.mood("")).toBe(false);
        expect(validation.mood("   ")).toBe(false);
        expect(validation.mood("a".repeat(101))).toBe(false);
        expect(validation.mood("a".repeat(100))).toBe(true);
      });
    });

    describe("location", () => {
      it("should validate location coordinates correctly", () => {
        expect(validation.location(35.6812, 139.7671)).toBe(true);
        expect(validation.location(0, 0)).toBe(true);
        expect(validation.location(90, 180)).toBe(true);
        expect(validation.location(-90, -180)).toBe(true);
        expect(validation.location(91, 0)).toBe(false);
        expect(validation.location(0, 181)).toBe(false);
      });
    });

    describe("radius", () => {
      it("should validate radius correctly", () => {
        expect(validation.radius(500)).toBe(true);
        expect(validation.radius(1000)).toBe(true);
        expect(validation.radius(5000)).toBe(true);
        expect(validation.radius(499)).toBe(false);
        expect(validation.radius(5001)).toBe(false);
      });
    });

    describe("stationCount", () => {
      it("should validate station count correctly", () => {
        expect(validation.stationCount(1)).toBe(true);
        expect(validation.stationCount(3)).toBe(true);
        expect(validation.stationCount(5)).toBe(true);
        expect(validation.stationCount(0)).toBe(false);
        expect(validation.stationCount(6)).toBe(false);
        expect(validation.stationCount(1.5)).toBe(false);
      });
    });
  });
});
