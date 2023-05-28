import * as fs from 'fs'
import lighthouse from 'lighthouse'
import * as path from 'path'
import * as chromeLauncher from 'chrome-launcher'

const { urls, locale, categories } = JSON.parse(fs.readFileSync('./settings.json', 'utf8'))

const todaysDateInDDMM = new Date().toLocaleDateString(locale, {
  day: '2-digit',
  month: '2-digit',
})

const savePath = `${path.resolve('./')}`

const run = url =>
  new Promise(async (resolve, reject) => {
    let browser
    let runner

    try {
      browser = await chromeLauncher.launch({ chromeFlags: ['--headless'] })
    } catch (error) {
      console.log('Error on launching browser')
      console.error(error)
      reject()
    }

    if (!browser) {
      console.log('Error on launching browser')

      return reject()
    }

    try {
      runner = await lighthouse(url, {
        port: browser.port,
        output: 'html',
        logLevel: 'info',
        onlyCategories: categories,
      })
    } catch (error) {
      console.log('Error on running lighthouse')
      console.error(error)

      reject()
    }

    await browser.kill()

    if (!runner || typeof runner.report !== 'string') {
      console.log('Failed to create Lighthouse report')

      return reject()
    }

    if (!fs.existsSync(`/${savePath}/reports/${todaysDateInDDMM}`)) {
      fs.mkdirSync(`/${savePath}/reports/${todaysDateInDDMM}`)
    }

    const reportHtml = runner.report
    const readableUrl = url.split('//')[1].replace(/\//g, '_')

    fs.writeFileSync(`/${savePath}/reports/${todaysDateInDDMM}/${readableUrl}.html`, reportHtml)

    resolve()
  })

const runAll = async () => {
  for (const url of urls) {
    if (url.isActive) {
      await run(url.url)
    }
  }
}

runAll()
