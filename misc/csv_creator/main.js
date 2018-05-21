
uts = require('../converters_js/unicode_to_singlish.js')
fmtos = require('../converters_js/fmabaya_to_unicode.js')

startConvertion();

function startConvertion() {    
	console.log('Converting started');
	var inputText = "wkafkdkH";

	var unicodeText = fmtos.fmabayaToUnicode(inputText);
	var outputText  = uts.unicodeToSinglish(unicodeText);      

	console.log(unicodeText + "\n");
	console.log(outputText + "\n");
}
