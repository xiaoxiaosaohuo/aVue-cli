[
    'env',
    'exit',
    'ipc',
    'logger',
    'module',
    'object',
    'openBrowser',
    'pkg',
    'pluginResolution',
    'launch',
    'request',
    'spinner',
    'validate'
  ].forEach(m => {
    Object.assign(exports, require(`./${m}`))
  })
  
  exports.chalk = require('chalk')
  exports.execa = require('execa')
  exports.semver = require('semver')
  
  Object.defineProperty(exports, 'installedBrowsers', {
    enumerable: true,
    get () {
      return exports.getInstalledBrowsers()
    }
  })
  