/**
 * Test setup file for Dental Extension
 */

// Setup Jest DOM matchers first
import '@testing-library/jest-dom';

// Mock DOM environment
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
});

// Mock global functions and objects
global.crypto = {
  getRandomValues: (arr: any) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
} as any;

// Mock window.URL for blob creation in tests
global.URL = {
  createObjectURL: jest.fn(() => 'mock-url'),
  revokeObjectURL: jest.fn(),
} as any;

// Mock document methods
Object.defineProperty(document, 'createElement', {
  value: jest.fn((tagName: string) => {
    const element = {
      tagName: tagName.toUpperCase(),
      click: jest.fn(),
      href: '',
      download: '',
      style: {},
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(() => false),
      },
    };
    return element;
  }),
});

// Mock document.body
Object.defineProperty(document, 'body', {
  value: {
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(() => false),
    },
  },
  writable: true,
});

// Mock document.documentElement
Object.defineProperty(document, 'documentElement', {
  value: {
    style: {},
  },
  writable: true,
});

// Mock window object
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/dental',
    pathname: '/dental',
  },
  writable: true,
});

// Mock console methods to reduce noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
};
