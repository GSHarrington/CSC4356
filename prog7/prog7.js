/*Gaelan Harrington
    @gharr28@lsu.edu
    CSC 4356 | ICG
    Project 7 : Final*/

// Variables | Interaction
var canvas;
var gl;
var modelRotationX = 0;
var modelRotationY = 0;
var dragging = false;
var lastClientX;
var lastClientY;

//Interaction & Flatten
function onmousedown(event){dragging = true;lastClientX = event.clientX;lastClientY = event.clientY;}
function onmouseup(event){dragging = false;}
function onmousemove(event){if (dragging == true){dX = event.clientX - lastClientX;dY = event.clientY - lastClientY;modelRotationY = modelRotationY + dX;modelRotationX = modelRotationX + dY;}if (modelRotationX > 90.0){modelRotationX = 90.0;}if (modelRotationX < -90.0){modelRotationX = -90.0;}else{requestAnimationFrame(draw);}lastClientX = event.clientX;lastClientY = event.clientY;}
function flatten(a) { return a.reduce(function (b, v) { b.push.apply(b, v); return b }, [])}
function slider() {
	 //Slider | Assignments
 x = parseFloat(document.getElementById("xInput").value);
 y = parseFloat(document.getElementById("yInput").value);
 z = parseFloat(document.getElementById("zInput").value);
 document.getElementById("xOutput").innerHTML = x;
 document.getElementById("yOutput").innerHTML = y;
 document.getElementById("zOutput").innerHTML = z;
 requestAnimationFrame(draw);
 }
 function Radio() {
 	//Radio | Assignments
	 var None = document.getElementById('None');
	 var Edge = document.getElementById('Edge');
	 var Thresh = document.getElementById('Thresh');
	 var Blur = document.getElementById('Blur');
	 var Mirror = document.getElementById('Mirror');
	 var Choco = document.getElementById("Choco");
	 var currentShaderParagraph = document.getElementById('currentShader');
	 if (None.checked) {
		 currentShaderParagraph.innerHTML = 'No Effect';
		 currentShader = 0;
	 }
	 else if (Edge.checked) {
		currentShaderParagraph.innerHTML = 'Edge Dection Effect';
		 currentShader = 1;
	 }
	 else if (Thresh.checked) {
	 	currentShaderParagraph.innerHTML = 'Threshold Effect';
		 currentShader = 2;
	 }
	 else if (Blur.checked) {
		 currentShaderParagraph.innerHTML = 'Blur Effect';
		 currentShader = 3;
	 }
	 else if (Mirror.checked) {
		 currentShaderParagraph.innerHTML = 'Mirror Effect';
		 currentShader = 4;
	}
	  else if (Choco.checked) {
		 currentShaderParagraph.innerHTML = 'Choco Effect';
		 currentShader = 5;
	 }
	  requestAnimationFrame(draw);
 }
 // Variables | Rendering
var chestModel;
var chestShader;
var squareModel;
var doNothingShader;
var blurShader;
var edgeShader;
var mirrorShader;
var chocoShader;
var x = 0;
var y = 1;
var z = 1;
var framebuffer;
var framebufferWidth = 600;
var framebufferHeight = 600;
var colorTexture;
var depthTexture;
var currentShader = 0;

function init() {
	//Create WebGL context so it can maintain our GPU memory state.
 	canvas = document.getElementById('webgl');
  	gl = getWebGLContext(canvas, false);
	gl.getExtension("WEBGL_depth_texture");
	//Configure Render with vertex & fragment source strings.
	chestModel = new Model(chest);
	squareModel = new Model(square);
	chestShader = new Shader('chestvertexShader', 'chestfragmentShader');
	doNothingShader = new Shader('postProcessingVertexShader', 'nothingFragmentShader');
	blurShader = new Shader('postProcessingVertexShader', 'blurFragmentShader');
	edgeShader = new Shader('postProcessingVertexShader', 'edgeDetectionFragmentShader');
	threshShader = new Shader('postProcessingVertexShader', 'thresholdFragmentShader');
	mirrorShader = new Shader('mirrorVertexShader','mirrorFragmentShader');
	chocoShader = new Shader('lightVertexShader','lightFragmentShader');
	  //Image | Flip
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	//Create | Texture
	modelTexture = gl.createTexture();
	modelImage = new Image();
	 //Load | Texture File
		modelImage.onload = function() {

			loadTexture(modelImage, modelTexture);
		}
		modelImage.crossOrigin = "anonymous";
		modelImage.src = "http://i.imgur.com/XeGFzW8.png";/*http://i.imgur.com/7thU1gD.jpg --http://i.imgur.com/QnD9zzL.png -tron- http://i.imgur.com/HghlWTy.png*/
	colorTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, colorTexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, framebufferWidth, framebufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,     gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,     gl.CLAMP_TO_EDGE);

	depthTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, depthTexture);

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, framebufferWidth, framebufferHeight, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,     gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,     gl.CLAMP_TO_EDGE);

	framebuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,  gl.TEXTURE_2D, depthTexture, 0);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	//Interaction | Movement
	canvas.onmousedown = onmousedown;
  	canvas.onmouseup = onmouseup;
  	canvas.onmousemove = onmousemove;
  	//Request the GPU to create our data.
  	requestAnimationFrame(draw);
  }


function Shader(vertexShaderId, fragmentShaderId) {
	this.vertexSource = document.getElementById(vertexShaderId).text;
	this.fragmentSource = document.getElementById(fragmentShaderId).text;
	this.program = createProgram(gl, this.vertexSource, this.fragmentSource);
	gl.useProgram(this.program);
	this.projectionMatrixLocation = gl.getUniformLocation(this.program, "projectionMatrix");
	this.viewMatrixLocation = gl.getUniformLocation(this.program, "viewMatrix");
	this.modelMatrixLocation = gl.getUniformLocation(this.program, "modelMatrix");
	this.vertexPositionLocation = gl.getAttribLocation(this.program, "vertexPosition");
	this.vertexNormalLocation = gl.getAttribLocation(this.program, "vertexNormal");
	this.vertexTexCoordLocation = gl.getAttribLocation(this.program, "vertexTexCoord");
  	this.diffuseColorLocation = gl.getUniformLocation(this.program, "diffuseColor");
	this.specularColorLocation = gl.getUniformLocation(this.program, "specularColor");
	this.lightPositionLocation = gl.getUniformLocation(this.program, "lightPosition");
}
Shader.prototype.setup = function(projectionMatrix, viewMatrix, modelMatrix) {
	gl.useProgram(this.program);
	gl.uniformMatrix4fv(this.projectionMatrixLocation, false, projectionMatrix.elements);
	gl.uniformMatrix4fv(this.viewMatrixLocation, false, viewMatrix.elements);
	gl.uniformMatrix4fv(this.modelMatrixLocation, false, modelMatrix.elements);
	gl.uniform4f(this.lightPositionLocation, x, y, z, 1.0);
}
function Model(data) {
	var positionArray = new Float32Array(flatten(data.positions));
	this.positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
  	gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);

	var triangleArray = new Uint16Array(flatten(data.triangles));
	this.triangleArrayLength = triangleArray.length;
	this.triangleBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
  	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleArray, gl.STATIC_DRAW);

	var normalArray = new Float32Array(flatten(data.normals));
	this.normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
  	gl.bufferData(gl.ARRAY_BUFFER, normalArray, gl.STATIC_DRAW);

	var texCoordArray = new Float32Array(flatten(data.texCoords));
	this.texCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
  	gl.bufferData(gl.ARRAY_BUFFER, texCoordArray, gl.STATIC_DRAW);
}
Model.prototype.draw = function(shader) {
	if(shader.vertexPositionLocation != -1) {
	gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
	gl.vertexAttribPointer(shader.vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(shader.vertexPositionLocation);
	}
	if(shader.vertexNormalLocation != -1) {
	gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
	gl.vertexAttribPointer(shader.vertexNormalLocation, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(shader.vertexNormalLocation);
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
	gl.vertexAttribPointer(shader.vertexTexCoordLocation, 2, gl.FLOAT, false, 0, 0);
 	gl.enableVertexAttribArray(shader.vertexTexCoordLocation);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
	gl.drawElements(gl.TRIANGLES, this.triangleArrayLength, gl.UNSIGNED_SHORT, 0);
	if(shader.vertexPositionLocation != -1) {
		 gl.disableVertexAttribArray(shader.vertexPositionLocation);
	}
	if(shader.vertexNormalLocation != -1) {
		 gl.disableVertexAttribArray(shader.vertexNormalLocation);
	 }
	}
	function loadTexture( image, texture){
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    requestAnimationFrame(draw);
}



function draw() {
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.viewport(0,0,framebufferWidth,framebufferHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);
	var projectionMatrix = new Matrix4();
	var viewMatrix = new Matrix4();
  	var modelMatrix = new Matrix4(); 
	projectionMatrix.setPerspective(45, 1, 1, 10);
	viewMatrix.setTranslate(0, 0, -8);
	modelMatrix.rotate(modelRotationX, 1, 0, 0).rotate(modelRotationY, 0, 1, 0);
  	modelMatrix.translate(0,0,0);
  	gl.bindTexture(gl.TEXTURE_2D, modelTexture);
	chestShader.setup(projectionMatrix, viewMatrix, modelMatrix);
	chestModel.draw(chestShader);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.viewport(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight);
	gl.enable(gl.DEPTH_TEST);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.clearColor(0,0,0,0); //G
	gl.bindTexture(gl.TEXTURE_2D, colorTexture);
  	if(currentShader == 1)
	{
		gl.useProgram(edgeShader.program);
		squareModel.draw( edgeShader);
	}
	else if(currentShader == 2)
	{
		gl.useProgram(threshShader.program);
		squareModel.draw( threshShader);
	}
	else if(currentShader == 3)
	{
		gl.useProgram(blurShader.program);
		squareModel.draw( blurShader);
	}
	else if(currentShader == 4)
	{
		gl.useProgram(mirrorShader.program);
		chestModel.draw( mirrorShader);
	}
	else if(currentShader == 5)
	{
		gl.useProgram(chocoShader.program);
		chestModel.draw( chocoShader);
	}
	else {
		gl.useProgram(doNothingShader.program);
		squareModel.draw( doNothingShader);
	}
	gl.bindTexture(gl.TEXTURE_2D, null);
	}
