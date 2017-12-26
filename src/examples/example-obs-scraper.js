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
    return responseBody !== '8'
  },
  concurrency: 3,
  delay: 1000,
  retryAttempts: 2,
  retryBackoffMs: 200,
  // proxyUrl: 'http://open.proxymesh.com:31280',
  // proxyUrl: 'http://us-wa.proxymesh.com:31280',
  headers: {
    'X-ProxyMesh-Country': 'RU',
    // 'Proxy-Authorization': 'Basic ' + new Buffer('restuta8@gmail.com:<pwd>').toString('base64')
  },
})

async function runScraping() {
  const createUrls = number =>
    Array(number)
      .fill('http://localhost:3456/numbers')
      .map((x, i) => ({ url: `${x}/${i + 1}` }))

  const generateUrls = function*() {
    let i = 0
    while(true) {
      yield {url: `http://localhost:3456/numbers/${i++}`}
    }
  }

  // const iterator = generateUrls()
  // console.info(iterator.next().value)
  // console.info(iterator.next().value)



  // await scrape({fromUrls: createUrls(10)})
  await scrape({fromUrlsGenerator: generateUrls})
  console.info('done')

  // const Rx = require('rxjs/Rx')
  // const O = Rx.Observable
  // const buildRequest = require('../lib/build-request')
  // const httpGet = url => {
  //   log.debug('HTTP: ' + url)
  //   return buildRequest()(url)
  // }
  //
  // O.from(generateUrls())
  //   .take(10)
  //   .delay(500)
  //   .subscribe(x => log.json(x))

  //
  // O.from(createUrls(10))
  //   .mergeMap(
  //     ({ url }) =>
  //       O.of(url)
  //         .flatMap(url => httpGet(url))
  //         .delay(500),
  //     (url, response) => response,
  //     /* concurrencty */ 1,
  //   )
  //   .takeWhile(response => response.body !== '3')
  //   .do(response => log.debug(response.body))
  //   .subscribe()
}

// now when it's ready lets start crawling, its as simple as
// scrape(createUrls()).then(log.json)

// log.info('\n')

module.exports = runScraping
