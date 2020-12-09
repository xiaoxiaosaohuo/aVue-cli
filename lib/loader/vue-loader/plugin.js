
const webpack = require('webpack')
let Plugin;
console.log("webpack.version",webpack.version)
if (webpack.version && webpack.version[0] > '4') {
  // webpack5 and upper
  
}
Plugin = require('./pluginWebpack5').default
module.exports = Plugin;
