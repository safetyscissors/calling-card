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

function main(configs, rows, callback){
  async.waterfall([
    //open document
    function(waterfallCb){
      jimp.read(configs.file, waterfallCb)
    },

    //find lines
    function(rawImg, waterfallCb){
      var letters = readRow(rawImg,rows, configs);
      waterfallCb(null, rawImg, letters);
    },

    //writeOutput
    function(rawImg, letters, waterfallCb){
      if(configs.debugLetters){
        rawImg.write(configs.outputFile);
      }
      waterfallCb(null, letters);
    }

  ],function done(waterfallErr, letters){
    callback(waterfallErr, letters);
  });
};


function readRow(rawImg, rows, config){
  var whiteThreshold = 25;
  var pageLetters=[];
  _.each(rows, function(row){

    //get the whitespaces in a row
    var whiteSpace = [];
    _.each(row, function(slice){
      var isAllWhite=true;
      for(var i = 5;i < slice.height-5;i++){
        var color = rawImg.getPixelColor(slice.x,slice.y+i);
        color = Number(color.toString(16).substr(0,2));
        if(color > whiteThreshold) isAllWhite = false;
      }
      whiteSpace[slice.x] = isAllWhite;

      //color in whitespace 
      if(!isAllWhite) return;
    });

    //split the row by whitespaces that pass the thresholds
    var letters = readWhiteSpaces(row, whiteSpace);
    setLetterWidth(letters);

    if(config.debugLetters){
    _.each(letters, function(letter){
      for(var i=0;i<letter.height;i++){
        rawImg.setPixelColor(jimp.rgbaToInt(0,255,0,255),letter.x,letter.y+i);
      }
    });
    }

    pageLetters.push(letters);
  });
  return pageLetters;
}

function setLetterWidth(letters){
  for(var i=0;i<letters.length-1;i++){
    letters[i].width = letters[i+1].x - letters[i].x;
  }
}

function readWhiteSpaces(row, whiteSpaces){
  var letterStartPos=[];
  var inSpace = false;
  var startSpace = 0;
  var letterGapThreshold = 1;
  var letterSpaceThreshold = 7;

  for(var i = 0;i < whiteSpaces.length;i++){
    if(whiteSpaces[i]){
      if(inSpace){
        //check if its a space and not just a letter gap
        if((i-startSpace) > letterSpaceThreshold){
          inSpace = false;
          var median = startSpace + (i-startSpace)/2;
          letterStartPos.push(letter(median, row[i].y, row[i].height));
        }
        continue;
      }

      //if starting a space, check ahead if its smaller than the letter gap threshold
      if(i+letterGapThreshold < whiteSpaces.length && whiteSpaces[i+letterGapThreshold] === false) continue;

      //if starting a space, log info
      inSpace = true;
      startSpace = i;
    }else{
      if(!inSpace) continue;

      //if closing a space, add midpoint of the space to the letter start positions
      inSpace = false;
      var median = startSpace + (i - startSpace)/2;
      letterStartPos.push(letter(median,row[i].y,row[i].height));
    }
  }

  return letterStartPos
};

function letter(x,y, height){
  return {x:x, y:y, width:1, height:height};
}
