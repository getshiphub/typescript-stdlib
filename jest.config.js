module.exports = {
  moduleFileExtensions: ["ts", "js"],
  moduleNameMapper: {
    runtime$: "<rootDir>/src/_runtime/runtime_node.ts",
    stdio$: "<rootDir>/src/io/stdio_node.ts",
  },
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testMatch: ["**/test/node/**/*.test.(ts|js)"],
  testPathIgnorePatterns: ["/test/deno/"],
  testEnvironment: "node",
  collectCoverageFrom: ["src/**/*.(js|ts)"],
  coveragePathIgnorePatterns: ["<rootDir>/src/_runtime", ".*_deno\\.ts", ".*\\.d\\.ts"],
  setupFilesAfterEnv: ["<rootDir>/test/node/setup.ts"],
};
