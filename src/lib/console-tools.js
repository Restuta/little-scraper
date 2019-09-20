'use strict'

// this extends string prototype
const chalk = require('chalk')

const util = require('util')

const preProcessMessage = function(msg) {
  let message = msg

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

const info = function(msg) {
  const message = preProcessMessage(msg)
  console.log(chalk.white(message))
}

// use to just log an error, where app can continue running, use "fail" to log critical error that
// blocks execution
const error = function(msg) {
  const message = preProcessMessage(msg)
  console.log(chalk.red('× ') + chalk.red(message))
}

const dataError = function(msg) {
  const message = preProcessMessage(msg)
  console.log(chalk.red('Data Error: ') + chalk.cyan(message))
}

const debug = function(msg) {
  const message = preProcessMessage(msg)
  console.log(chalk.blue(message))
}

const done = function(msg) {
  const message = preProcessMessage(msg)
  console.log(chalk.green('✓ ') + chalk.white(message))
}

const doneBut = function(msg) {
  const message = preProcessMessage(msg)
  console.log(chalk.yellow('✓ ') + chalk.grey(message))
}

const warn = function(msg) {
  const message = preProcessMessage(msg)
  console.log(chalk.yellow('○ ') + chalk.grey(message))
}

const fail = function(msg) {
  const message = preProcessMessage(msg)
  console.log(chalk.red('× ') + chalk.grey(message))
}

const getJSON = function(object, depth = 2) {
  return util.inspect(object, {
    depth: depth,
    colors: true,
  })
}

const json = function(object, depth = 2) {
  const json = getJSON(object, depth)
  console.log(chalk.white(json))
}

const task = function(msg) {
  const message = preProcessMessage(msg)
  console.log(chalk.yellow('★ ') + chalk.white(message))
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
  task,
}

module.exports = { log, getJSON }
