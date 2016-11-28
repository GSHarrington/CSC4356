/*  Gaelan Harrington
 *  @gharr28@lsu.edu
 *  CSC 4356 | ICG
 *  Project 1 : Triforce */
var canvas;
var gl;
//Table of triangles (Starting at zero top and increasing left to right to 5 the last vertices bottom right) 
var triangles = [
    [  0,  1,  2 ],
	[  1,  3,  4 ],
    [  2,  4,  5 ]];
//Table of vertices of triangles(With zero Z values)
var positions = [
    [    0.0,  0.5928,  0.0 ],
    [-0.3432,     0.0,  0.0 ],
    [ 0.3432,     0.0,  0.0 ],
    [-0.6864, -0.5928,  0.0 ],
	[    0.0, -0.5928,  0.0 ],
    [ 0.6864, -0.5928,  0.0 ]];
function init() 
{
	//Create WebGL context so it can maintain our GPU memory state.
	canvas = document.getElementById("webgl");
	gl = getWebGLContext(canvas, false);
	//Configure Render with vertex & fragment source strings.
	vertexSource   = document.getElementById('vertexShader').text;
	fragmentSource = document.getElementById('fragmentShader').text;
	//Load configurations onto the GPU.
	program = createProgram(gl, vertexSource, fragmentSource);
	//Makes the current GPU using our handle program.
	gl.useProgram(program);
	//Create storage variables (handles) to store our JS arrays
	positionBuffer = gl.createBuffer();
	triangleBuffer = gl.createBuffer();
	//Flatten data for conversion to GPU
	positionArray = new Float32Array(flatten(positions));
	//Using Array_Buffer for type vertex data
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);
	//Flatten data for conversion to GPU again!
	triangleArray = new Uint16Array(flatten(triangles));
	//Using Element_Array for type triangel data
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleArray, gl.STATIC_DRAW);
	//Request the GPU to create our data.
	requestAnimationFrame(draw);
}
//Flatten function - creates a single linear array to input tables for rendering (Nice format to Binary!)
function flatten(a) {return a.reduce(function (b, v) { b.push.apply(b, v); return b }, [])}
//Interprets data within GPU for image creation!
function draw()
{	//Set values for color buffers
	gl.clearColor(0, 0.502, 0, 1.0);
	//Get buffers ready for color writing.
    gl.clear(gl.COLOR_BUFFER_BIT);
	//Get the vertex position locations by asking our program handle.
	var vertexPositionLocation = gl.getAttribLocation(program, 'vertexPosition');
	//With location we can move our buffer with information on reading our data
	gl.vertexAttribPointer(vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);
	//Now we enable it for later rendering.
	gl.enableVertexAttribArray(vertexPositionLocation);
	//Set current buffer assignment checks
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	//Starting with our vertex 0 we display our data
	gl.drawElements(gl.TRIANGLES, triangleArray.length, gl.UNSIGNED_SHORT, 0);
}