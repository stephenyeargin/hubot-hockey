module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    mocha: true,
  },
  extends: 'airbnb-base',
  overrides: [
    {
      files: ['test/**/*.js'],
      env: {
        mocha: true,
      },
      rules: {
        'import/no-extraneous-dependencies': 'off',
        'no-unused-expressions': 'off',
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
  },
};
