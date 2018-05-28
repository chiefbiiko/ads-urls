const { each } = require('async')
const { launch } = require('puppeteer')
const { parse } = require('url')
const dealias = require('aka-opts')
const debug = require('debug')('ads-urls')

const AKA_CONF = { onlyHost: [ 'host' ], uniquify: [ 'uniq', 'unique' ] }
const NAV_CONF = { waitUntil: 'networkidle0', timeout: 1000 }

async function adsurls (keywords, opts) {
  opts = dealias(opts || {}, AKA_CONF)
  opts = Object.assign({ onlyHost: false, uniquify: false }, opts)

  const browser = await launch()
  const urlMap = {}

  // async iteratee
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

    // mine links with classes "plantl pla-hc-c" ...
    const hrefs = await page.$$eval('a.plantl.pla-hc-c', as => {
      return as.map(a => a.href)
    })
    const mapds = hrefs.map(href => (opts.onlyHost ? parse(href).host : href))
    const links = opts.uniquify ? [ ...new Set(mapds) ] : mapds

    debug('mined links::', links)
    urlMap[keyword] = links

    await page.close()
    return links
  }

  // async iteration promise
  return new Promise((resolve, reject) => {
    each(keywords, scan.bind(null, browser), async err => {
      await browser.close()
      err ? reject(err) : resolve(urlMap)
    })
  })
}

module.exports = adsurls
