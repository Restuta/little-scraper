/* eslint max-len: 0 */

const { startHttpServer, stopHttpServer } = require('./fake-http-server')
const { createScraper } = require('../index')
const R = require('ramda')

jest.setTimeout(15000)

beforeAll(async () => {
  await startHttpServer()
})

const getNumber = ({ response, urlWithContext }) => {
  const number = response.body
  return [parseInt(number, 10)]
}

const createUrlsForSlug = (number, slug) =>
  Array(number)
    .fill(`http://localhost:31439${slug}`)
    .map((x, i) => ({ url: `${x}/${i}` }))

const generateUrlsForSlug = function*(slug) {
  let i = 0
  while (true) {
    yield { url: `http://localhost:31439${slug}/${i++}`, _number: i }
  }
}

const createScraperParams = params => ({
  scrapingFunc: getNumber,
  scrapeWhile: ({ response, urlWithContext }) => {
    const responseBody = response.body
    // log.debug('response.body: ' + response.body)
    return responseBody !== ''
  },
  concurrency: 3,
  delay: 10,
  retryAttempts: 2,
  retryBackoffMs: 100,
  randomizeDelay: true,
  logProgress: false,
  logHttpRequests: false,
  // proxyUrl: 'http://open.proxymesh.com:31280',
  // proxyUrl: 'http://us-wa.proxymesh.com:31280',
  headers: {
    'X-ProxyMesh-Country': 'RU',
    // 'Proxy-Authorization': 'Basic ' + new Buffer('restuta8@gmail.com:<pwd>').toString('base64')
  },
  ...params,
})

const createScraperWith = R.compose(createScraper, createScraperParams)

const createTestForUrlsArray = ({ concurrency, only = false }) => {
  const testFunc = only ? test.only : test

  return testFunc(
    'It waits for other items to arrive before completing' +
      ` with concurrency ${concurrency}`,
    async () => {
      const scrape = createScraperWith({ concurrency: 1, logProgress: false })
      const results = await scrape({
        // this route has first item delayed by 3000s
        fromUrls: createUrlsForSlug(6, '/numbers/first-delayed'),
      })

      const processedResults = results.data.filter(x => !isNaN(x)).sort((a, b) => a - b)

      // 4th will fail,
      expect(processedResults).toEqual([0, 1, 2, 3, 5])
      expect(results.successCount).toEqual(5)
      expect(results.failedCount).toEqual(1)
    }
  )
}

const createTestForIterator = ({
  concurrency,
  slug,
  expectedResults,
  exptectedToSucced,
  expectedToFail,
  only = false,
}) => {
  const testFunc = only ? test.only : test

  return testFunc(
    'It waits for other items to arrive before completing' +
      ` with concurrency ${concurrency}`,
    async () => {
      const scrape = createScraperWith({ concurrency, logProgress: false })
      const results = await scrape({
        // this route has first item delayed by 3000s
        fromUrlsIterator: generateUrlsForSlug(slug),
      })

      const processedResults = results.data.filter(x => !isNaN(x)).sort((a, b) => a - b)

      // 4th will fail
      expect(processedResults).toEqual(expectedResults)
      expect(results.successCount).toEqual(exptectedToSucced)
      expect(results.failedCount).toEqual(expectedToFail)
    }
  )
}

describe('Scraping from urls array', () => {
  describe(
    'Finite array, when first item is delayed so much so other items' +
      ' complete before it arrives',
    () => {
      createTestForUrlsArray({ concurrency: 1 })
      createTestForUrlsArray({ concurrency: 3 })
      createTestForUrlsArray({ concurrency: 15 })
    }
  )
})

describe('Scraping from urls iterator', () => {
  describe(
    'Infinite iterator, when first item is delayed so much so other items' +
      ' complete before it arrives',
    () => {
      const firstDelayedTestsParams = {
        slug: '/numbers/first-delayed',
        expectedResults: [0, 1, 2, 3, 5],
        exptectedToSucced: 5,
        expectedToFail: 1,
      }
      createTestForIterator({ concurrency: 1, ...firstDelayedTestsParams })
      createTestForIterator({ concurrency: 3, ...firstDelayedTestsParams })
      createTestForIterator({ concurrency: 15, ...firstDelayedTestsParams })

      const allGoodAfter6EmptyTestsParams = {
        slug: '/numbers/all-good-after-6-empty',
        expectedResults: [0, 1, 2, 3, 4, 5],
        exptectedToSucced: 6,
        expectedToFail: 0,
      }
      createTestForIterator({ concurrency: 1, ...allGoodAfter6EmptyTestsParams })
      createTestForIterator({ concurrency: 3, ...allGoodAfter6EmptyTestsParams })
      createTestForIterator({ concurrency: 15, ...allGoodAfter6EmptyTestsParams })
    }
  )
})

afterAll(async () => {
  await stopHttpServer()
})
