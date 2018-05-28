const { each } = require('async')
const { launch } = require('puppeteer')
const { parse } = require('url')
const dealias = require('aka-opts')
const debug = require('debug')('ads-urls')

const NAV_CONF = { waitUntil: 'load', timeout: 1000 }

async function adsurls (keywords, opts) {
  opts = dealias(opts || {}, { onlyHost: [ 'host', 'strip', 'clean' ] })
  opts = Object.assign({ onlyHost: true }, opts)

  const browser = await launch()
  const urlMap = {}

  async function scan (browser, keyword) {
    const page = await browser.newPage()

    // go to google and enter the keyword ...
    await page.goto('https://google.com/'/*, NAV_CONF*/)
    debug('url after 1st nav::', await page.url())
    await page.type('#lst-ib', keyword)

    // wait for renavigation ...
    const renav = page.waitForNavigation(/*NAV_CONF*/)
    await page.keyboard.press('Enter')
    await renav
    debug('url after 2nd nav::', await page.url())

    // select all links with class "plantl pla-hc-c" ...
    // either map hrefs to host domain address or leave link as it is ...
    // uniquify ...
    // store the set of urls in the closed over urlMap ...
    const hrefs = await page.$$eval('.plantl.pla-hc-c', links => {
      // return [ ...new Set(links.map(link => {
      //   return opts.onlyHost ? parse(link.href).host : link.href
      // })) ]
      return links.map(link => link.href)
    })
    
    const adlinks = [ ...new Set(hrefs.map(href => {
      return opts.onlyHost ? parse(href).host : href
    })) ]


    debug('mapped links::', adlinks)
    urlMap[keyword] = adlinks

    await page.close()
    return adlinks
  }

  return new Promise((resolve, reject) => {
    each(keywords, scan.bind(null, browser), async err => {
      await browser.close()
      err ? reject(err) : resolve(urlMap)
    })
  })
}

module.exports = adsurls
