const fs = require('fs')
const request = require('request')
const cheerio = require('cheerio')
const dateFormat = require('dateformat')
const sanitize = require('sanitize-filename')
const spawn = require('child_process').spawn

const storePath = 'Storage/'
const compressPath = '_Compress/'
const indexPageUrl = 'https://yande.re/' // refers to yande.re/page=1

var nowday = dateFormat(new Date(), 'yyyy-mm-dd')

if (require.main === module) {
	setInterval(main, 1000 * 60 * 5)
	main()
}

function main () {
	if (!fs.existsSync(storePath)) { fs.mkdirSync(storePath) }
	if (!fs.existsSync(compressPath)) { fs.mkdirSync(compressPath) }
	if (!fs.existsSync(`${compressPath}/temp/`)) { fs.mkdirSync(`${compressPath}/temp/`) }

	checkUpdate().then(() => {
		getPage().then(result => {
			let filteredResult = result.filter(e => e.indexOf('Skipped') === -1)
			console.log(`    > Results: ${filteredResult}`)
		})
	})
}

function checkUpdate () {
	return new Promise((resolve, reject) => {
		console.log(`Check: ${new Date()}`)

		let day = dateFormat(new Date(), 'yyyy-mm-dd')

		if (day.toString() !== nowday.toString()) {
			nowday = day
			console.log('    > Mode: Compress')

			var s = spawn('/home/ragi/.nvm/versions/node/v8.0.0/bin/node', ['compress.js'])
			s.on('close', (code) => {
				console.log('    > Done Compress with return code ' + code)
				resolve()
			})
		} else {
			console.log('    > Mode: Fetch')
			resolve()
		}
	})
}

function getPage () {
	return new Promise((resolve, reject) => {
		request(indexPageUrl, function (error, response, body) {
			if (!error) {
				let $ = cheerio.load(body)
				let news = $('#post-list-posts li .thumb')

				console.log(`    > Found ${news.length} pics`)

				let tasks = []

				for (let i = 0; i < news.length; ++i) {
					let href = indexPageUrl + news[i].attribs.href
					tasks.push(getPic(href))
				}

				Promise.all(tasks).then(result => resolve(result))
			} else {
				resolve([`Unable to fetch ${indexPageUrl}`])
			}
		})
	})
}

function getPic (href) {
	return new Promise((resolve, reject) => {
		request(href, (err, res, body) => {
			if (!err) {
				let $ = cheerio.load(body)
				let data = $('.original-file-unchanged')

				if (typeof data[0] === 'undefined' || typeof data[0].attribs === 'undefined') { data = $('.original-file-changed') }

				if (typeof data[0] !== 'undefined') {
					let href = data[0].attribs.href
					let l = href.lastIndexOf('/')
					let storename = href.substr(l + 1, href.length)
					resolve(storeImg(href, storename))
				} else {
					resolve(`Error: getPic(${href}).parse`)
				}
			} else {
				resolve(`Error: getPic(${href}).request`)
			}
		})
	})
}

function storeImg (filename, storename) {
	return new Promise((resolve, reject) => {
		let path = `${storePath}${storename}`
		if (fs.existsSync(path)) {
			request.get({ url: filename, encoding: 'binary' }, (error, response, body) => {
				if (!error) {
					storename = sanitize(decodeURIComponent(storename))
					if (storename.length > 100) {
						// For GNU, tar only support filename length not extend 100
						var extension = storename.substr(storename.length - 4)
						storename = storename.substr(0, 96) + extension
						// console.log("Cut original name to :" + storename);
					}
					fs.writeFileSync(storePath + storename, body, 'binary')
					resolve('Stored: ' + storename)
				} else {
					resolve(`Error[${(typeof response !== 'undefined') ? response.statusCode : 'undefined'}]: ${filename}`)
				}
			})
		} else {
			resolve(`Skipped: ${filename}`)
		}
	})
}
