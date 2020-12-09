const qs  = require('querystring');
const loaderUtils  = require('loader-utils');
const {formatError}  = require('./formatError');
const { compileTemplate }  = require('@vue/compiler-sfc');
const { getDescriptor }  = require ('./descriptorCache')
const { resolveScript } =  require ('./resolveScript')
// Loader that compiles raw template into JavaScript functions.
// This is injected by the global pitcher (../pitch) for template
// selection requests initiated from vue files.
const TemplateLoader = function (source, inMap) {
  source = String(source)
  const loaderContext = this

  // although this is not the main vue-loader, we can get access to the same
  // vue-loader options because we've set an ident in the plugin and used that
  // ident to create the request for this loader in the pitcher.
  const options = (loaderUtils.getOptions(loaderContext) ||
    {})

  const isServer = loaderContext.target === 'node'
  const isProd = loaderContext.mode === 'production'
  const query = qs.parse(loaderContext.resourceQuery.slice(1))
  const scopeId = query.id;
  const descriptor = getDescriptor(loaderContext.resourcePath)
  const script = resolveScript(
    descriptor,
    query.id,
    options,
    loaderContext
  )

  let compiler;
  if (typeof options.compiler === 'string') {
    compiler = require(options.compiler)
  } else {
    compiler = options.compiler
  }

  const compiled = compileTemplate({
    source,
    filename: loaderContext.resourcePath,
    inMap,
    id: scopeId,
    isProd,
    ssr: isServer,
    ssrCssVars: descriptor.cssVars,
    compiler,
    compilerOptions: {
      ...options.compilerOptions,
      scopeId: query.scoped ? `data-v-${scopeId}` : undefined,
      bindingMetadata: script ? script.bindings : undefined,
    },
    transformAssetUrls: options.transformAssetUrls || true,
  })

  // tips
  if (compiled.tips.length) {
    compiled.tips.forEach((tip) => {
      loaderContext.emitWarning(tip)
    })
  }

  // errors
  if (compiled.errors && compiled.errors.length) {
    compiled.errors.forEach((err) => {
      if (typeof err === 'string') {
        loaderContext.emitError(err)
      } else {
        formatError(
          err,
          inMap ? inMap.sourcesContent[0] : (source),
          loaderContext.resourcePath
        )
        loaderContext.emitError(err)
      }
    })
  }

  const { code, map } = compiled
  loaderContext.callback(null, code, map)
}

exports.default = TemplateLoader;
