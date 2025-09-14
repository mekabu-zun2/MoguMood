// ResultCard コンポーネントのテスト

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultCard } from '../ResultCard';
import type { RestaurantResult } from '../../types';

// window.open をモック
const mockWindowOpen = jest.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
});

describe('ResultCard', () => {
  const mockRestaurant: RestaurantResult = {
    placeId: 'ChIJ123',
    name: 'テストレストラン',
    rating: 4.5,
    priceLevel: 2,
    types: ['restaurant', 'food'],
    vicinity: 'テスト住所123',
    photos: ['https://example.com/photo1.jpg'],
    distance: 500,
    googleMapsUrl: 'https://maps.google.com/test',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render restaurant information correctly', () => {
    render(<ResultCard restaurant={mockRestaurant} />);
    
    expect(screen.getByText('テストレストラン')).toBeInTheDocument();
    expect(screen.getByText('テスト住所123')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('¥¥')).toBeInTheDocument();
    expect(screen.getByText('500m')).toBeInTheDocument();
  });

  it('should display restaurant image', () => {
    render(<ResultCard restaurant={mockRestaurant} />);
    
    const image = screen.getByAltText('テストレストランの写真');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/photo1.jpg');
  });

  it('should show fallback when no image is available', () => {
    const restaurantWithoutPhoto = {
      ...mockRestaurant,
      photos: [],
    };
    
    render(<ResultCard restaurant={restaurantWithoutPhoto} />);
    
    expect(screen.queryByAltText('テストレストランの写真')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // SVG fallback
  });

  it('should call onClick when card is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClick = jest.fn();
    
    render(<ResultCard restaurant={mockRestaurant} onClick={mockOnClick} />);
    
    const card = screen.getByRole('button', { name: /テストレストランの詳細を表示/ });
    await user.click(card);
    
    expect(mockOnClick).toHaveBeenCalledWith(mockRestaurant);
  });

  it('should open Google Maps when maps button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<ResultCard restaurant={mockRestaurant} />);
    
    const mapsButton = screen.getByRole('button', { name: /Googleマップで開く/ });
    await user.click(mapsButton);
    
    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://maps.google.com/test',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('should not propagate click event when maps button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClick = jest.fn();
    
    render(<ResultCard restaurant={mockRestaurant} onClick={mockOnClick} />);
    
    const mapsButton = screen.getByRole('button', { name: /Googleマップで開く/ });
    await user.click(mapsButton);
    
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should show distance when showDistance is true', () => {
    render(<ResultCard restaurant={mockRestaurant} showDistance={true} />);
    
    expect(screen.getByText('500m')).toBeInTheDocument();
  });

  it('should not show distance when showDistance is false', () => {
    render(<ResultCard restaurant={mockRestaurant} showDistance={false} />);
    
    expect(screen.queryByText('500m')).not.toBeInTheDocument();
  });

  it('should show nearest station when showStation is true', () => {
    const restaurantWithStation = {
      ...mockRestaurant,
      nearestStation: '新宿駅',
    };
    
    render(<ResultCard restaurant={restaurantWithStation} showStation={true} />);
    
    expect(screen.getByText('新宿駅')).toBeInTheDocument();
  });

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup();
    const mockOnClick = jest.fn();
    
    render(<ResultCard restaurant={mockRestaurant} onClick={mockOnClick} />);
    
    const card = screen.getByRole('button', { name: /テストレストランの詳細を表示/ });
    
    // Enter キーでクリック
    card.focus();
    await user.keyboard('{Enter}');
    expect(mockOnClick).toHaveBeenCalledWith(mockRestaurant);
    
    mockOnClick.mockClear();
    
    // Space キーでクリック
    await user.keyboard(' ');
    expect(mockOnClick).toHaveBeenCalledWith(mockRestaurant);
  });

  it('should display restaurant types as tags', () => {
    render(<ResultCard restaurant={mockRestaurant} />);
    
    // types の変換された表示を確認
    expect(screen.getByText('レストラン')).toBeInTheDocument();
    expect(screen.getByText('飲食店')).toBeInTheDocument();
  });

  it('should show rating badge when rating is available', () => {
    render(<ResultCard restaurant={mockRestaurant} />);
    
    const ratingBadge = screen.getByText('4.5');
    expect(ratingBadge.closest('.result-card__rating-badge')).toBeInTheDocument();
  });

  it('should not show rating badge when rating is 0', () => {
    const restaurantWithoutRating = {
      ...mockRestaurant,
      rating: 0,
    };
    
    render(<ResultCard restaurant={restaurantWithoutRating} />);
    
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('should handle image loading states', () => {
    render(<ResultCard restaurant={mockRestaurant} />);
    
    const image = screen.getByAltText('テストレストランの写真');
    
    // 画像読み込み開始時はローディング状態
    expect(image).toHaveClass('result-card__image--loading');
    
    // 画像読み込み完了をシミュレート
    fireEvent.load(image);
    
    expect(image).not.toHaveClass('result-card__image--loading');
  });

  it('should handle image error', () => {
    render(<ResultCard restaurant={mockRestaurant} />);
    
    const image = screen.getByAltText('テストレストランの写真');
    
    // 画像エラーをシミュレート
    fireEvent.error(image);
    
    // フォールバック表示に切り替わることを確認
    expect(screen.queryByAltText('テストレストランの写真')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ResultCard restaurant={mockRestaurant} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});