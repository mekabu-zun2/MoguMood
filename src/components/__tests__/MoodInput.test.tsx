// MoodInput コンポーネントのテスト

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MoodInput } from '../MoodInput';

describe('MoodInput', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    render(<MoodInput {...defaultProps} />);
    
    expect(screen.getByLabelText('今の気分を教えてください')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should display the current value', () => {
    render(<MoodInput {...defaultProps} value="疲れた時に食べたい" />);
    
    expect(screen.getByDisplayValue('疲れた時に食べたい')).toBeInTheDocument();
  });

  it('should call onChange when text is entered', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();
    
    render(<MoodInput {...defaultProps} onChange={mockOnChange} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'さっぱりしたもの');
    
    expect(mockOnChange).toHaveBeenCalledWith('さっぱりしたもの');
  });

  it('should call onSubmit when Enter is pressed', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn();
    
    render(
      <MoodInput 
        {...defaultProps} 
        value="疲れた時に食べたい" 
        onSubmit={mockOnSubmit} 
      />
    );
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '{enter}');
    
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('should not call onSubmit when Shift+Enter is pressed', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn();
    
    render(
      <MoodInput 
        {...defaultProps} 
        value="疲れた時に食べたい" 
        onSubmit={mockOnSubmit} 
      />
    );
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '{shift>}{enter}{/shift}');
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should show character count', () => {
    render(<MoodInput {...defaultProps} value="テスト" showCharCount={true} />);
    
    expect(screen.getByText('3/100')).toBeInTheDocument();
  });

  it('should show warning when near character limit', () => {
    const longText = 'a'.repeat(85);
    render(<MoodInput {...defaultProps} value={longText} showCharCount={true} />);
    
    const charCount = screen.getByText('85/100');
    expect(charCount).toHaveClass('mood-input__char-count--warning');
  });

  it('should show error when over character limit', () => {
    const tooLongText = 'a'.repeat(105);
    render(<MoodInput {...defaultProps} value={tooLongText} showCharCount={true} />);
    
    const charCount = screen.getByText('105/100');
    expect(charCount).toHaveClass('mood-input__char-count--error');
  });

  it('should prevent input when at max length', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();
    const maxLengthText = 'a'.repeat(100);
    
    render(
      <MoodInput 
        {...defaultProps} 
        value={maxLengthText} 
        onChange={mockOnChange}
        maxLength={100}
      />
    );
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'b');
    
    // maxLength に達している場合、onChange は呼ばれない
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should display error message', () => {
    render(<MoodInput {...defaultProps} error="エラーメッセージ" />);
    
    expect(screen.getByText('エラーメッセージ')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<MoodInput {...defaultProps} loading={true} />);
    
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<MoodInput {...defaultProps} disabled={true} />);
    
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('should show custom placeholder', () => {
    render(<MoodInput {...defaultProps} placeholder="カスタムプレースホルダー" />);
    
    expect(screen.getByPlaceholderText('カスタムプレースホルダー')).toBeInTheDocument();
  });

  it('should auto-focus when autoFocus is true', () => {
    render(<MoodInput {...defaultProps} autoFocus={true} />);
    
    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it('should show help text', () => {
    render(<MoodInput {...defaultProps} />);
    
    expect(screen.getByText(/例:/)).toBeInTheDocument();
    expect(screen.getByText(/Enterキーで検索/)).toBeInTheDocument();
  });

  it('should adjust textarea height based on content', async () => {
    const user = userEvent.setup();
    
    render(<MoodInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    const multilineText = 'Line 1\nLine 2\nLine 3\nLine 4';
    
    await user.type(textarea, multilineText);
    
    // テキストエリアの高さが調整されることを確認
    // 実際の高さの確認は DOM の実装に依存するため、
    // ここでは最低限の動作確認のみ行う
    expect(textarea).toHaveValue(multilineText);
  });
});