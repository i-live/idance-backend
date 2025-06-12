// jest.preset.js
const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  testMatch: ['**/+(*.)+(spec|test).+(ts|js|mjs)'],
  transform: {
    '^.+\\.(ts|mjs|js)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.base.json' }]
  },
  resolver: '@nx/jest/plugins/resolver',
  maxWorkers: 2,
  workerIdleMemoryLimit: '512MB'
};