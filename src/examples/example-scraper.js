import { log } from 'console-tools'

/* To scrape something you would have to do 3 things:

1. Create an array of urls (with optional context) to scrape from
2. define a scraping function that scrapes results from give HTML page
3. Configure and run scraper with defined function and crated array of urls

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

import buildScraper from 'index'

const scrape = buildScraper({
  scrapingFunc: scrapeTopStarredPackagesFromNpm,
  concurrency: 2,
  delay: 1000,
  writeResultsToFile: true
})

async function runScraping () {
  const results = await scrape(createUrls())
  log.json(results)
}

// now when it's ready lets start crawling, its as simple as
// scrape(createUrls()).then(log.json)

// log.info('\n')

export default runScraping
