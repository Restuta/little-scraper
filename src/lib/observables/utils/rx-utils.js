const Rx = require('rxjs/Rx')
const R = require('ramda')
const { get } = require('./ramda-utils')
const { log, getJSON } = require('../../console-tools')

const noop = () => undefined

// Adnvanced retry logic for HTTP failures.
// Function that creates a function to be used with Rx.Observable.retryWhen()
// example: retryWhen(httpError())
const httpError = ({
  maxRetries = 3,
  // a function that accepts an error and gets number of seconds to retry after
  // from it if possible, e.g. from HTTP reesponse header
  retryAfterGetter = noop,
  // used if retryAfterGetter func retunrs nothing
  backoffMs = 1000,
  // multiplies backoffMs on attempt number
  exponentialBackoff = false,
  // callback function
  onFinalRetryFail = R.identity,
  logProgress = true,
}) => errorsObservable =>
  // maxRetries + 1 is used so we can get into retry code after last attempt
  // and fail accordingly
  Rx.Observable.range(1, maxRetries + 1)
    // combine errors observable (enhanced with logging) with range observable
    .zip(errorsObservable, (i, err) => ({
      attempt: i,
      retryAfterMs: retryAfterGetter(err) || backoffMs,
      err,
    }))
    // waiting for "inner" observable before re-trying "outer" one
    // mergeMap is same as flatMap
    .mergeMap(x => {
      const retryAfter = exponentialBackoff ? x.retryAfterMs * x.attempt : x.retryAfterMs
      const err = x.err
      const totalAttempts = maxRetries + 1

      if (x.attempt > maxRetries) {
        log.fail(
          `[${get('response.statusCode', err) || ''}] ${get('request.url', err)}` +
            `, failed after ${totalAttempts} total attempts`
        )
        log.error(
          err.stack ||
            'No stack, logging entire error object instead: \n' + getJSON(err, 1)
        )
        // using Observable.throw would stop emittion so if multiple observables are
        // in re-try phase that would only throw once
        // return Rx.Observable.throw(err)

        // can't access this from outside
        // return Rx.Observable.of('hello')

        onFinalRetryFail()
        return Rx.Observable.empty()
      }

      logProgress &&
        log.warn(
          `[${get('response.statusCode', err) || ''}] ${get('request.url', err)}` +
            `, failed, attempt ${x.attempt}/${totalAttempts}` +
            `, retrying after ${retryAfter}ms`
        )

      return Rx.Observable.timer(retryAfter)
    })

module.exports = {
  httpError,
}
