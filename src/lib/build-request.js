import request from 'request'
import Bluebird from 'bluebird'

const buildRequest = ({useCookies = true}) => Bluebird.promisify(request.defaults({
  jar: useCookies,
  agentOptions: {
      /*  since iojs 1.3 new TLS cipher defaults have been switched to more secure, e.g. RC4 family is not supported anymore, for web-scraping we still have
          to deal with some legacy web-sites that use insecure ciphers, so overriding defaults to enable RC4 and other back */
    ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:ECDHE-RSA-DES-CBC3-SHA:ECDHE-ECDSA-DES-CBC3-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:AES:DES-CBC3-SHA:HIGH:!aNULL:!eNULL:!EXPORT:DES:RC4:MD5:PSK:aECDH:EDH-DSS-DES-CBC3-SHA:EDH-RSA-DES-CBC3-SHA:KRB5-DES-CBC3-SHA'
  }
}), {multiArgs: false})

export default buildRequest
