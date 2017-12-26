// TODO: add writing to file (make this separate module?)

const R = require('ramda')
const Rx = require('rxjs/Rx')
const chalk = require('chalk')

const { log } = require('../console-tools')
const { logHttpErrorForObservable } = require('./utils/console-utils')
const { get } = require('./utils/ramda-utils')
const { httpError } = require('./utils/rx-utils')
const { rnd } = require('./utils/rnd')

const buildRequest = require('../build-request')
const {
  buildRequestWithRotatingUserAgent
} = require('../build-request-with-rotating-user-agent')
const requestWithoutCookies = buildRequest({ useCookies: false })
const O = Rx.Observable

const createScraper = ({
  // a function that will be called for every result returned by requesting every url passed to scraper
  scrapingFunc = () => [],
  // defines when to stop scraping, useful when generator function is used
  // to produce urls, infinte by default
  scrapeWhile = request => true,
  createPagedUrl,
  concurrency = 3,
  delay = 1000,
  // would randomize given delay, so it's within [x/2, x*2] range
  randomizeDelay = true,
  retryAttempts = 5,
  retryBackoffMs = 1000,
  // retryAttempt * retryBackoffMs
  exponentialRetryBackoff = true,
  // a function that accetps a number representing "totalPages"
  // called whenever any progress is made (URL is finished fetching)
  onProgress = R.identity,
  // a function that can fetch URL
  request = requestWithoutCookies,
  // if response status code is not one of the described below request would be reated as failed
  successStatusCodes = [200],
  proxyUrl = '',
  headers = {},
  writeResultsToFile = false
}) => {
  const httpGet = buildRequestWithRotatingUserAgent({
    request,
    successStatusCodes,
    proxyUrl,
    headers
  })

  let successCount = 0
  let failedCount = 0

  return ({ fromUrls: urlsWithContext, fromUrlsGenerator: urlsGenerator }) => {
    if (urlsGenerator && !scrapeWhile) {
      throw new Error(
        '"scrapeWhile" parameter is required when using an url generator function' +
          'otherwise scraping will not know where to stop and will run forever'
      )
    }

    // second parameter is required in case of generator function so observable
    // starts immediately, by default it doesn't start when using generator
    // funcitons withough "take", since it uses "queue" scheduler
    // more about schedulers https://github.com/ReactiveX/rxjs/blob/master/doc/scheduler.md#scheduler-types
    return (
      (urlsWithContext
        ? O.from(urlsWithContext)
        : O.from(urlsGenerator(), Rx.Scheduler.asap)
      )
        .mergeMap(
          ({ url }) =>
            O.of(url)
              .flatMap(url => httpGet(url))
              .delay(randomizeDelay ? rnd(delay / 1.5, delay * 1.5) : delay)
              .retryWhen(
                httpError({
                  maxRetries: retryAttempts,
                  backoffMs: retryBackoffMs,
                  exponentialBackoff: exponentialRetryBackoff,
                  onFinalRetryFail: () => (failedCount += 1)
                })
              ),
          // result selector, defines shape of the observable data passed further
          (url, response) => ({ response, urlWithContext: url }),
          concurrency
        )
        .takeWhile(scrapeWhile)
        .do(({ response, urlWithContext }) =>
          log.done(
            `[${response.statusCode}] ${urlWithContext.url}` +
              ` ${chalk.gray(response.timeToCompleteMs + 'ms')}`
          )
        )
        .map(scrapingFunc)
        .do(() => (successCount += 1))
        .reduce((results, currentResults) => {
          if (!Array.isArray(results)) {
            throw new Error(
              "Scraping function must return an array, but it didn't. " +
                `Instead returned value was: "${currentResults}"`
            )
          }

          return results.concat(currentResults)
        })
        // side-effects
        .do(results => {
          if (results) {
            const totalCount = successCount + failedCount

            console.log(
              chalk`Total/succeded/failed: {white ${totalCount}} = {green ${successCount}}` +
                (failedCount === 0
                  ? chalk` + {gray ${failedCount}}`
                  : chalk` + {rgb(255,70,0) ${failedCount}}`)
            )
          } else {
            log.info('Results were null or undefined after scraping.')
          }

          if (writeResultsToFile) {
            return writeJsonToFile(`data/${fileName}.json`, results, { spaces: 2 })
              .then(fileName => log.done(`Saved results to "data/${fileName}"`))
              .then(() => results)
          }
        })
        .toPromise()
    )
  }
}



module.exports = {
  createScraper
}
