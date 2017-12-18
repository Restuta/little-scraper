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

const getIpAddress = ({ response, urlWithContext }) => {
  // log.done(urlWithContext.url)
  const ip = response.body
  return [ip]
}

// #3 lets configure scraper and run it

const { createScraper } = require('../lib/observables')
const { uniq } = require('lodash/fp')

const scrape = createScraper({
  scrapingFunc: getIpAddress,
  concurrency: 1,
  delay: 500,
  retryAttempts: 1,
  retryBackoffMs: 200,
  // proxyUrl: 'http://open.proxymesh.com:31280',
  // proxyUrl: 'http://us-wa.proxymesh.com:31280',
  headers: {
    'X-ProxyMesh-Country': 'RU'
    // 'Proxy-Authorization': 'Basic ' + new Buffer('restuta8@gmail.com:<pwd>').toString('base64')
  }
})

async function runScraping() {
  await scrape(
    Array(3)
      .fill('http://uinames.com/api')
      // .map((x, i) => ({ url: `${x}/${Math.random() > 0 ? i : '#' + i}` }))
      .map(x => ({ url: x }))
  ).subscribe(x => {
    const names = x.map(JSON.parse)
    log.json(names.map(x => x.name))
  })
}

// now when it's ready lets start crawling, its as simple as
// scrape(createUrls()).then(log.json)

// log.info('\n')

module.exports = runScraping
