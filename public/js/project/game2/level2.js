var Canvas = require('../canvas/canvas.js'),
		Vector = require('../actors/vector.js'),
		Target = require('../actors/target.js'),
		Sauron = require('../sauron/sauron.js'),
		Smaug = require('../smaug/smaug.js'),
		config = require('./config.js'),
		graphics = new Smaug(),
		OverWatcher = new Sauron(config.sauron);

function initLevel2() {
	// Create objects needed for game
	var inputCanvas = new Canvas(config.inputCanvasSettings),
			inputVector = new Vector(config.inputVectorSettings),
			outputVector = new Vector(config.outputVectorSettings),
			outputCanvas = new Canvas(config.outputCanvasSettings);

	// draw grid(s)
	inputCanvas.drawCanvas();
	outputCanvas.drawCanvas();
	outputCanvas.drawProgressBar();

	// draw vector(s)
	inputVector.init();
	outputVector.init();
	graphics.drawRobot(2);

	// generate target(s)
	OverWatcher.generateRandomCircleofDeath(true);
}


// think of this as the main function :)
startLevel2 = function startLevel2() {
	initLevel2();
}
