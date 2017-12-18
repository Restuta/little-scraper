// TODO: add writing to file (make this separate module?)
// TODO: make error reporting similar to non Rx scraper
// TODO: randomize delays
// // TODO: reporting of failed requests
// TODO: aggregation of failed requests with Either Monad (can't )

const R = require('ramda')
const Rx = require('rxjs/Rx')

const { log } = require('../console-tools')
const { logHttpErrorForObservable } = require('./utils/console-utils')
const { get } = require('./utils/ramda-utils')
const { httpError } = require('./utils/rx-utils')

const buildRequest = require('../build-request')
const {
  buildRequestWithRotatingUserAgent
} = require('../build-request-with-rotating-user-agent')

// const { createHttpClient } = require('./utils/http-client')
//
// const http = createHttpClient({
//   baseURL: 'https://api.github.com',
//   headers: {
//     Authorization: `token ${config.GITHUB_PERSONAL_ACCESS_TOKEN}`
//   }
// })

const requestWithoutCookies = buildRequest({ useCookies: false })

const O = Rx.Observable

const createScraper = ({
  // a function that will be called for every result returned by requesting every url passed to scraper
  scrapingFunc = () => [],
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

  return urlsWithContext =>
    // urlsWithContext could be an iterator
    O.from(urlsWithContext)
      .mergeMap(
        urlWithContext =>
          O.of(urlWithContext)
            .mergeMap(({ url }) => O.fromPromise(httpGet(url)))
            .delay(delay)
            .retryWhen(
              httpError({
                maxRetries: retryAttempts,
                backoffMs: retryBackoffMs,
                exponentialBackoff: exponentialRetryBackoff
              })
            ),
        // .do(reportOnProgress),
        // result selector, defines shape of the observable data passed further
        (url, response) => ({ response, urlWithContext: url }),
        concurrency
      )
      .do(({ response, urlWithContext }) =>
        log.done(`[${response.statusCode}] ${urlWithContext.url}`)
      )
      // .catch(err => {
      //   const url = get('request.url', err)
      //   const response = err.response
      //   return O.of(({ response, urlWithContext: { url, status: 'fail' } }))
      // })
      // .catch(logHttpErrorForObservable)
      // .do(({urlWithContext}) => console.dir(urlWithContext))
      .map(scrapingFunc)
      // .map(({ response, urlWithContext }) =>
      //   scrapingFunc({ response, urlWithContext })
      // )
      // .reduce(R.concat, [])
      .reduce((results, currentResults) => {
        if (!Array.isArray(results)) {
          throw new Error(
            "Scraping function must return an array, but it didn't. " +
              `Instead returned value was: "${currentResults}"`
          )
        }

        return results.concat(currentResults)
      })
      .do(results => {
        if (results) {
          log.info('Total results: ' + results.length)
        } else {
          log.info('Results were null or undefined after scraping.')
        }

        if (writeResultsToFile) {
          return writeJsonToFile(`data/${fileName}.json`, results, { spaces: 2 })
            .then(fileName => log.done(`Saved results to "data/${fileName}"`))
            .then(() => results)
        }
      })
}

// change to named export
module.exports = {
  createScraper
}
