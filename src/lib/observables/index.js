// TODO: add writing to file (make this separate module?)
// TODO:  there is a big bug with "takeWhile" it would discard all results in a
// concurrent chunk if first result happen to meet takeWhile condition

const P = require('bluebird')
const R = require('ramda')
const Rx = require('rxjs/Rx')
const chalk = require('chalk')
const makeDir = require('make-dir')
const path = require('path')

const { log } = require('../console-tools')

const { httpError } = require('./utils/rx-utils')
const { rnd } = require('../utils/rnd')
const { writeJsonToFile } = require('./utils/file-utils')
const IteratorSubject = require('./iterator-subject')

const buildRequest = require('../build-request')
const {
  buildRequestWithRotatingUserAgent,
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
  // a function that is called whenever any progress is made (URL is finished fetching)
  // accepts results with context or error in arguments
  onProgress = R.identity,
  // a function that can fetch URL
  request = requestWithoutCookies,
  // if response status code is not one of the described below request would be reated as failed
  successStatusCodes = [200],
  proxyUrl = '',
  headers = {},
  writeResultsToFile = false,
  fileName,
  logProgress = true,
  logHttpRequests = false,
}) => {

  const getDelay = () => randomizeDelay ? rnd(delay / 1.5, delay * 1.5) : delay

  if (writeResultsToFile && !fileName) {
    throw new Error('"fileName" must be provided when "writeResultsToFile" is true')
  }

  const httpGet = url => {
    if (logHttpRequests) {
      console.log(chalk.gray('HTTP: ' + url))
    }
    return buildRequestWithRotatingUserAgent({
      request,
      successStatusCodes,
      proxyUrl,
      headers,
    })(url)
  }

  return ({ fromUrls: urlsWithContext, fromUrlsIterator: urlsIterator }) => {
    if (urlsIterator && !scrapeWhile) {
      throw new Error(
        '"scrapeWhile" parameter is required when using an' +
          ' url generator function' +
          'otherwise scraping will not know where to stop and will run forever'
      )
    }

    let successCount = 0
    let failedCount = 0

    const fromUrlsIterator = async (urlsIterator, scrapeWhile) => {
      const urlsIteratorSubject = new IteratorSubject(urlsIterator)

      const scrapingPromise = urlsIteratorSubject
        .mergeMap(
          ({ url }) =>
            O.of(url)
              .flatMap(url => httpGet(url))
              .delay(getDelay())
              .retryWhen(
                httpError({
                  maxRetries: retryAttempts,
                  backoffMs: retryBackoffMs,
                  exponentialBackoff: exponentialRetryBackoff,
                  logProgress,
                  onFinalRetryFail: err => {
                    onProgress(err)
                    failedCount += 1
                    urlsIteratorSubject.next()
                  },
                })
              ),
          // result selector, defines shape of the observable data passed further
          (urlWithContext, response) => ({ response, urlWithContext }),
          concurrency
        )
        .do(({ response, urlWithContext }) => {
          // this is the meat of this approach, we notifiy RxIteratorSubject to emit next item
          // which means "pull next item from iteratable" and since we subscribed to that very
          // RxIteratorSubject we get an observable running that is capable of producing values
          // while running. It's a simulation of a "pull model" that allows to use all the powerful
          // coordination primitives that RxJs provides.
          if (scrapeWhile({ response })) {
            urlsIteratorSubject.next()
          } else {
            urlsIteratorSubject.complete()
          }

          if (logProgress) {
            if (scrapeWhile({ response, urlWithContext })) {
              log.done(
                `[${response.statusCode}] ${urlWithContext.url}` +
                  ` ${chalk.gray(response.timeToCompleteMs + 'ms')}`
              )
            } else {
              log.doneBut(
                `[${response.statusCode}] ${urlWithContext.url}` +
                  ` ${chalk.gray(response.timeToCompleteMs + 'ms')}`
              )
            }
          }
        })
        .do(({ response, urlWithContext }) => {
          // increment success count only when scrape while is defined
          if (scrapeWhile && scrapeWhile({ response })) {
            successCount += 1
            onProgress({ response, urlWithContext })
          }
        })
        .map(scrapingFunc)
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
        .do(results => printSummary(results, successCount, failedCount))
        .toPromise()
        .then(
          results =>
            writeResultsToFile
              ? writeResultsToJsonFile(results, fileName).then(() => results)
              : results
        )

      // kicks in urlsIteratorSubject observable N times equal to given concurrency so our "cold"
      // observable starts
      // R.times(() => urlsIteratorSubject.next(), concurrency)

      for (let i = 0; i < concurrency; i++) {
        if (i !== 0) {
          await P.delay(getDelay())
        }

        urlsIteratorSubject.next()
      }

      return scrapingPromise.then(x => ({
        data: x,
        failedCount: failedCount,
        successCount: successCount,
      }))
    }

    const fromUrls = urls => {
      const urlsIterator = makeIterator(urls)
      return fromUrlsIterator(urlsIterator, () => true)
    }

    return urlsWithContext
      ? fromUrls(urlsWithContext)
      : fromUrlsIterator(urlsIterator, scrapeWhile)
  }
}

// creates iterator from arrray
function makeIterator(array) {
  let nextIndex = 0

  return {
    next: () =>
      nextIndex < array.length
        ? { value: array[nextIndex++], done: false }
        : { done: true },
  }
}

async function writeResultsToJsonFile(results, filePath) {
  const fullFilePath = `data/${filePath}.json`
  const dirName = path.dirname(fullFilePath)

  return makeDir(dirName).then(() =>
    writeJsonToFile(fullFilePath, results, {
      spaces: 2,
    }).then(fileName => log.done(`Saved results to "data/${fileName}"`))
  )
}

function printSummary(results, successCount, failedCount) {
  if (results) {
    const totalCount = successCount + failedCount

    console.log(
      chalk`Total = succeded + failed: ` +
        chalk`{white ${totalCount}} = {green ${successCount}}` +
        (failedCount === 0
          ? chalk` + {gray ${failedCount}}`
          : chalk` + {rgb(255,70,0) ${failedCount}}`)
    )
  } else {
    log.info('Results were null or undefined after scraping.')
  }
}

module.exports = createScraper
