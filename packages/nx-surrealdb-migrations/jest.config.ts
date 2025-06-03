/* eslint-disable */
export default {
  displayName: 'nx-surrealdb-migrations',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      useESM: true
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/packages/nx-surrealdb-migrations',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/files/**',
    '!jest.config.ts',
  ],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testEnvironmentOptions: {
    node: {
      experimentalVMModules: true
    }
  }
};