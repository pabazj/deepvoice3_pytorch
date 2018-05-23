
uts = require('../converters_js/unicode_to_singlish.js')
fmtos = require('../converters_js/fmabaya_to_unicode.js')

var line_no = 0;
var accum_text = "";

startConvertion();

function startConvertion() {   
	var wave_file_chapter = "001";
	var wave_file_sentence_id = 1;
 
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
	     if(lines[i] != ""){
	     	var convertedLine = "SIN" + wave_file_chapter + "-" + generateSentenceID(wave_file_sentence_id, 4) + "|" + convert(lines[i]) + "\n";
	     	output_data += convertedLine;	

	        wave_file_sentence_id++; 
	     }    
	  }	

	  flushToFile(output_data);
	});
}

function convert(text){
	var unicodeText = fmtos.fmabayaToUnicode(text);
	var outputText  = uts.unicodeToSinglish(unicodeText); 
 	return outputText;
}

function flushToFile(text)
{
	var fs = require('fs');
	fs.writeFileSync("out_put.csv", text);
 	console.log("The file was saved!"); 	
}

function generateSentenceID(number, noSize){
	var prefix = "";
	var noOfZeros = 0;	

	for (i = 1; i < noSize; i++){
	     if(number < Math.pow(10, i)){
		noOfZeros = noSize - i;	         
		break;
	     }
	}	

	for (i = 0; i < noOfZeros; i++){
	    prefix += "0";
	}   

	return prefix + String(number);
}


