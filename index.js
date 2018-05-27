const { each } = require('async')
const { launch } = require('puppeteer')
const { parse } = require('url')

async function adsurls (keywords) {
  const browser = await launch()
  const urlMap = {}
  async function scan (browser, keyword) {
    const page = await browser.newPage()
    await page.goto('https://google.com', { waitUntil: 'networkidle0' })
    await page.type('lst-ib', keyword)
    await page.keyboard.press('Enter')
    // wait for renavigation ...
    // select all links with "plantl pla-hc-c" ...
    // map them to their hrefs ...
    // either map to host domain address or leave link as it is ...
    // uniquify the array ...
    // store the set of urls in the closed over urlMap ...
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
