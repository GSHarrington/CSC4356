/*Gaelan Harrington
    @gharr28@lsu.edu
    CSC 4356 | ICG
    Project 5 : Textured Model*/

// Variables | Interaction
var lightPositionX = 0;
var lightPositionY = 0.5;
var lightPositionZ = -1.7;
var rotateX = 0;
var rotateY = 0;
var translateZ = 6.6;
var dragging = false;
var lastClientX,lastClientY;

//Interaction & Flatten
function onmousedown(event){dragging=true;lastClientX=event.clientX;lastClientY=event.clientY;}
function onmouseup(event){dragging=false;}
function onmousemove(event){if(dragging==true){dX=event.clientX-lastClientX;dY=event.clientY-lastClientY;rotateY=rotateY+dX;rotateX=rotateX+dY;if(rotateX>90.00){rotateX = 90.00;}if(rotateX<-90.00){rotateX = -90.00;}requestAnimationFrame(draw);lastClientX=event.clientX;lastClientY=event.clientY;}}
function flatten(a) {return a.reduce(function(b, v) {b.push.apply(b, v);return b}, [])}

// Variables | Rendering
var projectionMatrixLocation;
var modelMatrixLocation;
var lightPositionLocation;
var lightColorLocation;
var modelColorLocation;
var vertexPositionLocation;
var vertexNormalLocation;
var positionArray,normalArray,triangleArray;
var projectionMatrix,modelMatrix;
var modelTexture;
var canvas;
var gl;

function init() {
        //Create WebGL context so it can maintain our GPU memory state.
        canvas = document.getElementById('webgl');
        gl = getWebGLContext(canvas, false);
        //Configure Render with vertex & fragment source strings.
        vertexSource   = document.getElementById('vertexShader').text;
        fragmentSource = document.getElementById('fragmentShader').text;
        //Load configurations onto the GPU.
        program = createProgram(gl, vertexSource, fragmentSource);
        gl.useProgram(program);
        // Uniform Locations
        projectionMatrixLocation = gl.getUniformLocation(program, "projectionMatrix");
        modelMatrixLocation = gl.getUniformLocation(program, "modelMatrix");
        lightPositionLocation = gl.getUniformLocation(program, "lightPosition");
        lightColorLocation = gl.getUniformLocation(program, "lightColor");
        // Buffer initialization
        vertexPositionLocation = gl.getAttribLocation(program, "vertexPosition");
        vertexNormalLocation = gl.getAttribLocation(program, "vertexNormal");
        vertexTexCoordLocation = gl.getAttribLocation(program, "vertexTexCoord");
        gl.enableVertexAttribArray(vertexPositionLocation);
        gl.enableVertexAttribArray(vertexNormalLocation);
        gl.enableVertexAttribArray(vertexTexCoordLocation);
        //Flatten data for conversion to GPU
        positionArray = new Float32Array(flatten(vertices)); 
        //Create storage handles to store our JS arraies
        positionBuffer = gl.createBuffer(); 
        //Using Element_Array for type vertex
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);
        //Normal Array
        normalArray = new Float32Array(flatten(normals));
        normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, normalArray, gl.STATIC_DRAW);
        //Triangle Array
        triangleArray = new Uint16Array(flatten(triangles));
        triangleBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleArray, gl.STATIC_DRAW);
        //Texture Array
        texCoordArray = new Float32Array(flatten(texCoords));
        texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoordArray, gl.STATIC_DRAW);
        //Set values for color buffers
        gl.clearColor(0, 0, 0, 0);
       //Load | Texture File
        function loadTexture(image, texture) {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            requestAnimationFrame(draw);
        }
        //Image | Flip
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        //Create | Texture
        modelTexture = gl.createTexture();
        modelImage = new Image();
        //Image | Request
        modelImage.onload = function() {loadTexture(modelImage, modelTexture);}
        modelImage.crossOrigin = "anonymous";
        //Image | Texture Source
        modelImage.src = "http://i.imgur.com/7thU1gD.jpg";
        //Interaction | Movement
        canvas.onmousemove = onmousemove;
        canvas.onmouseup = onmouseup;
        canvas.onmousedown = onmousedown;
        //Request the GPU to create our data.
        requestAnimationFrame(draw);
    }
function draw() {
        //Create | Matrices
        projectionMatrix = new Matrix4();
        modelMatrix = new Matrix4();
        //Set |  Perspectives & Translations
        projectionMatrix.setPerspective(45, 1, 1, 10);
        modelMatrix.setTranslate(0, 0, -translateZ);
        modelMatrix.rotate(rotateX, 1, 0, 0);
        modelMatrix.rotate(rotateY, 0, 1, 0);
        //Projection & Model Matrices
        gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix.elements);
        gl.uniformMatrix4fv(modelMatrixLocation, false, modelMatrix.elements);
        // Specify lighting parameters
        gl.uniform4f(lightPositionLocation, lightPositionX, lightPositionY, lightPositionZ, 1);
        gl.uniform3f(lightColorLocation, 1.0, 1.0, 1.0);
        gl.uniform3f(modelColorLocation, 0.8, 0.8, 0.8);
         // Configuring attributes for : Position | Normal | Texture
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.vertexAttribPointer(vertexNormalLocation, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.vertexAttribPointer(vertexTexCoordLocation, 2, gl.FLOAT, false, 0, 0);
        gl.bindTexture(gl.TEXTURE_2D, modelTexture);
        //Get buffers ready for color writing
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        //Set current buffer assignment checks
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer)
        gl.drawElements(gl.TRIANGLES, triangleArray.length, gl.UNSIGNED_SHORT, 0);
    }
function slider() {
        //Slider | Assignments
        lightPositionX = parseFloat(document.getElementById("lightPositionXInput").value);
        lightPositionY = parseFloat(document.getElementById("lightPositionYInput").value);
        lightPositionZ = parseFloat(document.getElementById("lightPositionZInput").value);
        document.getElementById("lightPositionXOutput").innerHTML = lightPositionX;
        document.getElementById("lightPositionYOutput").innerHTML = lightPositionY;
        document.getElementById("lightPositionZOutput").innerHTML = lightPositionZ;
        requestAnimationFrame(draw);

    }