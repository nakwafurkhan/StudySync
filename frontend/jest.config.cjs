module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.{js,jsx}'],
  moduleNameMapper: {
    // Stub out CSS imports during tests.
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // framer-motion is ESM; map to a lightweight stub for Jest.
    '^framer-motion$': '<rootDir>/tests/__mocks__/framer-motion.js',
  },
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      {
        babelrc: false,
        configFile: false,
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          ['@babel/preset-react', { runtime: 'automatic' }],
        ],
      },
    ],
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    // axios config glue; reads import.meta.env (Vite-only) and is mocked in tests.
    '!src/services/api.js',
  ],
  coverageThreshold: {
    global: { branches: 50, functions: 70, lines: 75, statements: 75 },
  },
};
