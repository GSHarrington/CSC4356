

var gl;
// setting current shader the program is using, 0 = Regular filter
var currentShader = 0;
var chestZ = 4.0;

var models;
var shaders;
var cxforms;
var postProcessingShaders;
var squareModel; 
var colorTexture;
var depthTexture;

var framebuffer;
//400 seems to make the object in the middle of the screen
var framebufferWidth = 500;
var framebufferHeight = 500;

//made variables for events & constants, trying to make it more modular & easier to update	
// set up the initial state of matrices
var projectionMatrix = new Matrix4();
	projectionMatrix.setPerspective(45, 1, 1, 10);
var viewMatrix = new Matrix4()
	viewMatrix.setTranslate(0, 0, -8);

var vertexSource;
var fragmentSource;


var lightPosition = 
{
	x: 0.0, 
	y: 2.0, 
	z: 5.0
}

var lightColor = 
{
	r: 1.0, 
	g: 1.0, 
	b: 1.0
}
	

function init() {
	var canvas = document.getElementById('webgl');
	gl = getWebGLContext(canvas, false);
	gl.getExtension("WEBGL_depth_texture");

	// text book methods
	document.getElementById('webgl').addEventListener('mousedown', function(event) { mouseDownEvent(event); });
	document.getElementById('webgl').addEventListener('mouseup', function(event) { mouseUpEvent(event); });
	document.getElementById('webgl').addEventListener('mousemove', function(event) { mouseMoveEvent(event); });

	// initialize the objects shaders
	shaders = [new Shader(gl, 'lightingVertexShader',    'lightingFragmentShader')];

	// initialize the post-processing shaders
	postProcessingShaders = [
		new Shader(gl, 'postProcessingVertexShader', 'nothingFragmentShader'),
		new Shader(gl, 'postProcessingVertexShader', 'edgeDetectionFragmentShader'),
		new Shader(gl, 'postProcessingVertexShader', 'thresholdFragmentShader'),
		new Shader(gl, 'postProcessingVertexShader', 'blurFragmentShader')
	];

	// initialize the objects models
	models  = [
		new Model(gl, chest, 'http://i.imgur.com/7thU1gD.jpg')
	];

	// initialize the quad to texture
	squareModel = new Model(gl, square, null);

	// initialize the objects transformations (Placeholder matrix for new calculations)
	cxforms =  [
		new Matrix4()
	];

	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

	// bind the color buffer
	colorTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, colorTexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, framebufferWidth, framebufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

	// set the texture parameters
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,     gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,     gl.CLAMP_TO_EDGE);

	// bind the depth buffer
	depthTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, depthTexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, framebufferWidth, framebufferHeight, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);
	
	// set the texture parameters
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,     gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,     gl.CLAMP_TO_EDGE);

	// switch to the offscreen framebuffer
	framebuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,  gl.TEXTURE_2D, depthTexture, 0);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	canvas.onmousemove = onmousemove;
    canvas.onmouseup = onmouseup;
    canvas.onmousedown = onmousedown;
	// calculate and draw
	Redraw();
}

function draw() {
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	// clear the render scene
	gl.clearColor(1.0, 1.0, 1.0, 0.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);

	// render the model offscreen		
	shaders[0].setup(gl, projectionMatrix, viewMatrix, cxforms[0], models[0].modelTexture);
	models[0].draw(gl, shaders[0]);

	// reset the frame buffer to default
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	// clear the rendering area
	gl.clearColor(1.0, 1.0, 1.0, 0.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);

	// render the offscreen data to the screen
	postProcessingShaders[currentShader].setup(gl, null, null, null);

	// set up the uniform for the framebuffer color information
	var colorTextureLocation = gl.getUniformLocation(postProcessingShaders[currentShader].program, 'colorTexture');
	gl.uniform1i(colorTextureLocation, false, gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, colorTexture);

	// render the textured square
	squareModel.draw(gl, postProcessingShaders[currentShader]);
	gl.bindTexture(gl.TEXTURE_2D, null);
}

// constrains the model rotation parameters and requests a redraw
function Redraw()
{	
	//when switching shaders, the position of the model should not reset
	modelRotation.modelY += mouse.diffX;
	modelRotation.modelX += mouse.diffY;
	//reset the difference afterwards
	mouse.diffX = 0.0;
	mouse.diffY = 0.0;

	// restrict Y rotation to (-180, 180)
	if (modelRotation.modelY > 180) modelRotation.modelY -= 360;
	if (modelRotation.modelY < -180) modelRotation.modelY += 360;

	// restrict X rotation to (-90, 90)
	if (modelRotation.modelX > 90) modelRotation.modelX = 90;
	if (modelRotation.modelX < -90) modelRotation.modelX = -90;
	cxforms[0].setTranslate(0, 0, chestZ).rotate(modelRotation.modelX, 1.0, 0.0, 0.0).rotate(modelRotation.modelY, 0.0, 1.0, 0.0);
	window.requestAnimationFrame(draw);	
}

//Choice selection for fragment shaders: BLUR, EDGE, THRESHOLD, & NONE
//Redraws the image once selected
function handleShaderRadio()
{
	var shaderNoneRadio = document.getElementById('shaderNoneRadio');
	var shaderEdgeDetectionRadio = document.getElementById('shaderEdgeDetectionRadio');
	var shaderThresholdRadio = document.getElementById('shaderThresholdRadio');
	var shaderBlurRadio = document.getElementById('shaderBlurRadio');
	var currentShaderParagraph = document.getElementById('currentShader');
	
	if (shaderNoneRadio.checked) {
		currentShader = 0;
		currentShaderParagraph.innerHTML = 'None';
	}
	else if (shaderEdgeDetectionRadio.checked) {
		currentShader = 1;
		currentShaderParagraph.innerHTML = 'Edge Shader';
	}
	else if (shaderThresholdRadio.checked) {
		currentShader = 2;
		currentShaderParagraph.innerHTML = 'Threshold Shader';
	}
	else if (shaderBlurRadio.checked) {
		currentShader = 3;
		currentShaderParagraph.innerHTML = 'Blur Shader';
	}
	Redraw();
}

//Load Texture
function loadTexture(image, texture) {
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	Redraw();
}	
function Model(glContext, data, texImage) {
	var positionArray = new Float32Array(flatten(data.positions));
	var triangleArray = new  Uint16Array(flatten(data.triangles));
	var normalArray   = new Float32Array(flatten(data.normals));
	var texCoordArray = new Float32Array(flatten(data.texCoords));

	this.positionBuffer = glContext.createBuffer();
	this.triangleBuffer = glContext.createBuffer();
	this.normalBuffer   = glContext.createBuffer();
	this.texCoordBuffer = glContext.createBuffer();

	glContext.bindBuffer(glContext.ARRAY_BUFFER, this.positionBuffer);
	glContext.bufferData(glContext.ARRAY_BUFFER, positionArray, glContext.STATIC_DRAW);

	glContext.bindBuffer(glContext.ARRAY_BUFFER, this.normalBuffer);
	glContext.bufferData(glContext.ARRAY_BUFFER, normalArray, glContext.STATIC_DRAW);

	glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
	glContext.bufferData(glContext.ELEMENT_ARRAY_BUFFER, triangleArray, glContext.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, texCoordArray, gl.STATIC_DRAW);

	this.numTriangles = triangleArray.length;

	this.modelTexture = undefined;
	if (texImage !== null) {
		var modelImage = new Image();
		this.modelTexture = gl.createTexture();
		var that = this;
		modelImage.onload = function() {
			loadTexture(modelImage, that.modelTexture);
		}
		modelImage.crossOrigin = 'anonymous';
		modelImage.src = texImage;
	}
}
Model.prototype.draw = function(glContext, shader) {
	if (shader.vertexPositionLocation != -1) {
		glContext.bindBuffer(glContext.ARRAY_BUFFER, this.positionBuffer);
		glContext.vertexAttribPointer(shader.vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);
		glContext.enableVertexAttribArray(shader.vertexPositionLocation);
	}

	if (shader.vertexNormalLocation != -1) {
		glContext.bindBuffer(glContext.ARRAY_BUFFER, this.normalBuffer);
		glContext.vertexAttribPointer(shader.vertexNormalLocation, 3, gl.FLOAT, false, 0, 0);
		glContext.enableVertexAttribArray(shader.vertexNormalLocation);
	}

	vertexTexCoordLocation = gl.getAttribLocation(shader.program, 'vertexTexCoord');
	if (vertexTexCoordLocation != -1) {
		glContext.bindBuffer(glContext.ARRAY_BUFFER, this.texCoordBuffer);
		glContext.vertexAttribPointer(vertexTexCoordLocation, 2, gl.FLOAT, false, 0, 0);
		glContext.enableVertexAttribArray(vertexTexCoordLocation);
	}

	glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
	gl.drawElements(gl.TRIANGLES, this.numTriangles, glContext.UNSIGNED_SHORT, 0);

	if (shader.vertexPositionLocation != -1) 
		glContext.disableVertexAttribArray(shader.vertexPositionLocation);

	if (shader.vertexNormalLocation != -1) 
		glContext.disableVertexAttribArray(shader.vertexNormalLocation);

	if (vertexTexCoordLocation != -1) 
		glContext.disableVertexAttribArray(vertexTexCoordLocation);
}
	
function Shader(glContext, vertexShaderID, fragmentShaderID) {
	
	vertexSource = document.getElementById(vertexShaderID).text;
	fragmentSource = document.getElementById(fragmentShaderID).text;
	this.program = createProgram(glContext, vertexSource, fragmentSource);
	this.projectionMatrixLocation = glContext.getUniformLocation(this.program, 'projectionMatrix');
	this.viewMatrixLocation = glContext.getUniformLocation(this.program, 'viewMatrix');
	this.modelMatrixLocation = glContext.getUniformLocation(this.program, 'modelMatrix');
	this.vertexPositionLocation = glContext.getAttribLocation(this.program, 'vertexPosition');
	this.vertexNormalLocation = glContext.getAttribLocation(this.program, 'vertexNormal');
	this.textureImageLocation = glContext.getUniformLocation(this.program, 'modelTexture');
	this.lightPositionLocation = glContext.getUniformLocation(this.program, 'lightPosition');
	this.lightColorLocation = glContext.getUniformLocation(this.program, 'lightColor');
}

Shader.prototype.setup = function(glContext, projectionMatrix, viewMatrix, modelMatrix, texImage) {
	glContext.useProgram(this.program);
	if (projectionMatrix === null)
		return;
	glContext.uniformMatrix4fv(this.projectionMatrixLocation, false, projectionMatrix.elements);
	glContext.uniformMatrix4fv(this.viewMatrixLocation, false, viewMatrix.elements);
	glContext.uniformMatrix4fv(this.modelMatrixLocation, false, modelMatrix.elements);
	glContext.bindTexture(glContext.TEXTURE_2D, texImage)
	glContext.uniform1i(this.textureImageLocation, false, gl.TEXTURE0);
	glContext.uniform3f(this.lightColorLocation, lightColor.r, lightColor.g, lightColor.b);
	glContext.uniform3f(this.lightPositionLocation, lightPosition.x, lightPosition.y, lightPosition.z);
}	




//Flatten Function
function flatten(a) 
{ 
	return a.reduce(function(b, v) { b.push.apply(b, v); return b }, []) 
}
var mouse = {
	down: false,
	x: 0, 
	y: 0,
	diffX: 0,
	diffY: 0
};

var modelRotation = 
{
	modelX: 0,
	modelY: 0
};
// book method for mouse event
function mouseDownEvent(event) {
	event.preventDefault();
	if (!mouse.down) {
		mouse.down = true;

		mouse.x = event.clientX;
		mouse.y = event.clientY;

		mouse.diffX = event.clientX - mouse.x;
		mouse.diffY = event.clientY - mouse.y;

		Redraw();
	}
};

// book method for mouse event
function mouseUpEvent(event) {
	event.preventDefault();
	if (mouse.down) {
		mouse.down = false;

		mouse.x = event.clientX;
		mouse.y = event.clientY;

		Redraw();
	}
};
// book method for mouse event
function mouseMoveEvent(event) {
	event.preventDefault();
	if (mouse.down) {
		mouse.diffX = event.clientX - mouse.x;
		mouse.diffY = event.clientY - mouse.y;

		mouse.x = event.clientX;
		mouse.y = event.clientY;

		Redraw();
	}
};
