module.exports = {
  moduleFileExtensions: ["ts", "js"],
  moduleNameMapper: {
    runtime$: "<rootDir>/src/_runtime/runtime_node.ts",
  },
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testMatch: ["**/test/node/**/*.test.(ts|js)"],
  testPathIgnorePatterns: ["/test/deno/"],
  testEnvironment: "node",
  collectCoverageFrom: ["src/**/*.(js|ts)"],
  coveragePathIgnorePatterns: ["<rootDir>/src/_runtime"],
  setupFilesAfterEnv: ["<rootDir>/test/node/setup.ts"],
};
