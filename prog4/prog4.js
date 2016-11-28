/*  Gaelan Harrington
 *  @gharr28@lsu.edu
 *  CSC 4356 | ICG
 *  Project 4 : Scene Management*/
//Movement : Controls
var modelRotationX = 0;
var modelRotationY = 0;
var dragging = false;
var lastClientX;
var lastClientY;

function onmousedown(event){dragging=true;lastClientX=event.clientX;lastClientY=event.clientY;}

function onmouseup(event){dragging=false;}

function onmousemove(event){if(dragging==true){dX=event.clientX-lastClientX;dY=event.clientY-lastClientY;modelRotationY=modelRotationY+dX;modelRotationX=modelRotationX+dY;if(modelRotationX>90.00){modelRotationX = 90.00;}if(modelRotationX<-90.00){modelRotationX = -90.00;}requestAnimationFrame(draw);lastClientX=event.clientX;lastClientY=event.clientY;}}

//------------------------------------------------------------------------------------------------------------------------->
//Vectors : Math Functions & Flatten
function add(a, b) { return [a[0] + b[0],a[1] + b[1],a[2] + b[2]];}

function subtract(a, b) {return [a[0] - b[0],a[1] - b[1],a[2] - b[2]];}

function dot(a, b) {return [a[0] * b[0] +a[1] * b[1] +a[2] * b[2]];}

function cross(a, b) { return [a[1] * b[2] - a[2] * b[1],a[2] * b[0] - a[0] * b[2],a[0] * b[1] - a[1] * b[0]];}

function normalize(a) {var len = Math.sqrt(dot(a, a));return [a[0] / len,a[1] / len,a[2] / len];}

function flatten(a) {return a.reduce(function(b, v) {b.push.apply(b, v);return b}, [])}
//--------------------------------------------------------------------------------------------------------------------------->
var canvas;
var gl;

//Variables : Models
var teapotModel;
var cowModel;
var planeModel;

//Variables : Shaders
var normalShader; //Rainbow
var chocoShader;  //Light
var goochShader;  //Gooch

function Shader(vertexShaderId, fragmentShaderId) {
    vertexSource   = document.getElementById(vertexShaderId).text;
    fragmentSource = document.getElementById(fragmentShaderId).text;

    this.program = createProgram(gl, vertexSource, fragmentSource)
    gl.useProgram(this.program);

    this.projectionMatrixLocation = gl.getUniformLocation(this.program, 'projectionMatrix');
    this.viewMatrixLocation       = gl.getUniformLocation(this.program, 'viewMatrix');
    this.modelMatrixLocation      = gl.getUniformLocation(this.program, 'modelMatrix');

    this.vertexPositionLocation = gl.getAttribLocation(this.program, "vertexPosition");
    this.vertexNormalLocation   = gl.getAttribLocation(this.program, "vertexNormal");
}

Shader.prototype.setup = function(projectionMatrix, viewMatrix, modelMatrix) {
   
    gl.useProgram(this.program);

    //Set : Uniforms
    gl.uniformMatrix4fv(this.projectionMatrixLocation, false, projectionMatrix.elements);
    gl.uniformMatrix4fv(this.viewMatrixLocation, false, viewMatrix.elements);
    gl.uniformMatrix4fv(this.modelMatrixLocation, false, modelMatrix.elements);
}

function Model(data) {
    //Initialize : Buffer Objects
    var positionArray = new Float32Array(flatten(data.positions));
    var triangleArray = new Uint16Array(flatten(data.triangles));
    var normalArray   = new Float32Array(flatten(data.normals));

    //Load: Buffers
    this.positionBuffer = gl.createBuffer();
    this.triangleBuffer = gl.createBuffer();
    this.normalBuffer   = gl.createBuffer();

    //Buffer Vertex: Positions
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);

    //Buffer Vertex: Normals
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normalArray, gl.STATIC_DRAW);

    //Buffer Vertex: Triangles
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleArray, gl.STATIC_DRAW);

    this.triangleArrayLength = triangleArray.length;
}

Model.prototype.draw = function(shader) {
    //Draw : Triangles
    if (shader.vertexPositionLocation != -1){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(shader.vertexPositionLocation, 3, gl.FLOAT, false, 0 , 0);
        gl.enableVertexAttribArray(shader.vertexPositionLocation);
    }
    if(shader.vertexNormalLocation != -1){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(shader.vertexNormalLocation, 3, gl.FLOAT, false, 0 , 0);
        gl.enableVertexAttribArray(shader.vertexNormalLocation);
    } 

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
    gl.drawElements(gl.TRIANGLES, this.triangleArrayLength, gl.UNSIGNED_SHORT, 0);
}

function init() {
    //Create : Canvas & GL Objects
    canvas = document.getElementById('webgl');
    gl     = getWebGLContext(canvas, false);

    //Map : Movement
    canvas.onmousedown = onmousedown;
    canvas.onmouseup   = onmouseup;
    canvas.onmousemove = onmousemove;
	
    //Create: Model Objects
    teapotModel = new Model(teapot);
    cowModel = new Model(cow);
    planeModel = new Model(plane);

    //Start: Shaders
    normalShader = new Shader('vertexShader', 'fragmentShader');
    goochShader  = new Shader('goochVertexShader', 'goochFragmentShader');
    chocoShader  = new Shader('lightVertexShader', 'lightFragmentShader');

    requestAnimationFrame(draw);
}

function draw() {
    //Create: Matrices
    var projectionMatrix = new Matrix4();
    var viewMatrix = new Matrix4();
    var modelMatrix;
    var zoom = 6;
    //Set:  Perspectives & Translations
    projectionMatrix.perspective(45, 1, 1, 10);
    viewMatrix.translate(0, 0, -zoom);

    //Setup: Draw
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

	//Model : Cow (Rainbow)
    modelMatrix = new Matrix4();
    modelMatrix.rotate(modelRotationX, 1.0, 0.0, 0.0);
    modelMatrix.rotate(modelRotationY, 0.0, 1.0, 0.0);
    modelMatrix.translate(-1.0, 0.0, 0.0);

    //Setup : Shader/Draw
    normalShader.setup(projectionMatrix, viewMatrix, modelMatrix);
    cowModel.draw(normalShader);

	//Model: Teapot (Gooch)
    modelMatrix = new Matrix4();
    modelMatrix.rotate(modelRotationX, 1.0, 0.0, 0.0);
    modelMatrix.rotate(modelRotationY, 0.0, 1.0, 0.0);
    modelMatrix.translate(1.0,0.0,0.0);

    //Setup : Shader/Draw
    goochShader.setup(projectionMatrix, viewMatrix, modelMatrix);
    teapotModel.draw(goochShader);

    //Model : Plane (Chocolate)
    modelMatrix = new Matrix4();
    modelMatrix.rotate(modelRotationX, 1.0, 0.0, 0.0);
    modelMatrix.rotate(modelRotationY, 0.0, 1.0, 0.0);
    modelMatrix.translate(-0.0,0.0,-2.0);

    //Setup : Shader/Draw
    chocoShader.setup(projectionMatrix, viewMatrix, modelMatrix);
    planeModel.draw(chocoShader);
}