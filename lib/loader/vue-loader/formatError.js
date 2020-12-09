const { generateCodeFrame } =  require('@vue/compiler-sfc')
const chalk = require('chalk');

exports.formatError  = function formatError(
  err,
  source,
  file
) {
  const loc = (err).loc
  if (!loc) {
    return
  }
  const locString = `:${loc.start.line}:${loc.start.column}`
  const filePath = chalk.gray(`at ${file}${locString}`)
  const codeframe = generateCodeFrame(source, loc.start.offset, loc.end.offset)
  err.message = `\n${chalk.red(
    `VueCompilerError: ${err.message}`
  )}\n${filePath}\n${chalk.yellow(codeframe)}\n`
}
