// const blitzPreset = require("ts-jest/presets/js-with-babel-esm")
// const { jsWithBabelESM } = require("ts-jest/presets");

// console.log(JSON.stringify(jsWithBabelESM));

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  extensionsToTreatAsEsm: [".jsx", ".ts", ".tsx", ".mts"],
  transform: {
    "^.+\\.m?[j]sx?$": "babel-jest",
    "^.+\\.tsx?$": ["ts-jest", { useESM: true }],
  },
  testEnvironment: "node",
  moduleNameMapper: {
    "~/(.*)": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["/node_modules/", "/cdk.out/"],
};
