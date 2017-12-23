const { rnd } = require('./utils/rnd')
const R = require('ramda')

// create extended version of standard error object
const createHttpError = (msg, request, response) => {
  const error = new Error()
  error.message = msg
  error.request = { ...request }
  error.response = { ...response }

  return error
}

const createHttpErrorFromExisting = (request, response, error) => ({
  ...R.clone(error),
  request,
  response,
  // sometimes these props are not cloned, so copying those manually
  message: error.message,
  stack: error.stack,
})

// makes  a request with random user agent property every time to workaround some smart scraper blocking websites
const buildRequestWithRotatingUserAgent = ({
  request,
  successStatusCodes,
  proxyUrl,
  headers
}) => async url => {
  // console.dir(url, { colors: true, depth: 4 })
  const userAgents = [
    'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.1 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36',
    // 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', //google bot
    'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.1',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10; rv:33.0) Gecko/20100101 Firefox/33.0',
    'Mozilla/5.0 (X11; OpenBSD amd64; rv:28.0) Gecko/20100101 Firefox/28.0',
    'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; AS; rv:11.0) like Gecko',
    'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 7.0; InfoPath.3; .NET CLR 3.1.40767; Trident/6.0; en-IN)',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A'
  ]
  const options = {
    url: url,
    headers: {
      'User-Agent': userAgents[rnd(0, userAgents.length - 1)],
      ...headers
      // 'Proxy-Authorization': 'Basic ' + new Buffer('restuta8@gmail.com:<pwd>').toString('base64')
    },
    proxy: proxyUrl
  }

  let response
  try {
    response = await request(url, options)

    if (!successStatusCodes.includes(response.statusCode)) {
      throw createHttpError(
        `${response.body} \n Request status code was "${response.statusCode}", but should be one` +
          ` of [${successStatusCodes}]`,
        options,
        response
      )
    }

    return response
  } catch (err) {
    throw createHttpErrorFromExisting(options, response, err)
  }
}

module.exports = {
  buildRequestWithRotatingUserAgent
}
