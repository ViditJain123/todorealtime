module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'script', // Allow CommonJS for this file
  },
  rules: {
    // Allow console.log in socket server
    'no-console': 'off',
  },
};
