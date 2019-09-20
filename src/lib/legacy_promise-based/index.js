const moment = require('moment')
const _ = require('lodash')
const Bluebird = require('bluebird')
const buildRequest = require('../build-request')
const retry = require('./retry')
const { rnd } = require('../utils/rnd')
const {
  buildRequestWithRotatingUserAgent,
} = require('./build-request-with-rotating-user-agent')

const { appendJsonToFile, writeJsonToFile } = require('../file-utils')
const { log } = require('../console-tools')
// Bluebird.longStackTraces() //Long stack traces imply a substantial performance penalty,
// around 4-5x for throughput and 0.5x for latency.

const TIME_STAMP = moment().format('x_MMM-DD-YYYY_hh-mmA')

/* returns a Scraping Function that accept an array of objects representing urls to scrape with
 whatever useful context you can think of created while building them and returns array with scraped results
 event if it's just one url it must be an array, [ 'url' ]. Object has a shape of:
 {
  url: string
  context: object
 }

 Here is why it's useful, think about a situation when you create URL's to scrape and then your scraping func would accept
 results and also would need to understand some context, like "what URL parameters this data was scraped with?".
 Whithout concept of the context you would end up parsing url that you just crated, so why to go through troubles if
 special object can be created as well at the same time as your URLs.
 e.g.
 Say I scraped cat's name and color from the following URL: http://cats.cool/888 where 888 is id of the cat,
 if page HTML doesn't contain cat's id you would have to extract it from the URL, while with context you would created
 given url like so:

 const catId = 888
 const urlToScrape = {
  url: `http://cats.cool/${catId}`,
  context: {
    catId: catId
  }
}

 and then in your scraping func just:

 scrapingFunc(html, urlWithContext) {

   const cat = {
     id: urlWithContext.context.catId, //
     name: scrapeNameFrom(html),
     color: scrapeColorFrom(html),
   }
   return cat
 }
*/

const requestWithoutCookies = buildRequest({ useCookies: false })

// returns a function ready to be run to start scraping and writing results into cache
// function accepts an array of of urls to scrape and would follow given settings
const buildScraper = ({
  // a function that will be called for every result returned by requesting every url passed to scraper
  scrapingFunc = () => [],
  // default pessimistic delay between scraping function calls
  delay = 1000,
  // number of times to retry a request if it fails or returns non 200 error code
  retryAttempts = 3,
  // default retry delay is triple of delay in between requests + one second
  retryDelay = delay * 3 + 1000,
  // if response status code is not one of the described below request would be reated as failed
  successStatusCodes = [200],
  // would randomize given delay, so it's within [x/2, x*2] range
  randomizeDelay = true,
  // 1 equal to sequential
  concurrency = 1,
  // for long-running scraping processes it's useful to dump results into files so if something fails we don't loose
  // progress
  cacheIntermediateResultsToFile = false,
  writeResultsToFile = false,
  // default name for file to be used for storing resulting data, this name will also be used for intermediate
  // files created to chache results if "cacheIntermediateResultsToFile" is set to true
  fileName = 'tmp',
  proxyUrl = '',
  headers = {},
  // external request object, has to conform to standard `request` module interface
  request = requestWithoutCookies,
}) => {
  const requestWithRotatingUserAgent = buildRequestWithRotatingUserAgent({
    request,
    successStatusCodes,
    proxyUrl,
    headers,
  })

  return urlsWithContext =>
    Bluebird.map(
      urlsWithContext,
      (urlWithContext, index) =>
        retry(() => requestWithRotatingUserAgent(urlWithContext.url), {
          max: retryAttempts,
          backoff: retryDelay,
          operationInfo: urlWithContext.url,
        })
          .delay(
            index === 0
              ? 0 // no delay for very first request
              : randomizeDelay ? rnd(delay / 2, delay * 2) : delay
          )
          .then(response =>
            scrapingFunc({
              response: response,
              urlWithContext: urlWithContext,
            })
          )
          // after we got data from every url we can do something, e.g. append it to file as
          // intermediate result
          .then(data => {
            if (cacheIntermediateResultsToFile && data && data.length > 0) {
              const cacheFileName = `${TIME_STAMP}_${fileName}.json`
              return appendJsonToFile(`data/cache/${cacheFileName}`, data, {
                spaces: 2,
              }).then(() => data)
            } else {
              return data
            }
          }),
      { concurrency: concurrency }
    )
      // combining results into one array after all async execution is done
      .reduce((results, currentResults) => {
        if (!_.isArray(results)) {
          throw new Error(
            "Scraping function must return an array, but it didn't. " +
              `Instead returned value was: "${currentResults}"`
          )
        }

        return results.concat(currentResults)
      })
      // write results into file all at once (if corresponding flag is set)
      .then(results => {
        if (results) {
          log.info('Total results: ' + results.length)
        } else {
          log.info('Results were null or undefined after scraping.')
        }

        if (writeResultsToFile) {
          return writeJsonToFile(`data/${fileName}.json`, results, {
            spaces: 2,
          })
            .then(fileName => log.done(`Saved results to "data/${fileName}"`))
            .then(() => results)
        }

        return results
      })
      .catch(err => {
        if (err.stack) {
          if (err.stack.lines) {
            const newStack = _.map(
              err.stack.lines(),
              (line, index) => '\t\t' + line.trim()
            ).join('\n')

            log.fail(err.name + ', stack:\n ' + newStack)
          } else {
            log.fail(err.name + ', stack:\n ' + err.stack)
          }
        } else {
          log.fail('Something went wrong')
          log.debug(err)
        }
      })
}

module.exports = buildScraper
