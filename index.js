const { each } = require('async')
const { launch } = require('puppeteer')
const { parse } = require('url')
const dealias = require('aka-opts')

async function adsurls (keywords, opts) {
  opts = dealias(opts || {}, { onlyHost: [ 'host', 'strip', 'clean' ] })
  opts = Object.assign({ onlyHost: true }, opts)
  const browser = await launch()
  const urlMap = {}
  async function scan (browser, keyword) {
    const page = await browser.newPage()
    await page.goto('https://google.com', { waitUntil: 'networkidle0' })
    await page.type('#lst-ib', keyword)
    // wait for renavigation ...
    const renav = page.waitForNavigation({ waitUntil: 'networkidle0' })
    await page.keyboard.press('Enter')
    await renav
    // select all links with class "plantl pla-hc-c" ...
    // either map hrefs to host domain address or leave link as it is ...
    // uniquify ...
    // store the set of urls in the closed over urlMap ...
    urlMap[keyword] = [ ...new Set(
      Array.from(page.$$('.plantl .pla-hc-c'))
        .map(a => opts.onlyHost ? parse(a.href).host : a.href)
    ) ]
    await page.close()
    return null
  }
  return new Promise((resolve, reject) => {
    each(keywords, scan.bind(null, browser), async err => {
      await browser.close()
      err ? reject(err) : resolve(urlMap)
    })
  })
}

module.exports = adsurls
