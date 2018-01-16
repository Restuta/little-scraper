const R = require('ramda')

const pathGetter = R.compose(R.path, R.split('.'))
const get = R.curry((path, obj) => pathGetter(path)(obj))

module.exports = {
  get,
}
