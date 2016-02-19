var jimp = require('jimp');
var async = require('async');
var _ = require('underscore');

/* ************************************************ *\
 * exports
\* ************************************************ */
exports.main = main;

/* ************************************************ *\
 * functions 
\* ************************************************ */

function main(configs, letters, callback){
  async.waterfall([
    //open document
    function(waterfallCb){
      jimp.read(configs.file, waterfallCb)
    },

    //find lines
    function(rawImg, waterfallCb){
    	parseLetters(configs, rawImg, letters);
      waterfallCb(null, rawImg);
    },

    //write output
    function(rawImg, waterfallCb){
      rawImg.write(configs.outputFile);
      waterfallCb(null);
    }

  ],function done(waterfallErr){
    callback(waterfallErr);
  });
};

function parseLetters(configs, rawImg, letters){
  var dictionary = [];
  
  dictionary.push(addLetterProfile(rawImg,letters[0][3]));
  dictionary.push(addLetterProfile(rawImg,letters[0][4]));
  dictionary.push(addLetterProfile(rawImg,letters[0][5]));
  dictionary.push(addLetterProfile(rawImg,letters[0][6]));
  dictionary.push(addLetterProfile(rawImg,letters[0][7]));

  _.each(letters, function(letterRow){
  _.each(letterRow, function(letter, letterId){
    var matchId = matchLetterLinear(rawImg, dictionary, letter);
	  if(matchId > -1) paintLetter(rawImg, letter);
    if(matchId > -1) console.log('match',letterId,matchId);
  });
  });

}

function matchLetterLinear(rawImg, dictionary, letter){
  var thresholdMaxDistance = 10;
  var hThreshold = 500;
  var vThreshold = 200;
  var matchId = -1;

  _.each(dictionary, function(dictLetter, dictId){
    //match horizontal
    var vGraph = graphVerticalLetter(rawImg, letter);
    var vDistances=[];
    var hGraph = graphHorizontalLetter(rawImg, letter);
    var hDistances = [];

    for(var j=0;j<vGraph.length;j++){
      var dictDistance = (j<dictLetter.vertical.length)? dictLetter.vertical[j] : 0;
      var vDistance = Math.abs(vGraph[j] - dictDistance);
      vDistances.push(vDistance);
    }

    for(var i=0;i<hGraph.length;i++){
      var hDictDistance = (i<dictLetter.horizontal.length)? dictLetter.horizontal[i] : 0;
      var distance = Math.abs(hGraph[i] - hDictDistance);
      hDistances.push(distance);
    }



    var vAvg = Math.round((vDistances.reduce(function(a,b){return a+b})) / vDistances.length);
    var hAvg = Math.round((hDistances.reduce(function(a,b){return a+b})) / hDistances.length);
    if(vAvg < vThreshold && hAvg < hThreshold){
      vThreshold = vAvg;
      hThreshold = hAvg;
      matchId = dictId;
    }
  });

  return matchId;
}

function addLetterProfile(image, letter){
  return {horizontal:graphHorizontalLetter(image, letter), vertical:graphVerticalLetter(image,letter)};
}

function graphHorizontalLetter(rawImg, letter){
  var graph=[];
  for(var i=0;i<letter.width;i++){
    var distanceToWhite = 0;
    for(var j=0;j<letter.height;j++){
      var pixelColor = rawImg.getPixelColor(letter.x+i, letter.y+j);
      pixelColor = 255 - parseInt(pixelColor.toString(16).substr(0,2), 16);
      distanceToWhite+=pixelColor;
    }
    graph.push(distanceToWhite);
  }
  return graph;
}

function graphVerticalLetter(rawImg,letter){
  var graph = [];
  for(var i=0;i<letter.height;i++){
    var distanceToWhite = 0;
    for(var j=0;j<letter.width;j++){
      var pixelColor = rawImg.getPixelColor(letter.x+j,letter.y+i);
      pixelColor = 255 - parseInt(pixelColor.toString(16).substr(0,2), 16);
      distanceToWhite+=pixelColor
    }
    graph.push(distanceToWhite);
  }
  return graph;
}

function paintLetter(rawImg,letter){
	for(var i=0;i<letter.height;i++){
    rawImg.setPixelColor(jimp.rgbaToInt(0,255,0,255),letter.x,letter.y+i);
    rawImg.setPixelColor(jimp.rgbaToInt(0,255,0,255),letter.x+letter.width,letter.y+i);
  }
  for(var j=0;j<letter.width;j++){
    rawImg.setPixelColor(jimp.rgbaToInt(0,255,0,255),letter.x+j,letter.y);
    rawImg.setPixelColor(jimp.rgbaToInt(0,255,0,255),letter.x+j,letter.y+letter.height);
  }
}
