# Little Scraper That Could 🚂
Little Node Scraper with simple but powerful async flow control goodness. Batteries included, features:
* retries falied requests with exponential backoff
* configurable parallelization
* randomized delays for non-uniform load
* browser headers rotation (to appear as a client browser)
* proxy support
* 👑 the only library with support of generator functions as a source of urls. (Useful for APIs or websites that use pagination, but won't tell you what is the last page.)
* can save results to a JSON file (beta feature)
* all above is configurable

## How to use

```javascript
import { log } from 'console-tools'

/* To scrape something you would have to do 3 things:

1. Create an array of urls (with optional context) to scrape from
2. Define a scraping function that scrapes results from given HTML page
3. Configure and run scraper with defined function and created array of urls

So let's do this.
*/

// #1 Lets define a function that would just return an array of urls we want to scrape from
// We will use google search results as an example and  simple context object that indicates
// on which page number particular result was found

const createUrls = () => {
 const createUrl = startFrom => `https://www.npmjs.com/browse/star?offset=${startFrom}`
 // const createUrl = startFrom => `https://ramen.is/sdf=${startFrom}`
 // first 5 goole search results

 // each page has 36 packages as of Feb 20th 2017, hardcoding paging value for simplicity
 return ([0, 36, 36 * 2, 36 * 3, 36 * 4]
   .map((startFrom, i) => ({
     url: createUrl(startFrom),
     context: {pageNumber: i}
   }))
 )
}

// #2 Scraper funcion is just a function that accepts an object that consists of
// Http Response and url with context. It will be called for each url crated above.
// Let's use cheerio to scrape search result titles from google.

import cheerio from 'cheerio' // jQuery-like HTML manipulation

const scrapeTopStarredPackagesFromNpm = ({response, urlWithContext}) => {
 const $ = cheerio.load(response.body)

 const $results = $('.package-widget .package-details .name')

 const values = $results
   .toArray()
   .map((elem) => $(elem).text())

 log.done(urlWithContext.url)
 // log.json(values)
 return values
}

// #3 lets configure scraper and run it

import createScraper from 'index'

const scrape = createScraper({
 scrapingFunc: scrapeTopStarredPackagesFromNpm,
 concurrency: 2,
 delay: 1000,
})

// now when it's ready lets start crawling, its as simple as
async function runScraping () {
 const results = await scrape({ fromUrls: createUrls() })
 log.json(results)
}

export default runScraping
```

## Scraper Configuration
```javascript
{
  // a function that will be called for every result returned by requesting every url passed to scraper
  scrapingFunc = (() => []),
  // default pessimistic delay between scraping function calls
  delay = 1000,

  // number of times to retry a request if it fails or returns non 200 error code
  retryAttempts = 3,
  // default retry delay is double of delay in between requests + one second
  retryDelay = delay * 2 + 1000,
  // if response status code is not one of the described below request would be treated as failed
  successStatusCodes = [200],
  // would randomize given delay, so it's within [x/2, x*2] range
  randomizeDelay = true,
  // 1 equal to sequential
  concurrency = 1,
  // default name for file to be used for storing resulting data, this name will also be used for intermediate
  // files created to chache results if "cacheIntermediateResultsToFile" is set to true
  fileName = 'tmp',
  // for long-running scraping processes it's useful to dump results into files so if something fails we don't loose
  // progress
  cacheIntermediateResultsToFile = false,
  writeResultsToFile = false,
  proxyUrl = ''
}
```
