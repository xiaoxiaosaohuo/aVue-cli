const path = require('path')
const { semver } = require('../../share-utils')

/** @type {import('@vue/cli-service').ServicePlugin} */
module.exports = (api, options) => {
  const cwd = api.getCwd()
  const webpack = require('webpack')
  const webpackMajor = semver.major(webpack.version)

  api.chainWebpack(webpackConfig => {
    const isLegacyBundle = process.env.VUE_CLI_MODERN_MODE && !process.env.VUE_CLI_MODERN_BUILD
    const resolveLocal = require('../util/resolveLocal')

    // https://github.com/webpack/webpack/issues/11467#issuecomment-691873586
    if (webpackMajor !== 4) {
      webpackConfig.module
        .rule('esm')
          .test(/\.m?jsx?$/)
          .resolve.set('fullySpecified', false)
    }

    webpackConfig
      .mode('development')
      .context(api.service.context)
      .entry('app')
        .add('./src/main.js')
        .end()
      .output
        .path(api.resolve(options.outputDir))
        .filename(isLegacyBundle ? '[name]-legacy.js' : '[name].js')
        .publicPath(options.publicPath)

    webpackConfig.resolve
      .extensions
        .merge(['.mjs', '.js', '.jsx', '.vue', '.json', '.wasm'])
        .end()
      .modules
        .add('node_modules')
        .add(api.resolve('node_modules'))
        .add(resolveLocal('node_modules'))
        .end()
      .alias
        .set('@', api.resolve('src'))

    webpackConfig.resolveLoader
      .plugin('pnp-loaders')
        .use({ ...require('pnp-webpack-plugin').topLevelLoader })
        .end()
      .modules
        .add('node_modules')
        .add(api.resolve('node_modules'))
        .add(resolveLocal('node_modules'))

    webpackConfig.module
      .noParse(/^(vue|vue-router|vuex|vuex-router-sync)$/)

    // js is handled by cli-plugin-babel ---------------------------------------

    // vue-loader --------------------------------------------------------------
      // for Vue 3 projects
      const vueLoaderCacheConfig = api.genCacheConfig('vue-loader', {
        'vue-loader': '^16.1.0',
        '@vue/compiler-sfc': require('@vue/compiler-sfc/package.json').version
      })

      webpackConfig.resolve
        .alias
          .set(
            'vue$',
            options.runtimeCompiler
              ? 'vue/dist/vue.esm-bundler.js'
              : 'vue/dist/vue.runtime.esm-bundler.js'
          )

      webpackConfig.module
        .rule('vue')
          .test(/\.vue$/)
          .use('cache-loader')
            .loader(require.resolve('cache-loader'))
            .options(vueLoaderCacheConfig)
            .end()
          .use('vue-loader')
            .loader(require.resolve('../loader/vue-loader'))
            .options({
              ...vueLoaderCacheConfig,
              babelParserPlugins: ['jsx', 'classProperties', 'decorators-legacy']
            })
            .end()
          .end()

      webpackConfig
        .plugin('vue-loader')
          .use(require('vue-loader').VueLoaderPlugin)

      // feature flags <http://link.vuejs.org/feature-flags>
      webpackConfig
        .plugin('feature-flags')
          .use(webpack.DefinePlugin, [{
            __VUE_OPTIONS_API__: 'true',
            __VUE_PROD_DEVTOOLS__: 'false'
          }])
    

    // Other common pre-processors ---------------------------------------------
    const maybeResolve = name => {
      try {
        return require.resolve(name)
      } catch (error) {
        return name
      }
    }

    webpackConfig.module
      .rule('pug')
        .test(/\.pug$/)
          .oneOf('pug-vue')
            .resourceQuery(/vue/)
            .use('pug-plain-loader')
              .loader(maybeResolve('pug-plain-loader'))
              .end()
            .end()
          .oneOf('pug-template')
            .use('raw')
              .loader(maybeResolve('raw-loader'))
              .end()
            .use('pug-plain-loader')
              .loader(maybeResolve('pug-plain-loader'))
              .end()
            .end()

 

    const resolveClientEnv = require('../util/resolveClientEnv')
    webpackConfig
      .plugin('define')
        .use(webpack.DefinePlugin, [
          resolveClientEnv(options)
        ])

    webpackConfig
      .plugin('case-sensitive-paths')
        .use(require('case-sensitive-paths-webpack-plugin'))

    // friendly error plugin displays very confusing errors when webpack
    // fails to resolve a loader, so we provide custom handlers to improve it
    const { transformer, formatter } = require('../util/resolveLoaderError')
    webpackConfig
      .plugin('friendly-errors')
        .use(require('@soda/friendly-errors-webpack-plugin'), [{
          additionalTransformers: [transformer],
          additionalFormatters: [formatter]
        }])

    const TerserPlugin = require('terser-webpack-plugin')
    const terserOptions = require('./terserOptions')
    webpackConfig.optimization
      .minimizer('terser')
        .use(TerserPlugin, [terserOptions(options)])
  })
}
