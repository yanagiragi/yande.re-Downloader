var fs = require('fs');
var dateFormat = require('dateformat');
var tar = require('tar');
var fstream = require('fstream');
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;

mv();

function rm(){
	var proc = exec('rm -f *');
	proc.on('close', (code) => {
		console.log(`child process exited with code ${code}`);	
	});
}

function mv(){
	var proc = exec('mv ' + __dirname + '/Storage/*' + ' ' +  __dirname + '/_Compress/temp');
	proc.on('close', (code) => {
		console.log(`child process exited with code ${code}`);
		compress();
	});
}

function compress(){
	
	var day = dateFormat(new Date(), "yyyy-mm-dd");
	var storeindex = __dirname + '/_Compress/temp';
	var tarindex = __dirname + '/_Compress/' + day + '.tar';
	process.chdir(storeindex);

	var dirDest = fs.createWriteStream(tarindex);

	function onError(err) {
		  console.error('An error occurred:', err)
	}
	
	function onEnd() {
		console.log('Packed!')
		rm();
	}
	
	var packer = tar.Pack({ noProprietary: true })
		.on('error', onError)
	    .on('end', onEnd);
		
	// This must be a "directory"
	fstream.Reader({ path: storeindex, type: "Directory" })
	    .on('error', onError)
        .pipe(packer)
        .pipe(dirDest);
}

