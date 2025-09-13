module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'no-unreachable': 'warn'
  },
  env: {
    browser: true,
    es6: true,
    node: true
  }
};
