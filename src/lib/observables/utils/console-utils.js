const chalk = require('chalk')
const Rx = require('rxjs/Rx')

const log = data => console.dir(data, { colors: true, depth: 4 })
const logInfo = msg => console.log(chalk.cyan(msg))
const logBlue = msg => console.log(chalk.blue(msg))
const logYellow = msg => console.log(chalk.yellow(msg))

// logs error and returns empty observable, so execution flow can continue
const logHttpErrorForObservable = (err, caught) => {
  console.log(chalk.red(err))
  console.log(chalk.red('Response headers:'))
  console.dir(err.response.headers, { colors: true, depth: 4 })
  return Rx.Observable.empty()
}

module.exports = {
  log,
  logInfo,
  logBlue,
  logYellow,
  logHttpErrorForObservable,
}
