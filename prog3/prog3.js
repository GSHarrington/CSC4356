/*  Gaelan Harrington
 *  @gharr28@lsu.edu
 *  CSC 4356 | ICG
 *  Project 3 : Bunny */
// Interaction variables
var rotateX, rotateY;
var translateZ;
var lastX, lastY;
var dragging;
// WebGL variables
var gl, canvas;

// Initialization function
function init() {

	// Interaction Values
	rotateX = 0;
	rotateY = 0;
	dragging = false;
	// WebGL init
	canvas = document.getElementById('webgl');
	gl = getWebGLContext(canvas, false);
	vertexSource   = document.getElementById('vertexShader').text;
	fragmentSource = document.getElementById('fragmentShader').text;
	//Load configurations onto the GPU.
	program = createProgram(gl, vertexSource, fragmentSource);
	gl.useProgram(program);

	// Normalize Array Calculations
	normals = [];
	var n = [0, 0, 0];
	for (var i = 0; i < bunny.positions.length; i++)
		normals.push(n);
	for (var i = 0; i < bunny.triangles.length; i++) {
		i0 = bunny.triangles[i][0];
		i1 = bunny.triangles[i][1];
		i2 = bunny.triangles[i][2];
		a = normalize(subtract(bunny.positions[i1], bunny.positions[i0]));
		b = normalize(subtract(bunny.positions[i2], bunny.positions[i0]));
		n = normalize(cross(a, b));
		normals[i0] = add(normals[i0], n);
		normals[i1] = add(normals[i1], n);
		normals[i2] = add(normals[i2], n);
	}
	for (var i = 0; i < normals.length; i++)
		normals[i] = normalize(normals[i]);
    // Uniform Locations
	projectionMatrixLocation = gl.getUniformLocation(program, "projectionMatrix");
	modelMatrixLocation = gl.getUniformLocation(program, "modelMatrix");
	lightDirectionLocation = gl.getUniformLocation(program, "lightDirection");
	lightColorMatrixLocation = gl.getUniformLocation(program, "lightColor");
	objectColorMatrixLocation = gl.getUniformLocation(program, "modelColor");

	// Buffer initialization
	vertexPositionLocation = gl.getAttribLocation(program, "vertexPosition");
	vertexNormalLocation = gl.getAttribLocation(program, "vertexNormal");
	gl.enableVertexAttribArray(vertexPositionLocation);
	gl.enableVertexAttribArray(vertexNormalLocation);
	
	vertexArray = new Float32Array(flatten(bunny.positions)); 
	//Flatten data for conversion to GPU
    vertexBuffer = gl.createBuffer();
    //Create storage handles to store our JS arraies
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    //Using Element_Array for type vertex
    gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);

    //repeat above process for other types
    normalArray = new Float32Array(flatten(normals));
    normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normalArray, gl.STATIC_DRAW);

    triangleArray = new Uint16Array(flatten(bunny.triangles));
    triangleBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleArray, gl.STATIC_DRAW);

	canvas.onmousedown = onmousedown;
	canvas.onmouseup = onmouseup;
	canvas.onmousemove = onmousemove;	

  	//Request the GPU to create our data.
 	 requestAnimationFrame(draw);
}

function draw() {

  // Compute the transform
  projectionMatrix = new Matrix4();
  modelMatrix = new Matrix4();

  projectionMatrix.setPerspective(45, 1, 1, 20);
  gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix.elements);

  modelMatrix.setTranslate(0, 0, -3.6); //-.36 zoom
  modelMatrix.rotate(rotateX, 1, 0, 0);
  modelMatrix.rotate(rotateY, 0, 1, 0);
  gl.uniformMatrix4fv(modelMatrixLocation, false, modelMatrix.elements);

  // Specify lighting parameters
  gl.uniform3f(lightDirectionLocation, 0.0, 1.0, 1.0);
  gl.uniform3f(lightColorMatrixLocation, 1.0, 1.0, 1.0);
  gl.uniform3f(objectColorMatrixLocation, 0.5, 0.35, 0.05); //chocolate brown!

  // Configuring attributes
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.vertexAttribPointer(vertexNormalLocation, 3, gl.FLOAT, false, 0, 0);

  //Get buffers ready for color writing
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  //Set current buffer assignment checks
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);
  gl.drawElements(gl.TRIANGLES, triangleArray.length, gl.UNSIGNED_SHORT, 0);
}
// Interaction functions
function onmousedown(event) {
	dragging = true;
	lastX = event.clientX;
	lastY = event.clientY;
}
function onmouseup(event) {
	dragging = false;
}
//on mouse with snapping
function onmousemove(event) {
	if (dragging) {
		rotateY = rotateY + event.clientX - lastX;
		rotateX = rotateX + event.clientY - lastY;

		if (rotateX > 90.0)
			rotateX = 90.0;
		if (rotateX < -90.0)
			rotateX = -90.0;

		requestAnimationFrame(draw);
	}
	lastX = event.clientX;
	lastY = event.clientY;
}
// Vector Function Operations
//ADD
function add(a, b) {
	return [
		a[0] + b[0],
		a[1] + b[1],
		a[2] + b[2]
	];
}
//SUBTRACT
function subtract(a, b) {
	return [
		a[0] - b[0],
		a[1] - b[1],
		a[2] - b[2]
	];
}
//DOT PRODUCT
function dot(a, b) {
	return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]);
}
//CROSS PRODUCT
function cross(a, b) {
	return [
		(a[1] * b[2]) - (a[2] * b[1]),
		(a[2] * b[0]) - (a[0] * b[2]),
		(a[0] * b[1]) - (a[1] * b[0])
	];
}
//NORMALIZE
function normalize(a) {
	var len = Math.sqrt(dot(a, a));
	return [
		a[0] / len,
		a[1] / len,
		a[2] / len
	];
}
//classic flatten function to push arrays in
function flatten(a) {
	return a.reduce(function (b, v) { b.push.apply(b,v); return b }, []);
}