
const {compileScript} =  require('@vue/compiler-sfc');
const clientCache = new WeakMap()
const serverCache = new WeakMap()

/**
 * inline template mode can only be enabled if:
 * - is production (separate compilation needed for HMR during dev)
 * - template has no pre-processor (separate loader chain required)
 * - template is not using src
 */
function canInlineTemplate(descriptor, isProd) {
  const templateLang = descriptor.template && descriptor.template.lang
  const templateSrc = descriptor.template && descriptor.template.src
  return isProd && !!descriptor.scriptSetup && !templateLang && !templateSrc
}

exports.canInlineTemplate = canInlineTemplate

exports.resolveScript = function resolveScript(
  descriptor,
  scopeId,
  options,
  loaderContext
) {
  if (!descriptor.script && !descriptor.scriptSetup) {
    return null
  }

  const isProd = loaderContext.mode === 'production'
  const isServer = loaderContext.target === 'node'
  const enableInline = canInlineTemplate(descriptor, isProd)

  const cacheToUse = isServer ? serverCache : clientCache
  const cached = cacheToUse.get(descriptor)
  if (cached) {
    return cached
  }

  let resolved = null

  let compiler;
  if (typeof options.compiler === 'string') {
    compiler = require(options.compiler)
  } else {
    compiler = options.compiler
  }

  if (compileScript) {
    try {
      resolved = compileScript(descriptor, {
        id: scopeId,
        isProd,
        inlineTemplate: enableInline,
        babelParserPlugins: options.babelParserPlugins,
        templateOptions: {
          compiler,
          ssr: isServer,
          transformAssetUrls: options.transformAssetUrls || true,
        },
      })
    } catch (e) {
      loaderContext.emitError(e)
    }
  } else if (descriptor.scriptSetup) {
    loaderContext.emitError(
      `<script setup> is not supported by the installed version of ` +
        `@vue/compiler-sfc - please upgrade.`
    )
  } else {
    resolved = descriptor.script
  }

  cacheToUse.set(descriptor, resolved)
  return resolved
}
