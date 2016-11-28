/*  Gaelan Harrington
 *  @gharr28@lsu.edu
 *  CSC 4356 | ICG
 *  Project 2 : Interaction*/
var canvas;
var gl;
var modelRotationX = 0;
var modelRotationY = 0;
var dragging = false;
var lastClientX;
var lastClientY;
function init() 
{
	canvas = document.getElementById("webgl");
	gl = getWebGLContext(canvas, false);	
	
	vertexSource   = document.getElementById('vertexShader').text;
	fragmentSource = document.getElementById('fragmentShader').text;

	program = createProgram(gl, vertexSource, fragmentSource);
	gl.useProgram(program);
	
	projectionMatrixLocation = gl.getUniformLocation(program, "projectionMatrix");
	viewMatrixLocation = gl.getUniformLocation(program, "viewMatrix");
	modelMatrixLocation = gl.getUniformLocation(program, "modelMatrix");
	vertexPositionLocation = gl.getAttribLocation(program, "vertexPosition");	
	vertexColorLocation = gl.getAttribLocation(program, "vertexColor");

	positionBuffer = gl.createBuffer();
	positionArray = new Float32Array(flatten(cube.vertices));
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);

	triangleBuffer = gl.createBuffer();
	triangleArray = new Uint16Array(flatten(cube.triangles));
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleArray, gl.STATIC_DRAW);

	colorBuffer = gl.createBuffer();
	colorArray = new Float32Array(flatten(cube.colors));
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW);
	
	gl.vertexAttribPointer(vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vertexPositionLocation);
	
	gl.vertexAttribPointer(vertexColorLocation, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vertexColorLocation);
			
	canvas.onmousedown = onmousedown;
	canvas.onmouseup = onmouseup;
	canvas.onmousemove = onmousemove;	

	requestAnimationFrame(draw);
}
function draw()
{	
	projectionMatrix = new Matrix4();
	viewMatrix = new Matrix4();
	modelMatrix = new Matrix4();

	projectionMatrix.setPerspective(45,1,1,10);
	viewMatrix.translate(0,0,-5);
	modelMatrix.rotate(modelRotationX,1,0,0);
	modelMatrix.rotate(modelRotationY,0,1,0);

	gl.uniformMatrix4fv(projectionMatrixLocation,false,projectionMatrix.elements);
	gl.uniformMatrix4fv(viewMatrixLocation,false,viewMatrix.elements);
	gl.uniformMatrix4fv(modelMatrixLocation, false,modelMatrix.elements);

	gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer); 
	gl.vertexAttribPointer(vertexPositionLocation,3,gl.FLOAT,false,0,0);
	gl.enableVertexAttribArray(vertexPositionLocation);

	gl.bindBuffer(gl.ARRAY_BUFFER,colorBuffer);
	gl.vertexAttribPointer(vertexColorLocation,3,gl.FLOAT,false,0,0);
	gl.enableVertexAttribArray(vertexColorLocation);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,triangleBuffer);
	gl.drawElements(gl.TRIANGLES,triangleArray.length,gl.UNSIGNED_SHORT,0);
}
function flatten(a) {return a.reduce(function (b, v) { b.push.apply(b, v); return b }, [])}
function onmousedown(event){
	dragging=true;
	lastClientX=event.clientX;
	lastClientY=event.clientY;
}
function onmouseup(event){
	dragging=false;
}
function onmousemove(event){
	if(dragging==true){
		dX=event.clientX-lastClientX;
		dY=event.clientY-lastClientY;

		modelRotationY=modelRotationY+dX;
		modelRotationX=modelRotationX+dY;

		if(modelRotationX>90.00)
		{modelRotationX = 90.00;}

		if(modelRotationX<-90.00)
		{modelRotationX = -90.00;}

		requestAnimationFrame(draw);
		lastClientX=event.clientX;
		lastClientY=event.clientY;
	}
}
