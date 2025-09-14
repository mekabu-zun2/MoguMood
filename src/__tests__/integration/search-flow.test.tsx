// 検索フロー統合テスト

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../../__mocks__/server';
import { rest } from 'msw';
import Home from '../../app/page';

// 位置情報のモック
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

describe('Search Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 位置情報取得の成功をモック
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      setTimeout(() => {
        success({
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
        });
      }, 100);
    });
  });

  it('should complete full search flow successfully', async () => {
    const user = userEvent.setup();
    
    render(<Home />);

    // 初期状態の確認
    expect(screen.getByText('ご飯探索マップ')).toBeInTheDocument();
    expect(screen.getByText('気分を教えてください')).toBeInTheDocument();

    // 位置情報取得の完了を待つ
    await waitFor(() => {
      expect(screen.getByText('位置情報を取得しました')).toBeInTheDocument();
    });

    // 気分を入力
    const moodInput = screen.getByRole('textbox');
    await user.type(moodInput, '疲れた時に食べたい温かいもの');

    // 検索ボタンをクリック
    const searchButton = screen.getByRole('button', { name: /飲食店を検索/ });
    await user.click(searchButton);

    // ローディング状態の確認
    expect(screen.getByText('飲食店を検索中')).toBeInTheDocument();

    // 検索結果の表示を待つ
    await waitFor(() => {
      expect(screen.getByText('検索結果 (2件)')).toBeInTheDocument();
    });

    // 検索結果の確認
    expect(screen.getByText('テストラーメン店')).toBeInTheDocument();
    expect(screen.getByText('テストうどん店')).toBeInTheDocument();

    // Googleマップボタンの確認
    const mapButtons = screen.getAllByRole('button', { name: /Googleマップで開く/ });
    expect(mapButtons).toHaveLength(2);
  });

  it('should handle search error gracefully', async () => {
    const user = userEvent.setup();

    // エラーレスポンスを設定
    server.use(
      rest.post('/api/places', (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({
            error: 'サーバーエラーが発生しました',
            status: 'error',
          })
        );
      })
    );

    render(<Home />);

    // 位置情報取得の完了を待つ
    await waitFor(() => {
      expect(screen.getByText('位置情報を取得しました')).toBeInTheDocument();
    });

    // 気分を入力
    const moodInput = screen.getByRole('textbox');
    await user.type(moodInput, '疲れた時に食べたい');

    // 検索ボタンをクリック
    const searchButton = screen.getByRole('button', { name: /飲食店を検索/ });
    await user.click(searchButton);

    // エラーメッセージの表示を待つ
    await waitFor(() => {
      expect(screen.getByText('検索エラー')).toBeInTheDocument();
    });

    expect(screen.getByText('サーバーエラーが発生しました')).toBeInTheDocument();
  });

  it('should handle geolocation error', async () => {
    const user = userEvent.setup();

    // 位置情報エラーをモック
    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      setTimeout(() => {
        error({
          code: 1,
          message: 'User denied Geolocation',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
      }, 100);
    });

    render(<Home />);

    // エラーメッセージの表示を待つ
    await waitFor(() => {
      expect(screen.getByText('位置情報の取得が拒否されました。設定から位置情報を有効にしてください。')).toBeInTheDocument();
    });

    // 再試行ボタンの確認
    expect(screen.getByRole('button', { name: '再試行' })).toBeInTheDocument();
  });

  it('should switch between search modes', async () => {
    const user = userEvent.setup();
    
    render(<Home />);

    // 位置情報取得の完了を待つ
    await waitFor(() => {
      expect(screen.getByText('位置情報を取得しました')).toBeInTheDocument();
    });

    // 初期状態は半径モード
    expect(screen.getByText('半径モード')).toBeInTheDocument();
    expect(screen.getByText('検索範囲')).toBeInTheDocument();

    // 駅数モードに切り替え
    const stationModeButton = screen.getByRole('radio', { name: /駅数モード/ });
    await user.click(stationModeButton);

    // 駅数モードのUIが表示されることを確認
    expect(screen.getByText('駅数')).toBeInTheDocument();
    expect(screen.getByText('最寄り駅から2駅分')).toBeInTheDocument();
  });

  it('should validate form inputs', async () => {
    const user = userEvent.setup();
    
    render(<Home />);

    // 位置情報取得の完了を待つ
    await waitFor(() => {
      expect(screen.getByText('位置情報を取得しました')).toBeInTheDocument();
    });

    // 気分を入力せずに検索ボタンをクリック
    const searchButton = screen.getByRole('button', { name: /飲食店を検索/ });
    await user.click(searchButton);

    // バリデーションエラーの表示を待つ
    await waitFor(() => {
      expect(screen.getByText('気分を入力してください')).toBeInTheDocument();
    });
  });

  it('should show loading states correctly', async () => {
    const user = userEvent.setup();

    // 遅延レスポンスを設定
    server.use(
      rest.post('/api/mood', (req, res, ctx) => {
        return res(
          ctx.delay(1000),
          ctx.json({
            data: {
              originalMood: '疲れた時に食べたい',
              searchTags: ['ラーメン'],
              searchQuery: 'ラーメン',
            },
            status: 'success',
          })
        );
      })
    );

    render(<Home />);

    // 位置情報取得の完了を待つ
    await waitFor(() => {
      expect(screen.getByText('位置情報を取得しました')).toBeInTheDocument();
    });

    // 気分を入力
    const moodInput = screen.getByRole('textbox');
    await user.type(moodInput, '疲れた時に食べたい');

    // 検索ボタンをクリック
    const searchButton = screen.getByRole('button', { name: /飲食店を検索/ });
    await user.click(searchButton);

    // ローディング状態の確認
    expect(screen.getByText('検索中...')).toBeInTheDocument();
    expect(searchButton).toBeDisabled();

    // ローディング完了を待つ
    await waitFor(() => {
      expect(screen.queryByText('検索中...')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });
});