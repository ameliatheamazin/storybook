module.exports = {
  stories: ['../src/**/*.stories.@(ts|tsx|js|jsx|mdx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  core: {
    disableTelemetry: true,
  },
  features: {
    buildStoriesJson: false,
    breakingChangesV7: false,
    storyStoreV7: false,
    channelOptions: { allowFunction: false, maxDepth: 10 },
  },
  framework: '@storybook/vue3-webpack5',
};
