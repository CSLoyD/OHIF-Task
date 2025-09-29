module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@ohif/core$': '<rootDir>/../../platform/core/src',
    '^@ohif/ui-next$': '<rootDir>/../../platform/ui-next/src',
    '^@ohif/extension-default$': '<rootDir>/../default/src',
    '^@ohif/extension-cornerstone$': '<rootDir>/../cornerstone/src',
    '^@cornerstonejs/core$': '<rootDir>/../../node_modules/@cornerstonejs/core/dist/esm',
    '^@cornerstonejs/(.*)$': '<rootDir>/../../node_modules/@cornerstonejs/$1/dist/esm',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.{js,ts}',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@ohif|@cornerstonejs)/)',
  ],
};
