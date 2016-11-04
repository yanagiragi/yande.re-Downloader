var request = require ('request');
var cheerio = require('cheerio');
var fs = require('fs');
var RateLimiter = require('limiter').RateLimiter;
var limiter = new RateLimiter(1, 4000); // Send Request every 1250ms to avoid errCode 429 (Too Many Requests)

var storeindex = "Storage/";
var str = "https://yande.re/";
var exists = new Array();
// refers to yande.re/page=1

checkUpdate();
/*var interval = setInterval(function() {
	checkUpdate();
}, 1000 * 60 * 5);*/


function checkUpdate(){
	console.log("檢查中...");
	getPage(str);
}

function getPage(str){
	request(str, function(error,response,body){
		if(!error && response != undefined && response.statusCode == 200){
			getPic(body);
		}
		else{
			console.log("無法抓取頁面！");
			process.exit();
			/*fs.appendFile('errorLog.txt', "BIG ERROR\n" + response.statusCode + " : " + str + "\n" + dates + "\n\n", function (err) {
				if(err) console.log("Error when writing errorLog.txt! ");
				//clearInterval(interval);
				
			});*/
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
			
			console.log("抓取 " + filename + " 中...");			
			
			request.get( {url : filename, encoding : 'binary'},
				function(error, response, body){
					if(!error && response.statusCode == 200){						
						fs.writeFile(storeindex + storename,body,'binary');
						
						console.log("> 已存 : " + storename );

						var dates = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
						/*fs.appendFile('savedLog.txt', storename + "\n" + dates + "\n\n", function (err) {
							if(err) console.log("Error when writing savedLog.txt! ");
						});*/
					}
					else{
						console.log("error on pending " + filename + " , errCode = " + response.statusCode);
						/*fs.appendFile('errorLog.txt', storename + "\n", function (err) {
							if(err) console.log("Error when writing errorLog.txt! ");
						});*/
					}
				}
			);
		}
		else {
			return false;
		}
	});
}
