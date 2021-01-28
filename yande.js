const fs = require('fs')
const path = require('path')
const util = require('util')
const streamPipeline = util.promisify(require('stream').pipeline)

const fetch = require('node-fetch')
const cheerio = require('cheerio')
const dateFormat = require('dateformat')
const sanitize = require('sanitize-filename')
const minimist = require('minimist')

const args = minimist(process.argv.slice(2))

const storeFolder = path.join(__dirname, 'Storage')

if (require.main === module) {
	// setInterval(main, 1000 * 60 * 5)
	main(args)
}

async function main (args) {
	if (!fs.existsSync(storeFolder)) { fs.mkdirSync(storeFolder) }
	
	let url = args.p || 'https://yande.re/'

	const Process = async function(url) {
		const result = await getPage(url)
		result.map(async x => {
			const downloadble = await getPic(x)
			storeImg(downloadble.url, downloadble.filepath)
		})
	}

	if (args.p) {
		if (Array.isArray(args.p)) {
			args.p.map(x => Process(x))
		}
		else {
			Process(url)
		}
	}

	
}

async function getPage (pageUrl) {
	const resp = await fetch(pageUrl)
	const body = await resp.text()
	const $ = cheerio.load(body)
	const news = $('#post-list-posts li .thumb')

	console.log(`Found ${news.length} pics on ${pageUrl}`)

	const result = []

	for (let i = 0; i < news.length; ++i) {
		let href = 'https://yande.re/' + $(news[i]).attr('href')
		result.push(href)
	}

	return result
}

async function getPic (href) {
	const resp = await fetch(href)
	const body = await resp.text()
	const $ = cheerio.load(body)
	const url = $('.original-file-changed').attr('href') || $('.original-file-unchanged').attr('href')
	const l = url.lastIndexOf('/')
	const filepath = url.substr(l + 1, url.length)
	return {
		url, filepath
	}
}

async function storeImg (url, storename) {
	
	let name = sanitize(decodeURIComponent(storename))
	if (name.length > 100) {
		// For GNU, tar only support filename length not extend 100
		const extension = name.substr(name.length - 4)
		name = name.substr(0, 96) + extension
	}

	const storePath = path.join(storeFolder, name)
	
	if (fs.existsSync(storePath)) {
		console.log(`Skipped: ${url}`)
		return
	}

	const resp = await fetch(url)
	if (!resp.ok) throw new Error(`Error When Downloading ${url}`)
	await streamPipeline(await resp.body, fs.createWriteStream(storePath))

	console.log(`Store ${url} as ${storePath}`)
}
