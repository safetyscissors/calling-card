var pageCuts = require('./splitRows');
var splitLetters = require('./splitLetters');
var identifyLetters = require('./identifyLetters');

function main(){
  var configs = {
    file:'docs/Scan0022.jpg',
    outputFile:'test9.jpg',
    debugRows:false,
    debugLetters:false
  }

  pageCuts.main(configs, function(rowErrors, rows){
    if(rowErrors)console.log(rowErrors);
    splitLetters.main(configs, rows, function(letterErrors, letters){
      if(letterErrors)console.log(letterErrors);
      identifyLetters.main(configs, letters, function(readErrors, rawText){

      });
    });

  });
} main();
