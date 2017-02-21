'use strict'

const { paths: { project, src, dist } } = require('./paths')

const entry = {
  index: [project('index')],
  lib: [src('lib')]
}

const output = {
  path: dist(),
  filename: '[name].js'
}

module.exports = { entry, output }
