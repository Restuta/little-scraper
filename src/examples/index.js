const runScraping = require('./example-obs-scraper')
const Bluebird = require('bluebird')

const { startHttpServer } = require('./fake-http-server')

async function main() {
  await startHttpServer()
  await runScraping()
}

main().catch(console.log)

//
// function *getNextUrl() {
//   let i = 0
//   while(i < 100) {
//   // while(true) {
//     yield `https://example.com/${++i}`
//   }
// }
//
// Promise = Bluebird.Promise
//
// Bluebird.mapSeries(
//   getNextUrl(),
//   (url, index) => Promise.resolve(url).delay(1000).then(console.log),
//   { concurrency: 1}
// )
//
// import { createScraper }
