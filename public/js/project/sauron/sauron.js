var util = require('../utilities/math.js'),
    Target = require('../actors/target.js');

// Sauron is alive!
function Sauron(settings) {
  this.matrix = [[1,2],[2,1]];
  // timer: null
  this.armies = [];
  this.tutorial =  {num: 1, show: false, reopen: null, timer: null};
  this.level = settings === {} ? settings.level : -1;
}

// Given a matrix and a pair (x,y) of screen coordinates, convert to math coord and applies LT
// Returns LinearTransformationScreen(x,y) coordinates
Sauron.prototype.applyTransformation = function(sX,sY,matrix){
  var matrix = this.matrix;
  var math_coord = util.screenToMath(sX,sY),
      applied_coord = [matrix[0][0] * math_coord[0] + matrix[0][1] * math_coord[1], matrix[1][0] * math_coord[0] + matrix[1][1] * math_coord[1]];
  return util.mathToScreen(applied_coord[0],applied_coord[1]);
};

// Sauron destroys a vector and creates a new one
Sauron.prototype.updateInputVector = function(d){
  this.removeVector('input');
  d3.select('#input-svg').append('path')
    .attr({
      "stroke": "#31BA29",
      "stroke-width":"8",
      "d": "M 250 250 L"+d.x+" "+d.y+"z",
      "id": 'input-vector'
  });
};

// Sauron takes no pitty on a vector and destroys it.
Sauron.prototype.removeVector = function(type) {
  d3.select('#'+type+'-vector').remove();
};

// Sauron makes a strategic decicision and modifies a vector
Sauron.prototype.updateOutputVector = function(d) {
  var i = util.applyMatrix(d.x, d.y, this.matrix);
  this.removeVector('output');
  d3.select('#output-svg').append('path')
    .attr({
      "stroke": "#92989F",
      "stroke-width":"5",
      "d": "M 250 250 L"+i[0]+" "+i[1]+"z",
      "id": 'output-vector'
  });
};

Sauron.prototype.getArmies = function() {
  return d3.select("#output-svg").selectAll('rect')[0];
};

// After good news from the Palantir Sauron moves forces!
Sauron.prototype.updateTargets = function(d, type) {
  var list = this.getArmies();
  for ( elem in list ) {
    if(list[elem].id === "output-svg" ) {
      continue;
    }

    var id = list[elem].id,
        wraith = d3.select("#"+id);
    
    var width = Number(wraith.attr("width")),
        height = Number(wraith.attr("height")),
        x = Number(wraith.attr("x")) + width / 2,
        y = Number(wraith.attr("y")) + height / 2,
        i = util.applyMatrix(d.x,d.y,this.matrix);

    // collison detection occurs here
    if (util.isClose(i[0], i[1], x, y, width / 2, height / 2)) {
      if (type === "collision") {
        wraith.remove()
        this.updateProgress();
        this.drawBlips(d);
        if( id === "random") {
          this.generateTarget();
        }
      }
      else if (type === "detection") {
        this.tutorialControl(4,1);
      }
    }
  }
};

// Palantir reveals new plans to Sauron
Sauron.prototype.tellSauron = function(event, type) {
  var d = this.convertMouseToCoord(event);
  if (type === "drag") {
    this.updateInputVector(d);
    this.updateOutputVector(d);
    if (!this.tutorial.show || !this.tutorial.reopen) {
      this.updateTargets(d, "detection");
    }
  }
  else if (type === "dbclick") {
    this.updateTargets(d, "collision");
  }
};

Sauron.prototype.convertMouseToCoord = function(event) {
  return {
    x: event[0],
    y: event[1]
  }
};

// Sauron alerts his generals of the new progress
Sauron.prototype.updateProgress = function() {
  var bar = d3.select('#progressbar'),
      scoreBox = d3.select('#score');
      currScore = bar.attr("aria-valuenow");
      if (Number(currScore) >= 100) {
        currScore = 100;
        scoreBox.text("Proceed To Next Level!");
      }
      else {
        currScore = Number(currScore) + 5;
        scoreBox.text(currScore + "% Complete");
      }

      bar.style("width", currScore + "%");
      bar.attr("aria-valuenow", currScore);
};

// The Sauron's army grows larger
// Slightly not optimal
// If matrix is invertible
// Divide by 0 then breaks
Sauron.prototype.generateTarget = function(matrix) {
  var isValidCoordinate = false,
      matrix = this.matrix,
      par = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0],
      newX, newY;

  while (!isValidCoordinate) {
    var point = {
      x: util.getRandom(0, 500),
      y: util.getRandom(0, 500)
    };

    if ( util.isOnScreen(matrix, point)) {
      isValidCoordinate = true;
      var targetSettings = {
        x: point.x,
        y: point.y,
        width: 40,
        height: 40,
        color: "black",
        id: "random"
      };
      var newTarget = new Target(targetSettings);
      newTarget.drawTarget();
    }
  }
};

Sauron.prototype.drawBlips = function(d) {
  d3.select("#input-svg").append("circle")
                          .attr({
                            cx: d.x,
                            cy: d.y,
                            r: 20,
                          })
                          .style({"fill": "url(#tarblip)"});
};

Sauron.prototype.tutorialControl = function(num, time, reclick) {
  sauron = this;
  if ((!this.tutorial.show || !this.tutorial.reopen) && num == this.tutorial.num) {
    if (num == 1) {
      this.tutorial.num++;
      d3.select('#tutorial').attr("data-content", "Click the radar screen to activate the robot arm!");
    };
    if (num === 2) {
      this.tutorial.num++;
      d3.select('#tutorial').attr("data-content", "Click and drag the arm in the radar screen to move the robot's arm!");
    };
    if (num === 3) {
      this.tutorial.num++;
      d3.select('#tutorial').attr("data-content", "Help the robot reach the parts. Move the arm on the input screen so that his arm can pick up the pieces.");
    };
    if (num === 4) {
      this.tutorial.num++;
      d3.select('#tutorial').attr("data-content", "Double click the radar screen to collect the part");
    };
    setTimeout(function() {
        $('#tutorial').popover('show');
        sauron.tutorial.show = true;
        sauron.tutorial.reopen = false;
      }, time);
    if(!reclick) {
      this.setTimer(5000);
      sauron.tutorial.show = false;
      sauron.tutorial.reopen = true;
    }
  }
};

Sauron.prototype.clearTimer = function() {
  clearTimeout(this.tutorial.timer);
};

Sauron.prototype.generateRandomCircleofDeath = function() {

  var validPoints = util.getValidPreImageCircle();

  for( var key in validPoints ) {    
    var pair = validPoints[key],
        screenCoors = util.mathToScreen(pair.x, pair.y, this.matrix);
    
    var targetSetting = {
      x: screenCoors[0],
      y: screenCoors[1],
      width: 40,
      height: 40,
      color: "black",
      id: "circle_"+i
    };
    var newTarget = new Target(targetSetting);
    newTarget.drawTarget();
    i++;
  }
};

//[{x:0,y:0},{x:5*(Math.sqrt(2)/2),y:5*(Math.sqrt(2)/2)},{x:5*Math.sqrt(2),y:5*Math.sqrt(2)},{x:-1*(5*Math.sqrt(2)/2),y:-1*(5*Math.sqrt(2)/2)},{x:-1*(5*Math.sqrt(2)),y:-1*(5*Math.sqrt(2))}];
Sauron.prototype.generateRandomLineofDeath = function() {
  
  var validPoints = util.getValidPreImagePairs(), 
      i = 0;

  for( var key in validPoints ) {    
    var pair = validPoints[key],
        screenCoors = util.mathToScreen(pair.x, pair.y, this.matrix);
    
    var targetSetting = {
      x: screenCoors[0],
      y: screenCoors[1],
      width: 40,
      height: 40,
      color: "black",
      id: "line_"+i
    };
    var newTarget = new Target(targetSetting);
    newTarget.drawTarget();
    i++;
  }
};

Sauron.prototype.drawBlips = function(d) {
      d3.select("#input-svg").append("circle")
                    .attr({
                      cx: d.x,
                      cy: d.y,
                      r: 20,
                    })
                    .style({"fill": "url(#tarblip)"});
};

Sauron.prototype.setTimer = function(time, sauron) {
  this.tutorial.timer = setTimeout(function() {
                            $('#tutorial').popover('hide');
                        }, time);
};

// Sauron is mobilized via Smaug!
module.exports = Sauron;
