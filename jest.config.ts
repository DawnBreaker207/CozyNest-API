module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleDirectories: ['node_modules', 'src'],
  verbose: true,
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]s$',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/src/__tests__/mocks/'],
};
