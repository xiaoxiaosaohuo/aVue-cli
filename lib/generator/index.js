module.exports = (api, options) => {
    api.render('./template', {
      doesCompile: api.hasPlugin('babel') || api.hasPlugin('typescript')
    })
  
    api.extendPackage({
        dependencies: {
          'vue': '^3.0.0'
        },
        devDependencies: {
          '@vue/compiler-sfc': '^3.0.0'
        }
    })
  
    api.extendPackage({
      scripts: {
        'serve': 'vue-cli-service serve',
        'build': 'vue-cli-service build'
      },
      browserslist: [
        '> 1%',
        'last 2 versions',
        'not dead'
      ]
    })
  
    // additional tooling configurations
    if (options.configs) {
      api.extendPackage(options.configs)
    }
  }
  