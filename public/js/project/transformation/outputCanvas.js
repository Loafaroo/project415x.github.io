/**
 * Output Canvas
 * This is where the output vector is being generated and shown in the DOM
 */

/* Grid */
var drawGridLines = function(num_rectangles_wide, num_rectangles_tall, boundingRect) {
  var width_per_rectangle = boundingRect.width / num_rectangles_wide;
  var height_per_rectangle = boundingRect.height / num_rectangles_tall;
  for (var i = 0; i <= num_rectangles_wide; i++) {
    var xPos = boundingRect.left + i * width_per_rectangle;
    var topPoint = new paper.Point(xPos, boundingRect.top);
    var bottomPoint = new paper.Point(xPos, boundingRect.bottom);
    var aLine = new paper.Path.Line(topPoint, bottomPoint);
    aLine.strokeColor = 'black';

    if (i == num_rectangles_wide / 2) {
      aLine.strokeWidth = 5;
    }
  }
  for (var i = 0; i <= num_rectangles_tall; i++) {
    var yPos = boundingRect.top + i * height_per_rectangle;
    var leftPoint = new paper.Point(boundingRect.left, yPos);
    var rightPoint = new paper.Point(boundingRect.right, yPos);
    var aLine = new paper.Path.Line(leftPoint, rightPoint);
    aLine.strokeColor = 'black';

    if (i == num_rectangles_tall / 2) {
      aLine.strokeWidth = 5;
    }
  }
}

drawGridLines(20, 20, paper.view.bounds);

/* Vector */
var values = {
  fixLength: false,
  fixAngle: false,
  showCircle: false,
  showAngleLength: false,
  showCoordinates: false
};

var vectorStart, vector, vectorPrevious;
var vectorItem, items, dashedItems;

function processVector(event, drag) {
  vector = event.point - vectorStart;
  if (vectorPrevious) {
    if (values.fixLength && values.fixAngle) {
      vector = vectorPrevious;
    } else if (values.fixLength) {
      vector.length = vectorPrevious.length;
    } else if (values.fixAngle) {
      vector = vector.project(vectorPrevious);
    }
  }
  drawVector(drag);
}

function drawVector(drag) {

  console.log(drag);

  if (items) {
    for (var i = 0, l = items.length; i < l; i++) {
      items[i].remove();
    }
  }
  if (vectorItem)
    vectorItem.remove();
  items = [];
  var arrowVector = vector.normalize(10);
  var end = vectorStart + vector;
  vectorItem = new Group([
    new Path([vectorStart, end]),
    new Path([
      end + arrowVector.rotate(135),
      end,
      end + arrowVector.rotate(-135)
    ])
  ]);
  vectorItem.strokeWidth = 5;
  vectorItem.strokeColor = '#e4141b';

  // Display:
  dashedItems = [];

  // Draw Circle
  if (values.showCircle) {
    dashedItems.push(new Path.Circle({
      center: vectorStart,
      radius: vector.length
    }));
  }
  // Draw Labels
  if (values.showAngleLength) {
    drawAngle(vectorStart, vector, !drag);
    if (!drag)
      drawLength(vectorStart, end, vector.angle < 0 ? -1 : 1, true);
  }
  var quadrant = vector.quadrant;
  if (values.showCoordinates && !drag) {
    drawLength(vectorStart, vectorStart + [vector.x, 0], [1, 3].indexOf(quadrant) != -1 ? -1 : 1, true, vector.x, 'x: ');
    drawLength(vectorStart, vectorStart + [0, vector.y], [1, 3].indexOf(quadrant) != -1 ? 1 : -1, true, vector.y, 'y: ');
  }
  for (var i = 0, l = dashedItems.length; i < l; i++) {
    var item = dashedItems[i];
    item.strokeColor = 'black';
    item.dashArray = [1, 2];
    items.push(item);
  }
  // Update palette
  values.x = vector.x;
  values.y = vector.y;
  values.length = vector.length;
  values.angle = vector.angle;
}

function drawAngle(center, vector, label) {
  var radius = 25,
    threshold = 10;
  if (vector.length < radius + threshold || Math.abs(vector.angle) < 15)
    return;
  var from = new Point(radius, 0);
  var through = from.rotate(vector.angle / 2);
  var to = from.rotate(vector.angle);
  var end = center + to;
  dashedItems.push(new Path.Line(center,
    center + new Point(radius + threshold, 0)));
  dashedItems.push(new Path.Arc(center + from, center + through, end));
  var arrowVector = to.normalize(7.5).rotate(vector.angle < 0 ? -90 : 90);
  dashedItems.push(new Path([
    end + arrowVector.rotate(135),
    end,
    end + arrowVector.rotate(-135)
  ]));
  if (label) {
    // Angle Label
    var text = new PointText(center + through.normalize(radius + 10) + new Point(0, 3));
    text.content = Math.floor(vector.angle * 100) / 100 + '°';
    text.fillColor = 'black';
    items.push(text);
  }
}

function drawLength(from, to, sign, label, value, prefix) {
  var lengthSize = 5;
  if ((to - from).length < lengthSize * 4)
    return;
  var vector = to - from;
  var awayVector = vector.normalize(lengthSize).rotate(90 * sign);
  var upVector = vector.normalize(lengthSize).rotate(45 * sign);
  var downVector = upVector.rotate(-90 * sign);
  var lengthVector = vector.normalize(
    vector.length / 2 - lengthSize * Math.sqrt(2));
  var line = new Path();
  line.add(from + awayVector);
  line.lineBy(upVector);
  line.lineBy(lengthVector);
  line.lineBy(upVector);
  var middle = line.lastSegment.point;
  line.lineBy(downVector);
  line.lineBy(lengthVector);
  line.lineBy(downVector);
  dashedItems.push(line);
  if (label) {
    // Length Label
    var textAngle = Math.abs(vector.angle) > 90 ? textAngle = 180 + vector.angle : vector.angle;
    // Label needs to move away by different amounts based on the
    // vector's quadrant:
    var away = (sign >= 0 ? [1, 4] : [2, 3]).indexOf(vector.quadrant) != -1 ? 8 : 0;
    value = value || vector.length;
    var text = new PointText({
      point: middle + awayVector.normalize(away + lengthSize),
      content: (prefix || '') + Math.floor(value * 1000) / 1000,
      fillColor: 'black',
      justification: 'center'
    });
    text.rotate(textAngle);
    items.push(text);
  }
}

var dashItem;

// Convert Screen Coordinates to Math Coordinates
function convertToMathCoords(x, y) {
  var newX = (x - 250)/25;
  var newY = -(y - 250)/25;

  return [newX, newY];
}

// Convert the Math Coordinates back to Screen Coordinates
function convertToScreenCoords(x, y) {
  var newX = 25*x + 250;
  var newY = -25*y + 250;

  return [newX, newY];
}

// Apply Matrix
function applyMatrix(x, y, matrix) {
  var matrixApplied = [matrix[0][0]*x + matrix[0][1]*y, matrix[1][0]*x + matrix[1][1]*y];
  return matrixApplied;
}

function onMouseDown(event) {
  console.log(input);

  fro = new Point(250, 250);

  /* Same as input */
  // to = new Point(250 + input.x, 250 + input.y);

  /* New Formula  */
  var mathCoords = convertToMathCoords(250 + input.x, 250 + input.y);
  var matrixApplied = applyMatrix(mathCoords[0], mathCoords[1], matrix);
  var screenCoords = convertToScreenCoords(matrixApplied[0], matrixApplied[1]);
  to = new Point(screenCoords[0], screenCoords[1]);

  straightLine = to - fro;

  var arrowVector = straightLine.normalize(10);

  if (vectorItem)
    vectorItem.remove();

  // Draw New Vector
  vectorItem = new Group([
    new Path([{
      x: 250,
      y: 250
    }, {
      /* Same as input */
      // x: 250 + input.x,
      // y: 250 + input.y

      /* New Formula */
      x: screenCoords[0],
      y: screenCoords[1]
    }]),

    // Arrows
    new Path([
      to + arrowVector.rotate(135),
      to,
      to + arrowVector.rotate(-135)
    ])
  ]);

  vectorItem.strokeColor = 'red';
  vectorItem.strokeWidth = 5;

  console.log(straightLine);
}