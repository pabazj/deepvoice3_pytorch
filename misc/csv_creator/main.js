
uts = require('../converters_js/unicode_to_singlish.js')
fmtos = require('../converters_js/fmabaya_to_unicode.js')

var line_no = 0;
var accum_text = "";

startConvertion();

function startConvertion() {    
	console.log('Converting started');
	var lineReader = require('readline').createInterface({
	  input: require('fs').createReadStream('sentences.txt')
	});

	lineReader.on('line', function (line) {
		 var convertedLine = convert(line);
		 console.log('Singlish text -> ' + convertedLine);		 
		 writeLine(convertedLine);
	});

	flushToFile()
}

function convert(text){
	var unicodeText = fmtos.fmabayaToUnicode(text);
	var outputText  = uts.unicodeToSinglish(unicodeText); 
 	return outputText;
}


function writeLine(text){
	var lineToWrite = "0|" + text + "\n";
	accum_text += lineToWrite;
}

function flushToFile(text)
{
	/*	
		fs.writeFile("out_put.csv", lineToWrite, function(err) {
	    	if(err) {
	       	  return console.log(err);
	   	}
		});
	*/	

	var fs = require('fs');
	fs.writeFileSync("out_put.csv", text);
 	console.log("The file was saved!"); 	
}


