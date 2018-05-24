
uts = require('../converters_js/unicode_to_singlish.js')
fmtos = require('../converters_js/fmabaya_to_unicode.js')

function replaceAll(target, search, replacement) {
    return target.split(search).join(replacement);
}

function filterUnicode(text){
    return text.replace(/[\u{0080}-\u{FFFF}]/gu,"");
}

function filterFullStops(text){
    return replaceAll(text, ".", "");
}

function convert(text){
	var unicodeText = fmtos.fmabayaToUnicode(text);
	var outputText  = filterUnicode(uts.unicodeToSinglish(filterFullStops(unicodeText))); 
 	return outputText;
}

function cleanFMAbaya(text){
	var regex = new RegExp("^{[0-9]*}.", "g");
	var replaced = text.search(regex);
	return retText;
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

function flushToFile(text, file_name)
{
	var fs = require('fs');
	fs.writeFileSync(file_name, text);
	console.log('Files saved ->' + file_name);
}

//convertFile("002");
//convertFile("006");
convertFile("013");
//cleanFMAbaya("111abc");

function convertFile(chapterID) {   
	var source_data_dir			= "input_files/";
	var destination_data_dir	= "output_files/";
	var input_file_name 		= source_data_dir + chapterID + ".txt";
	var output_file_name		= destination_data_dir + chapterID + ".csv"

	console.log('Converting file ->' + input_file_name);
	fs = require('fs');
	fs.readFile(input_file_name, 'utf8', function (err,data) {
			if (err) {
				return console.log(err);
			}
			
			var os = require('os');
			var lines = data.split("\n");

			var output_data = "";	  	
			var sentence_id = 1;
		
			for (var i = 0; i < lines.length; i++) { 
				if(lines[i] != ""){
					var convertedLine = convert(lines[i]);
					var outputLine = "SIN" + chapterID + "-" + generateSentenceID(sentence_id, 4) + "|" + convertedLine + "|" + convertedLine + "\n";
					output_data += outputLine;	

					sentence_id++; 
				}    
			}	

			flushToFile(output_data, output_file_name);
	});
}



