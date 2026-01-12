export default {
  testEnvironment: 'node',
  transform: {},
  moduleFileExtensions: ['js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/database.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true
};
