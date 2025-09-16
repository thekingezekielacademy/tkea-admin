module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          safari: '>= 13'
        },
        useBuiltIns: 'entry',
        corejs: 3
      }
    ],
    '@babel/preset-react',
    '@babel/preset-typescript'
  ],
  plugins: [
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-transform-named-capturing-groups-regex'
  ]
};
