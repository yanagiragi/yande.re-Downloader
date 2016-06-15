var request = require ('request');
var cheerio = require('cheerio');
var fs = require('fs');

var storeindex = "../Storage/Img_N/";
var str = "https://yande.re/";
var exists = new Array();
// refers to yande.re/page=1

checkUpdate();
var interval = setInterval(function() {
	checkUpdate();
}, 1000 * 60 * 5);


function checkUpdate(){
	console.log("Checking Update Info...");
	getPage(str);
}

function getPage(str){
	request(str, function(error,response,body){
		if(!error && response != undefined && response.statusCode == 200){
			getPic(body);
		}
		else{
			fs.appendFile('errorLog.txt', "BIG ERROR\n" + response.statusCode + " : " + str + "\n" + dates + "\n\n", function (err) {
				if(err) console.log("Error when writing errorLog.txt! ");
				clearInterval(interval);
				process.exit();
			});
		}
	});
}

function getPic(body){
	var $ = cheerio.load(body);
	var news = $('#post-list-posts li .directlink').each(function(i,elem){
		
		var filename = elem.attribs.href;
		var l = filename.lastIndexOf('/');
		var storename = filename.substr(l + 1,filename.length);
		
		storeImg(filename,storename);
	});
	//checkUpdate();
	return;
}

function storeImg(filename,storename){
	
	fs.exists(storeindex+storename, function(exists) { 
		if (!exists) { 
			
			console.log("pending " + filename + " ...");
			
			request.get( {url : filename, encoding : 'binary'},
				function(error, response, body){
					if(!error && response.statusCode == 200){
						
						fs.writeFile(storeindex + storename,body,'binary');
						console.log(storename + " has stored.");
						
						var dates = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
						fs.appendFile('savedLog.txt', storename + "\n" + dates + "\n\n", function (err) {
							if(err) console.log("Error when writing savedLog.txt! ");
						});
					}
					else{
						console.log("error on pending " + filename + " , errCode = " + response.statusCode);
						fs.appendFile('errorLog.txt', storename + "\n", function (err) {
							if(err) console.log("Error when writing errorLog.txt! ");
						});
					}
				}
			);
		}
		else {
			return false;
		}
	});
}
