import Bluebird from 'bluebird'
import { log } from '../lib/console-tools'

/**
 * Retries given promise
 * @param {[type]} funcToRetry [A promise]
 * @param {Number} [max=10] [max number of retry attempts]
 * @param {Number} [backoff=100] [time to wait in between retries in ms]
 * @param {[type]} operationInfo [infomration about given async operation, for logging]
 */
const retry = (funcToRetry, {max = 10, backoff = 100, operationInfo}) => {
  return new Bluebird.Promise((resolve, reject) => {
    const attempt = (attemptNo) => {
      if (attemptNo > 0) {
        log.warn(`${operationInfo} - retrying, attempt ${attemptNo}/${max}`)
      }

      funcToRetry(attemptNo)
        .then(resolve)
        .catch((err) => {
          if (attemptNo >= max) {
            if (max === 0) {
              log.fail(`${operationInfo} – Failed on very first attempt :(`)
            } else {
              log.fail(`${operationInfo} – Failed after ${max} retry attempts :(`)
            }

            return reject(err)
          }
          setTimeout(() => attempt(attemptNo + 1), backoff)
        })
    }
    attempt(0)
  })
}

export default retry
