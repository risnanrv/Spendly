module.exports = function (api) {
  api.cache(true);
  const isTest = process.env.NODE_ENV === 'test';

  const plugins = [
    // Absolute import paths
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './src',
          '@/components': './src/components',
          '@/features': './src/features',
          '@/hooks': './src/hooks',
          '@/providers': './src/providers',
          '@/services': './src/services',
          '@/database': './src/database',
          '@/stores': './src/stores',
          '@/constants': './src/constants',
          '@/theme': './src/theme',
          '@/utils': './src/utils',
          '@/types': './src/types',
          '@/lib': './src/lib',
          '@/config': './src/config',
        },
      },
    ],
    [
      'babel-plugin-inline-import',
      {
        extensions: ['.sql'],
      },
    ],
  ];

  if (!isTest) {
    plugins.push('react-native-reanimated/plugin');
  }

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins,
  };
};
