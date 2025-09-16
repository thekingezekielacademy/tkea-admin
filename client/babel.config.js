module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          safari: '>= 13'
        },
        useBuiltIns: 'usage',
        corejs: 3
      }
    ],
    '@babel/preset-react',
    '@babel/preset-typescript'
  ],
  plugins: [
    '@babel/plugin-transform-named-capturing-groups-regex'
  ]
};
