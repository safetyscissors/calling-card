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

function main(configs, callback){
  async.waterfall([
    //open document
    function(waterfallCb){
      jimp.read(configs.file, waterfallCb)
    },

    //find lines
    function(rawImg, waterfallCb){
      findRows(rawImg, configs, function(findErr, rows){
        waterfallCb(findErr, rawImg, rows);
      });
    },

    //writeOutput
    function(rawImg, rows, waterfallCb){
      if(configs.debugRows){
        rawImg.write(configs.outputFile);
      }
      waterfallCb(null, rows);
    }

  ],function done(waterfallErr, rows){
    callback(waterfallErr, rows);
  });
};

function findRows(rawImg, configs, callback){
  var columns=[];
  for(var i=0;i<rawImg.bitmap.width;i++){
    verticalSliceImage(rawImg,columns,i);
  }
  var rows = horizontalSlice(rawImg,columns, configs.debugRows);
  callback(null, rows);
}

function horizontalSlice(rawImg, columns, debugRows){
  //group columns into 10pixel rows
  var rowStarts = {};
  //go from left to right
  for(var i = 35;i<40;i++){
    var col = columns[i];
    _.each(col, function(value){
      var nearestPixelGroup = Math.floor(value/10);
      //if set, ignore
      if(rowStarts[nearestPixelGroup]) return;
      //otherwise save
      rowStarts[nearestPixelGroup] = value;
    });
  }

  //create lines by row
  var rows = [];
  _.each(rowStarts,function(start, startIndex){
    var row = (makeRowFromStart(35, start, columns));
    if(row) rows.push(row);
  });

  //set the row height
  _.each(rows, function(row,rowIndex){
    if(rowIndex==rows.length-1) return;
    _.each(row, function(slice,sliceIndex){
      if(!rows[rowIndex+1][sliceIndex]) return; 
      slice.height = rows[rowIndex+1][sliceIndex].y - row[sliceIndex].y;
    });
  });

  //display colored rows
  if(debugRows){
  _.each(rows, function(row, rowIndex){ 
    var randColor = Math.floor(255*Math.random());
    _.each(row, function(pos){
      for(var i=0;i<pos.height;i++){
        rawImg.setPixelColor(jimp.rgbaToInt(10*rowIndex,randColor,255,255),pos.x,pos.y+i);
      }
    });
  });
  }

  return rows;
}

function makeRowFromStart(x,y,columns){  
  var row = [];
  var yThreshold = 5;
  var lengthThreshold = 150;

  //draw line from 1 to startX
  for(var i = 0;i < x;i++) row.push(rowNode(i,y,1));
  
  //draw line to next closest x,y
  for(var j = x;j < columns.length;j++){
    _.each(columns[j], function(rowDot){
      var lastDot = row[row.length-1];
      if(Math.abs(rowDot-lastDot.y) < yThreshold) row.push(rowNode(j,rowDot,1));
    });
  }
  
  //omit lines that are too short;
  if(row.length<lengthThreshold) return null;
  
  //connect dots into line
  var newRow = [];
  var oldRowIndex = 0;
  for(var l=0;l<columns.length;l++){
    if(!row[oldRowIndex]) continue;
    
    while(row[oldRowIndex].x < l) oldRowIndex++;
    if(row[oldRowIndex].x==l){
      newRow[l]=(row[l]);
      oldRowIndex++;
      continue;
    }
    //if there is no dot at this x,
    newRow[l] = rowNode(l,newRow[l-2].y,1);
  }
  row = newRow;
  
  //draw line from last position to end of page
  var lastX = row[row.length-1].x;
  var lastY = row[row.length-1].y;
  for(var k=lastX;k<columns.length;k++) row.push(rowNode(k,lastY,1));

  return row;
}

function rowNode(x,y,height){
  return {x:x,y:y,height:height};
}

function verticalSliceImage(rawImg, columns, xPos){
  var height = rawImg.bitmap.height;
  var onLine = false;
  var startOffset = 0;
  columns[xPos] = [];

  for(var i = 0; i < height; i++){
    var color = rawImg.getPixelColor(xPos,i).toString(16);
    color = "000".substring(color.length) + color;

    //exclude bw values
    if(parseInt(color.substring(0,2),16) - parseInt(color.substring(2,4),16) < 10){
      if(onLine){
        var median = Math.floor(startOffset+((i-1)-startOffset)/2);
        //rawImg.setPixelColor(jimp.rgbaToInt(0,255,0,255),xPos,median);
        columns[xPos].push(median);
        onLine=false;
      }
      continue;
    }

    //find median
    if(!onLine){
      startOffset = i;
      onLine = true
    }
  }
}

