const { each } = require('async')
const { launch } = require('puppeteer')
const { parse } = require('url')
const dealias = require('aka-opts')
const debug = require('debug')('ads-urls')

const NAV_CONF = { waitUntil: 'networkidle0', timeout: 2000 }

async function adsurls (keywords, opts) {
  opts = dealias(opts || {}, { onlyHost: [ 'host', 'strip', 'clean' ] })
  opts = Object.assign({ onlyHost: true }, opts)
  const browser = await launch()
  const urlMap = {}
  async function scan (browser, keyword) {
    const page = await browser.newPage()
    await page.goto('https://google.com', NAV_CONF)
    await page.type('#lst-ib', keyword)
    // wait for renavigation ...
    const renav = page.waitForNavigation(NAV_CONF)
    await page.keyboard.press('Enter')
    await renav
    debug('url after renav::', await page.url())
    // select all links with class "plantl pla-hc-c" ...
    // either map hrefs to host domain address or leave link as it is ...
    // uniquify ...
    // store the set of urls in the closed over urlMap ...
    urlMap[keyword] = await page.$$eval('.plantl.pla-hc-c', links => {
      return [ ...new Set(links.map(link => {
        return opts.onlyHost ? parse(link.href).host : link.href
      })) ]
    })
    debug('mapped links::', urlMap[keyword])
    await page.close()
  }
  return new Promise((resolve, reject) => {
    each(keywords, scan.bind(null, browser), async err => {
      await browser.close()
      if (err) console.error(err)
      err ? reject(err) : resolve(urlMap)
    })
  })
  // var p = Promise.all()
}

module.exports = adsurls
