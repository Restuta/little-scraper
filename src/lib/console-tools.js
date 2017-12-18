'use strict'

// this extends string prototype
const chalk = require('chalk')

const util = require('util')

const preProcessMessage = function(message) {
  if (message === undefined) {
    return 'undefined'
  }

  if (message === null) {
    return 'null'
  }

  if (typeof message !== 'string') {
    message = message.toString()
  }

  return message
}

const info = function(message) {
  message = preProcessMessage(message)
  console.log(chalk.white(message))
}

// use to just log an error, where app can continue running, use "fail" to log critical error that
// blocks execution
const error = function(message) {
  message = preProcessMessage(message)
  console.log(chalk.red('× ') + chalk.red(message))
}

const dataError = function(message) {
  message = preProcessMessage(message)
  console.log(chalk.red('Data Error: ') + chalk.cyan(message))
}

const debug = function(message) {
  message = preProcessMessage(message)
  console.log(chalk.blue(message))
}

const done = function(message) {
  message = preProcessMessage(message)
  console.log(chalk.green('\t✓ ') + chalk.white(message))
}

const doneBut = function(message) {
  message = preProcessMessage(message)
  console.log(chalk.yellow('\t✓ ') + chalk.grey(message))
}

const warn = function(message) {
  message = preProcessMessage(message)
  console.log(chalk.yellow('\t○ ') + chalk.grey(message))
}

const fail = function(message) {
  message = preProcessMessage(message)
  console.log(chalk.red('\t× ') + chalk.grey(message))
}

const json = function(object, depth = 2) {
  const json = getJSON(object, depth)
  console.log(chalk.white(json))
}

const task = function(message) {
  message = preProcessMessage(message)
  console.log(chalk.yellow('★ ') + chalk.white(message))
}

/* utility methods */

const getJSON = function(object, depth = 2) {
  return util.inspect(object, {
    depth: 2,
    colors: true
  })
}

const log = {
  info,
  error,
  dataError,
  debug,
  done,
  doneBut,
  warn,
  fail,
  json,
  task
}

module.exports = { log, getJSON }
