import '@testing-library/jest-dom'
import { server } from './src/__mocks__/server'

// テスト環境用の環境変数を設定
process.env.NODE_ENV = 'test'
process.env.GOOGLE_PLACES_API_KEY = 'test_key'
process.env.GOOGLE_DIRECTIONS_API_KEY = 'test_key'
process.env.GEMINI_API_KEY = 'test_key'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

// MSW サーバーの設定
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
}

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
})

// Mock fetch
global.fetch = jest.fn()

// Mock window.open
global.open = jest.fn()