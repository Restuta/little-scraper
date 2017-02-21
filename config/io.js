'use strict'

const { paths: { src, dist } } = require('./paths')

const entry = {
  index: [src('index')],
  lib: [src('lib')]
}

const output = {
  path: dist(),
  filename: '[name].js'
}

module.exports = { entry, output }
