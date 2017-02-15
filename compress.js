var fs = require('fs');
var dateFormat = require('dateformat');
const exec = require('child_process').exec;

mv();

function rm(){
	var proc = exec('rm -f *');
	proc.on('close', (code) => {
		console.log(`rm exited with code ${code}`);
    upload()
	});
}

function mv(){
	var proc = exec('mv ' + __dirname + '/Storage/*' + ' ' +  __dirname + '/_Compress/temp');
	proc.on('close', (code) => {
		console.log(`mv exited with code ${code}`);
		compress();
	});
}

function compress(){
	var day = dateFormat(new Date(), "yyyy-mm-dd");
	var storeindex = __dirname + '/_Compress/temp/';
	var tarindex = __dirname + '/_Compress/' + day + '_yande_re.tar';

	process.chdir(storeindex);

	var proc = exec('tar -cf ' + tarindex + ' *');
	proc.on('close', (code) => {
		console.log(`mv exited with code ${code}`);
    rm()
	});
}

function upload(){
  process.chdir(__dirname)
	var day = dateFormat(new Date(), "yyyy-mm-dd");
	var tarindex = '_Compress/' + day + '_yande_re.tar';

	var proc = exec('node uploadGoogle.js ' + tarindex);
	proc.on('close', (code) => {
		console.log(`upload exited with code ${code}`);
    rmtar()
	});
}

function rmtar(){
	var day = dateFormat(new Date(), "yyyy-mm-dd");
	var tarindex = '_Compress/' + day + '_yande_re.tar';

	var proc = exec('rm -f ' + tarindex);
	proc.on('close', (code) => {
		console.log(`rmtar exited with code ${code}`);
	});
}
