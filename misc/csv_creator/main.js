
uts = require('../converters_js/unicode_to_singlish.js')
fmtos = require('../converters_js/fmabaya_to_unicode.js')

var line_no = 0;
var accum_text = "";

startConvertion();

function startConvertion() {    
	console.log('Converting started');
	fs = require('fs')
	fs.readFile('sentences.txt', 'utf8', function (err,data) {
	  if (err) {
	    return console.log(err);
	  }
	 
	  var os = require('os');
	  var lines = data.split(os.EOL);

	  var output_data = "";

	  var i;
	  for (i = 0; i < lines.length; i++) { 
	     var convertedLine = convert(lines[i]) + "\n";
	     output_data += convertedLine;	     
	  }	

	  flushToFile(output_data);
	});
}

function convert(text){
	var unicodeText = fmtos.fmabayaToUnicode(text);
	var outputText  = uts.unicodeToSinglish(unicodeText); 
 	return unicodeText;
}


function writeLine(text){
	var lineToWrite = "0|" + text + "\n";
	accum_text += lineToWrite;
}

function flushToFile(text)
{
	var fs = require('fs');
	fs.writeFileSync("out_put.csv", text);
 	console.log("The file was saved!"); 	
}


