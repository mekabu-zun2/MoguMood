'use client';

import { useState } from 'react';
import { SearchForm, ResultList, ErrorMessage, Loader } from '../components';
import { usePlacesSearch } from '../hooks';
import type { RestaurantResult, SearchMode } from '../types';

export default function Home() {
  const [searchResults, setSearchResults] = useState<RestaurantResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const {
    results,
    loading: placesLoading,
    error: placesError,
    searchRestaurants,
    clearResults,
    clearError,
  } = usePlacesSearch();

  // 検索実行
  const handleSearch = async (searchParams: {
    mode: SearchMode;
    mood: string;
    location: { lat: number; lng: number };
    radius?: number;
    stationCount?: number;
    searchQuery: string;
  }) => {
    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);
    clearResults();
    clearError();

    try {
      const searchRequest = {
        mode: searchParams.mode,
        location: searchParams.location,
        query: searchParams.searchQuery,
        radius: searchParams.radius,
        stationCount: searchParams.stationCount,
      };

      const results = await searchRestaurants(searchRequest);
      setSearchResults(results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '検索に失敗しました';
      setSearchError(errorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  // 検索結果クリック
  const handleResultClick = (restaurant: RestaurantResult) => {
    // 将来的に詳細モーダルなどを表示する場合はここに実装
    console.log('Restaurant clicked:', restaurant);
  };

  const currentError = searchError || placesError;
  const currentResults = results.length > 0 ? results : searchResults;
  const showResults = hasSearched && !isSearching && !currentError;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ご飯探索マップ
            </h1>
            <p className="text-gray-600">
              気分に合わせて周辺の飲食店を見つけよう
            </p>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* 検索フォーム */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <SearchForm
              onSearch={handleSearch}
              loading={isSearching || placesLoading}
            />
          </div>

          {/* エラー表示 */}
          {currentError && (
            <div className="mb-8">
              <ErrorMessage
                error={currentError}
                variant="card"
                showRetry={true}
                onRetry={() => {
                  setSearchError(null);
                  clearError();
                }}
              />
            </div>
          )}

          {/* ローディング表示 */}
          {(isSearching || placesLoading) && (
            <div className="mb-8">
              <Loader
                size="lg"
                text="飲食店を検索中"
                className="py-12"
              />
            </div>
          )}

          {/* 検索結果 */}
          {showResults && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <ResultList
                results={currentResults}
                loading={isSearching || placesLoading}
                error={currentError}
                onResultClick={handleResultClick}
                showDistance={true}
                showStation={false} // 将来的に駅数モードの場合はtrueに
                emptyMessage="条件に合う飲食店が見つかりませんでした。気分の表現を変えるか、検索範囲を広げてみてください。"
              />
            </div>
          )}

          {/* 初期状態のメッセージ */}
          {!hasSearched && !isSearching && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zM3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  気分を教えてください
                </h3>
                <p className="text-gray-500">
                  「疲れた時に食べたい温かいもの」「さっぱりしたものが食べたい」など、
                  今の気分を自由に入力してください。AIが最適な飲食店を見つけます。
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center text-sm text-gray-500">
            <p>
              © 2024 ご飯探索マップ. 
              Powered by Google Places API & Gemini AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}