module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    semi: 0,
    'no-console': 0,
    'no-underscore-dangle': ['error', { allow: ['_id', '__v'] }],
  },
};
