'use strict'

const { paths: { src, dist } } = require('./paths')

const entry = {
  main: [src('main')],
  lib: [src('lib')]
}

const output = {
  path: dist(),
  filename: '[name].js'
}

module.exports = { entry, output }
