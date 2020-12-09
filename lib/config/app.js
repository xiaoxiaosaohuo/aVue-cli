// config that are specific to --target app
const fs = require('fs')
const path = require('path')

// ensure the filename passed to html-webpack-plugin is a relative path
// because it cannot correctly handle absolute paths
function ensureRelative (outputDir, _path) {
  if (path.isAbsolute(_path)) {
    return path.relative(outputDir, _path)
  } else {
    return _path
  }
}

module.exports = (api, options) => {
  api.chainWebpack(webpackConfig => {
    // only apply when there's no alternative target
    if (process.env.VUE_CLI_BUILD_TARGET && process.env.VUE_CLI_BUILD_TARGET !== 'app') {
      return
    }

    const isProd = process.env.NODE_ENV === 'production'
    const isLegacyBundle = process.env.VUE_CLI_MODERN_MODE && !process.env.VUE_CLI_MODERN_BUILD
    const outputDir = api.resolve(options.outputDir)

    const getAssetPath = require('../util/getAssetPath')
    const outputFilename = getAssetPath(
      options,
      `js/[name]${isLegacyBundle ? `-legacy` : ``}${isProd && options.filenameHashing ? '.[contenthash:8]' : ''}.js`
    )
    webpackConfig
      .output
        .filename(outputFilename)
        .chunkFilename(outputFilename)

    // code splitting
    if (process.env.NODE_ENV !== 'test') {
      webpackConfig
        .optimization.splitChunks({
          cacheGroups: {
            vendors: {
              name: `chunk-vendors`,
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              chunks: 'initial'
            },
            common: {
              name: `chunk-common`,
              minChunks: 2,
              priority: -20,
              chunks: 'initial',
              reuseExistingChunk: true
            }
          }
        })
    }


     
     

    const multiPageConfig = options.pages||{}
    const publicCopyIgnore = ['**/.DS_Store']
    if (!multiPageConfig) {

    }else{
    // multi-page setup
      // TODO
      // webpackConfig.entryPoints.clear()

      const pages = Object.keys(multiPageConfig)
      const normalizePageConfig = c => typeof c === 'string' ? { entry: c } : c

      pages.forEach(name => {
        const pageConfig = normalizePageConfig(multiPageConfig[name])
        const {
          entry,
          template = `public/${name}.page`,
          filename = `${name}.page`,
          chunks = ['chunk-vendors', 'chunk-common', name]
        } = pageConfig

        // inject entry
        const entries = Array.isArray(entry) ? entry : [entry]
        webpackConfig.entry(name).merge(entries.map(e => api.resolve(e)))

      })
    }
    
      
      

   

    // copy static assets in public/
    const publicDir = api.resolve('public')
    if (!isLegacyBundle && fs.existsSync(publicDir)) {
      webpackConfig
        .plugin('copy')
          .use(require('copy-webpack-plugin'), [{
            patterns: [{
              from: publicDir,
              to: outputDir,
              toType: 'dir',
              globOptions: {
                ignore: publicCopyIgnore
              }
            }]
          }])
    }
  })
}
