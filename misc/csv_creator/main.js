
uts = require('../converters_js/unicode_to_singlish.js')
fmtos = require('../converters_js/fmabaya_to_unicode.js')

startConvertion('sentences.txt', 'out_put.csv');

function startConvertion(input_file_name, output_file_name) {   
	var wave_file_chapter = "001";
	var wave_file_sentence_id = 1;
 
	console.log('Converting started');
	fs = require('fs')
	fs.readFile(input_file_name, 'utf8', function (err,data) {
	  if (err) {
	    return console.log(err);
	  }
	 
	  var os = require('os');
	  var lines = data.split(os.EOL);

	  var output_data = "";

	  var i;
	  for (i = 0; i < lines.length; i++) { 
	     if(lines[i] != ""){
	     	var convertedLine = "SIN" + wave_file_chapter + "-" + generateSentenceID(wave_file_sentence_id, 4) + ".wav|" + convert(lines[i]) + "\n";
	     	output_data += convertedLine;	

	        wave_file_sentence_id++; 
	     }    
	  }	

	  flushToFile(output_data, output_file_name);
	});
}

function replaceAll(target, search, replacement) {
        return target.split(search).join(replacement);
}

function filter(text){
        return replaceAll(text, ".", "");
}

function convert(text){
	var unicodeText = fmtos.fmabayaToUnicode(text);
	var outputText  = uts.unicodeToSinglish(filter(unicodeText)); 
 	return outputText;
}

function flushToFile(text, file_name)
{
	var fs = require('fs');
	fs.writeFileSync(file_name, text);
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


