// eslint-disable-next-line
const { defaults } = require('jest-config')

module.exports = {
  ...defaults,
  rootDir: process.cwd(),
  modulePathIgnorePatterns: ['<rootDir>/.history'],
  moduleDirectories: [
    // 对于 React ReactDOM
    'dist/node_modules',
    // 对于第三方依赖
    ...defaults.moduleDirectories,
  ],
  moduleNameMapper: {
    '^@xuans-mini-react/react-dom$': 'react-dom',
    '^@xuans-mini-react/react$': 'react',
    '^@xuans-mini-react/react-noop-renderer$': 'react-noop-renderer',
    '^scheduler$': '<rootDir>/node_modules/scheduler/unstable_mock.js',
  },
  fakeTimers: {
    enableGlobaly: true,
    legacyFakeTimers: true,
  },
  setupFilesAfterEnv: ['./scripts/jest/setupJest.js'],
  testEnvironment: 'jsdom',
}
