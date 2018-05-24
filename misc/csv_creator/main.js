
uts = require('../converters_js/unicode_to_singlish.js')
fmtos = require('../converters_js/fmabaya_to_unicode.js')

convertChapter("001");

function convertChapter(chapterID) {   
	var source_data_dir			= "input_files/";
	var destination_data_dir	= "output_files/";
	var input_file_name 		= source_data_dir + chapterID + ".txt";
	var output_file_name		= destination_data_dir + chapterID + ".csv"

	console.log('Converting started');
	fs = require('fs');
	fs.readFile(input_file_name, 'utf8', function (err,data) {
			if (err) {
				return console.log(err);
			}
			
			var os = require('os');
			var lines = data.split(os.EOL);

			var output_data = "";	  	
			var sentence_id = 1;
			
			for (var i = 0; i < lines.length; i++) { 
				if(lines[i] != ""){
				var convertedLine = "SIN" + chapterID + "-" + generateSentenceID(sentence_id, 4) + "|" + convert(lines[i]) + "\n";
				output_data += convertedLine;	

				sentence_id++; 
				}    
			}	

			flushToFile(output_data, output_file_name);
	});
}

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


