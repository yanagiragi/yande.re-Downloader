var request = require ('request');
var cheerio = require('cheerio');
var fs = require('fs');
var url = require('urlencode');
var dateFormat = require('dateformat');
var santitize = require('sanitize-filename');
var RateLimiter = require('limiter').RateLimiter;
var limiter = new RateLimiter(1, 4000); // Send Request every 1250ms to avoid errCode 429 (Too Many Requests)
const spawn = require('child_process').spawn;

var storeindex = "Storage/";
var str = "https://yande.re/"; // refers to yande.re/page=1
var nowday = dateFormat(new Date(), "yyyy-mm-dd");

checkUpdate();
var interval = setInterval(function() {
	checkUpdate();
}, 1000 * 60 * 5);


function checkUpdate(){
	//if()
	var day = dateFormat(new Date(), "yyyy-mm-dd");
	if(day.toString() != nowday.toString()){
		
		nowday = day;
		console.log('start compress!');
		
		var s = spawn('node',['compress.js']);
		s.on('close', (code) => {
			console.log('Done Compress with return code ' + code);
			getPage(str);
		});
	}
	else{
		console.log("Check...");
		getPage(str);
	}
}

function getPage(str){
	request(str, function(error,response,body){
		if(!error && response != undefined && response.statusCode == 200){
			getPic(body);
		}
		else{
			console.log("Unable to fetch page");
			process.exit();
		}
	});
}

function getPic(body){
	var $ = cheerio.load(body);
	var news = $('#post-list-posts li .thumb').each(function(i,elem){
		var filename = elem.attribs.href;
		request(str+filename, function(err, res, body){
			if(!err){
				var $ = cheerio.load(body);
				var data = $('.original-file-unchanged');
				
				if(typeof data[0] == "undefined" || typeof data[0].attribs == "undefined")
					data = $('.original-file-changed');
				
				if(typeof data[0] == "undefined")
					return ;

				var filename = data[0].attribs.href;
				var l = filename.lastIndexOf('/');
				var storename = filename.substr(l + 1,filename.length);
					
				limiter.removeTokens(1, function() {
					  	storeImg(filename,storename);
				});
			}
		});
	});
	return;
}

function storeImg(filename,storename){
	
	fs.exists(storeindex+storename, function(exists) { 
		if (!exists) { 
			
			console.log("fetching " + filename + " ...");
			
			request.get( {url : filename, encoding : 'binary'},
				function(error, response, body){
					if(!error && response.statusCode == 200){
						storename = santitize( url.decode(storename) );
						if(storename.length > 100){ 
							// For GNU, tar only support filename length not extend 100
							var extension = storename.substr(storename.length-4);
							console.log(extension);
							storename = storename.substr(0, 96) + extension;
							console.log("Cut original name to :" + storename);
						}
						fs.writeFile(storeindex + storename, body, 'binary');
						console.log("> stored : " + storename );
					}
					else{
						if(typeof response.statusCode != "undefined")
							console.log("error on pending " + filename + " , errCode = " + response.statusCode);
					}
				}
			);
		}
		else {
			return false;
		}
	});
}
