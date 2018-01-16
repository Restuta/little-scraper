/* eslint-disable */

const { log } = require('../lib/console-tools')

/* To scrape something you would have to do 3 things:

1. Create an array of urls (with optional context) to scrape from
2. define a scraping function that scrapes results from give HTML page
3. Configure and run scraper with defined function and crated array of urls

So let's do this.
*/

// #1 Lets define a function that would just return an array of urls we want to scrape from
// We will use google search results as an example and  simple context object that indicates
// on which page number particular result was found

// #2 Scraper funcion is just a function that accepts an object that consists of
// Http Response and url with context. It will be called for each url crated above.
// Let's use cheerio to scrape search result titles from google.

const getNumber = ({ response, urlWithContext }) => {
  const number = response.body
  return [number]
}

// #3 lets configure scraper and run it

const { createScraper } = require('../lib/observables')
const { uniq } = require('lodash/fp')

const scrape = createScraper({
  scrapingFunc: getNumber,
  scrapeWhile: ({ response, urlWithContext }) => {
    const responseBody = response.body
    // log.debug('response.body: ' + response.body)
    return responseBody !== ''
  },
  concurrency: 5,
  delay: 500,
  retryAttempts: 2,
  retryBackoffMs: 200,
  randomizeDelay: true,
  logProgress: true,
  logHttpRequests: true,
  // proxyUrl: 'http://open.proxymesh.com:31280',
  // proxyUrl: 'http://us-wa.proxymesh.com:31280',
  headers: {
    'X-ProxyMesh-Country': 'RU'
    // 'Proxy-Authorization': 'Basic ' + new Buffer('restuta8@gmail.com:<pwd>').toString('base64')
  }
})

async function runScraping() {
  const createUrls = number =>
    Array(number)
      .fill('http://localhost:3456/numbers')
      .map((x, i) => ({ url: `${x}/${i + 1}` }))

  function makeIterator(array) {
    var nextIndex = 0

    return {
      [Symbol.iterator]() {
        return {
          next: function() {
            console.info(chalk.grey('next() is called: ' + nextIndex))
            return nextIndex < array.length
              ? { value: array[nextIndex++], done: false }
              : { done: true }
          }
        }
      }
    }
  }

  const generateUrls = function*() {
    let i = 0
    while (true) {
      yield { url: `http://localhost:3456/numbers/${i++}`, _number: i }
    }
  }

  // const iterator = generateUrls()
  // console.info(iterator.next().value)
  // console.info(iterator.next().value)

  // await scrape({fromUrls: createUrls(10)})
  const urlsIterator = generateUrls()
  // // const urlsIterator = makeIterator(createUrls(100))
  //
  const results = await scrape({ fromUrlsIterator: urlsIterator })

  log.info('results: ')
  log.json(
    results
      .map(x => parseInt(x))
      .filter(x => !isNaN(x))
      .sort((a, b) => a - b)
  )
  console.info('done')

  // log.json(urlsIterator.next())

  // const chalk = require('chalk')
  // const Rx = require('rxjs/Rx')
  // const O = Rx.Observable
  // const buildRequest = require('../lib/build-request')
  // const {
  //   buildRequestWithRotatingUserAgent
  // } = require('../lib/build-request-with-rotating-user-agent')
  //
  // const httpGet = url => {
  //   log.debug('HTTP: ' + url)
  //   return buildRequestWithRotatingUserAgent({
  //     request: buildRequest({ useCookies: false }),
  //     successStatusCodes: [200]
  //   })(url)
  // }
  //
  // const R = require('ramda')
  // const { httpError } = require('../lib/observables/utils/rx-utils')
  // const IteratorSubject = require('../lib/observables/iterator-subject')
  //
  //
  // const urlEnumeratorSubject = new IteratorSubject(urlsIterator)
  //
  // const CONCURRENCY = 3
  //
  // const scrapeWhile = ({ response }) => {
  //   return response.body !== ''
  // }
  //
  // urlEnumeratorSubject
  //   .mergeMap(
  //     ({ url }) =>
  //       O.of(url)
  //         .flatMap(url => httpGet(url))
  //         .delay(100)
  //         .retryWhen(
  //           httpError({
  //             maxRetries: 0,
  //             backoffMs: 1000,
  //             exponentialBackoff: true,
  //             onFinalRetryFail: () => {
  //               log.fail('final retry failed')
  //               urlEnumeratorSubject.next()
  //             }
  //           })
  //         ),
  //     (urlWithContext, response) => ({ url: urlWithContext.url, response }),
  //     /* concurrencty */ CONCURRENCY
  //   )
  //   .do(({ url, response }) => {
  //     if (scrapeWhile({ response })) {
  //       log.info(' after flatMap: ' + url + ' ' + response.statusCode)
  //       urlEnumeratorSubject.next()
  //     } else {
  //       log.info(
  //         chalk.magenta(
  //           ' after flatMap, stopping: ' + url + ' ' + response.statusCode
  //         )
  //       )
  //       urlEnumeratorSubject.complete()
  //     }
  //
  //     // emitNextUrlCreated()
  //     //   emitNextItemFromIterator()
  //   })
  //   // .takeWhile(scrapeWhile)
  //   .map(({ response }) => response.body)
  //   .reduce((results, currentResults) => {
  //     return results.concat(parseInt(currentResults))
  //   }, [])
  //   .subscribe(x => {
  //     log.done('all emissions are done')
  //     log.json(x.filter(x => !isNaN(x)).sort((a, b) => a - b))
  //   })
  //
  // R.times(() => urlEnumeratorSubject.next(), CONCURRENCY)
}

module.exports = runScraping
