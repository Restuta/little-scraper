const fs = require('fs')
const prettier = require('prettier')

/* Wrappers for node-fs function that return promises and write JSON to files
*/

function writeJsonToFile(file, obj, options = {}) {
  let spaces =
    typeof options === 'object' && options !== null
      ? 'spaces' in options ? options.spaces : this.spaces
      : this.spaces

  return new Promise((resolve, reject) => {
    let str = ''

    try {
      str = JSON.stringify(obj, options ? options.replacer : null, spaces) + '\n'
      str = prettier.format(str, { parser: 'json' })
    } catch (err) {
      reject(err)
    }

    fs.writeFile(file, str, options, err => {
      if (err) {
        reject(err)
      }

      resolve(file)
    })
  })
}

function appendJsonToFile(file, obj, options, callback) {
  let spaces =
    typeof options === 'object' && options !== null
      ? 'spaces' in options ? options.spaces : this.spaces
      : this.spaces

  return new Promise((resolve, reject) => {
    let str = ''

    try {
      str = JSON.stringify(obj, options ? options.replacer : null, spaces) + '\n'
      str = prettier.format(str, { parser: 'json' })
    } catch (err) {
      reject(err)
    }

    fs.appendFile(file, str, options, err => {
      if (err) {
        reject(err)
      }

      resolve(file)
    })
  })
}

module.exports = {
  writeJsonToFile,
  appendJsonToFile,
}
