var jimp = require('jimp');
var async = require('async');
var _ = require('underscore');

function main(){
  var fname='docs/Scan-right-clean';
  jimp.read(fname+'.jpg', function(readErr, rawImg){
    findRows(rawImg, function(){
      console.log('done');
      rawImg.write('test5.jpg');
    });
  });

  //greyOut('Scan0020', function(){ console.log('done')});
}; main();

function greyOut(fname, callback){
  jimp.read(fname+'.jpg', function(readErr, rawImg){
    if(readErr) return readErr;
    rawImg.grayscale().write(fname+'-bw.jpg');
    callback();
  });
}

function findRows(rawImg, callback){
  var interval=2;
  var slices=Array(Math.floor(rawImg.bitmap.width/interval));
  var grid=[];
  async.forEachOf(slices, function(value, index, eachCb){
    var xPos=index*2;
    readColumn(rawImg, xPos, grid, eachCb);
  }, function(eachErr){
    if(eachErr) callback(eachErr);
    drawRowLine(rawImg, grid, interval);
    callback();
  });
}


function drawRowLine(rawImg, grid, interval){
  var startThreshold=30;
  var startPositions=[];
  var nextDotYThreshold=3;
  var nextDotXThreshold=15;

  //for each x position
  for(var i=0;i<startThreshold;i++){
    var rowSpaces=grid[i*interval];
    //for each y position
    for(var j=0;j<rowSpaces.length;j++){
      
      //group by 10 pixel bands.
      var band=Math.floor(rowSpaces[j]/10);
      if(startPositions[band]) continue;
      //if theres nothing in this band yet, go for it.
      startPositions[band]={x:i*interval,y:rowSpaces[j]};
    }
  }

  var rows=[];
  _.each(startPositions, function(startPos){
    if(!startPos) return;
    rows.push([startPos]);
  });

  _.each(grid,function(gridYList,gridX){
    _.each(gridYList, function(gridY){
      var avgDot=0;
      _.each(rows, function(row){
        avgDot=row[0].y;
        var previousDot=row[row.length-1];
        if(row.length>1){
          var ys=_.pluck(row,'y');
          avgDot=_.reduce(ys,function(a,b){return a+b})/ys.length;
          avgDot=(avgDot+2*previousDot.y)/3
        }
        if(Math.abs(gridY-previousDot.y)<=nextDotYThreshold){
     //     if(Math.abs(gridX-previousDot.x)<=nextDotXThreshold){
            row.push({x:gridX,y:gridY});
      //    }
        }
      });
    });
  });

  _.each(rows,function(row){
    _.each(row, function(dot){
      rawImg.setPixelColor(jimp.rgbaToInt(0,255,0,255),dot.x,dot.y);
    });
  });

  connectTheDotsGreedy(rawImg,rows);
}

function connectTheDotsGreedy(rawImg,rows){
  _.each(rows, function(row){
    //if(row.length<40) return;
    console.log(row.length);
    var currentY=0;
    _.each(row,function(dot,dotIndex){
      if(dotIndex==0) return currentY=dot.y;
      var previousDot=row[dotIndex-1];

      for(var i=previousDot.x;i<dot.x;i++){
        while(currentY<dot.y){
          rawImg.setPixelColor(jimp.rgbaToInt(0,0,255,255),i,currentY);
          currentY++;
        }
        while(currentY>dot.y){
          rawImg.setPixelColor(jimp.rgbaToInt(0,0,255,255),i,currentY);
          currentY--;
        }
        rawImg.setPixelColor(jimp.rgbaToInt(0,0,255,255),i,currentY);
      }
    });
  });
}

function readColumn(rawImg, xPos, grid, callback){
  var width=rawImg.bitmap.width;
  var height=rawImg.bitmap.height;
  var values = [];
  for(var i=0;i<height;i++){
    var hexColor=padColorStringWithZeroes((rawImg.getPixelColor(xPos,i)).toString(16));
    var distance=(255-parseInt(hexColor.substring(0,2),16));

    if(distance<20) distance=0; //~10%
    values.push(distance);
  }
  grid[xPos]=plotColumnMedians(rawImg, values, xPos);
  callback();
}

function padColorStringWithZeroes(str){
  var padded = "000000".substring(str.length) + str;
  return padded;
}

function plotColumnMedians(rawImg, values, xPos){
  var isSignificantGap = 5;
  var gapSize = 0;
  var medians = [];

  for(var i=0;i<values.length;i++){
    //check if we're in a gap
    if(values[i]===0){
      isSignificantGap--;
      gapSize++;
    }
    //end of gap
    else{
      //if the gap is significant do something
      if(isSignificantGap<=0){
        var medianDistance=i-Math.round(gapSize/2);
        medians.push(medianDistance);
        rawImg.setPixelColor(jimp.rgbaToInt(0,255,0,255) ,xPos, medianDistance);
      }
      
      //reset
      gapSize=0;
      isSignificantGap=5;
    }
  }
  return medians;
}
