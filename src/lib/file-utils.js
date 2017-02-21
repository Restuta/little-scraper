import fs from 'fs'

/* Wrappers for node-fs function that return promises and write JSON to files
*/

export function writeJsonToFile (file, obj, options = {}) {
  let spaces = typeof options === 'object' && options !== null
    ? 'spaces' in options
    ? options.spaces : this.spaces
    : this.spaces

  return new Promise((resolve, reject) => {
    let str = ''

    try {
      str = JSON.stringify(obj, options ? options.replacer : null, spaces) + '\n'
    } catch (err) {
      reject(err)
    }

    fs.writeFile(file, str, options, (err) => {
      if (err) reject(err)

      resolve(file)
    })
  })
}

export function appendJsonToFile (file, obj, options, callback) {
  let spaces = typeof options === 'object' && options !== null
    ? 'spaces' in options
    ? options.spaces : this.spaces
    : this.spaces

  return new Promise((resolve, reject) => {
    let str = ''

    try {
      str = JSON.stringify(obj, options ? options.replacer : null, spaces) + '\n'
    } catch (err) {
      reject(err)
    }

    fs.appendFile(file, str, options, (err) => {
      if (err) reject(err)

      resolve(file)
    })
  })
}

export default {
  writeJsonToFile,
  appendJsonToFile
}
