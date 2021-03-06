function main() {
    const canvas = document.getElementById('canvas')
    canvas.height = window.innerHeight * 0.95
    canvas.width = canvas.height
    const gl = canvas.getContext('webgl2')
    if (!gl) {
        alert('WebGL is not supported on this browser/device')
        return
    }

    const vertexShader = `attribute vec2 a_position;

    uniform mat3 u_proj_mat;
    void main(){
        vec2 position = (u_proj_mat * vec3(a_position, 1)).xy;
        gl_Position = vec4(position, 0, 1);
    }`

    const fragmentShader = `precision mediump float;

    uniform vec4 u_fragColor;
    void main() {
    gl_FragColor = u_fragColor;
    }`

    var state = { 
        mode: "line", 
        drawing: false, 
        origin_x: 0, 
        origin_y: 0,
        corner_count: 0,
        vertices: []
    }
    var mouseClicked = false;
    var nearest = null;
    var objectArray = [];
    var mousex = 0;
    var mousey = 0;

    const shaderProgram = initShaderProgram(gl, vertexShader, fragmentShader);

    document.getElementById('inputFile')
        .addEventListener('change', function () {

            var fileReader = new FileReader();
            fileReader.onload = function () {
                render(fileReader.result, shaderProgram, gl);
            }

            fileReader.readAsText(this.files[0]);
        });

    document.querySelectorAll(".shape").forEach(button => {
        button.addEventListener('click', (e) => {
            e.target.disabled = true

            state.mode = e.target.id

            document.querySelectorAll(".shape").forEach(btn => {
                if (btn.id != state.mode) btn.disabled = false
            })

            if(state.mode === "polygon"){
                document.getElementById('done-btn').disabled = false;
            } else {
                document.getElementById('done-btn').disabled = true;
            }
        })
        if (button.id != state.mode) button.disabled = false;
        else button.disabled = true;
    });

    document.getElementById('done-btn').addEventListener("click", function(event){
        if(state.mode !== "polygon") return;
        saveObject(state.vertices)
        state.corner_count = 0
        state.drawing = false
        state.vertices = []
        drawObjects()
    })

    canvas.addEventListener("mousedown", function (event) {
        if (!mouseClicked) {
            var position = getMouseCoordinate(event),
                xPosition = position[0],
                yPosition = position[1];
            nearest = getNearestVertex(xPosition, yPosition);
            if (state.mode.indexOf("transform") > -1 && nearest != null) {
                mouseClicked = true;
            } else {
                recordPosition(event);
                state.drawing = true;
                state.origin_x = mousex;
                state.origin_y = mousey;
                if(state.mode === "polygon"){
                    state.corner_count++
                    state.vertices.push(state.origin_x, state.origin_y)
                }
            }
        }
    });

    canvas.addEventListener('mousemove', function(event){
        if(!state.drawing){
            return;
        }
        recordPosition(event);
        drawObjects();

        var x1 = state.origin_x;
        var y1 = state.origin_y;
        var x2 = mousex;
        var y2 = mousey;
        var vertices = []
        
        if (state.mode === "square"){
            x2 = x1 + (x2 > x1 ? Math.abs(y2 - y1) : (-1) * Math.abs(y2 - y1))
            vertices = [x1, y1, x1, y2, x2, y1, x2, y2]
        } else if (state.mode === "rectangle" ) {
            vertices = [x1, y1, x1, y2, x2, y1, x2, y2]
        } else if (state.mode === "line"){
            vertices = [x1, y1, x2, y2]
        } else {
            vertices = [...state.vertices, x2, y2]
        }

        drawObject(vertices)
    })

    canvas.addEventListener("mouseup", function (event) {
        if (mouseClicked) {
            var position = getMouseCoordinate(event),
                xPosition = position[0],
                yPosition = position[1];
            
            var objectID = nearest[0],
                vertexID = nearest[1];

            if(state.mode === "transform-vertex"){
                objectArray[objectID].setVerticesByID(vertexID, xPosition, yPosition);
            } else {
                var vertices = objectArray[objectID].getVertices();
                var [currX, currY] = objectArray[objectID].getVerticesById(vertexID);
                console.log(xPosition, yPosition)
                for(var i = 0; i < vertices.length; i+=2){
                    if(vertices[i] === currX && vertices[i+1] === currY){
                        objectArray[objectID].setVerticesByID(i, xPosition, yPosition);
                    } else if (vertices[i] === currX){
                        objectArray[objectID].setVerticesByID(i, xPosition, vertices[i+1]);
                    } else if (vertices[i+1] === currY){
                        objectArray[objectID].setVerticesByID(i, vertices[i], yPosition);
                    }
                    console.log(objectArray[objectID].getVertices())
                }
            }

            mouseClicked = false;
            drawObjects()
            nearest = null;
        } else if (state.drawing && !(state.mode === "polygon")){
            recordPosition(event);

            var x1 = state.origin_x;
            var y1 = state.origin_y;
            var x2 = mousex;
            var y2 = mousey;
            var vertices = []
            
            if (state.mode === "square"){
                x2 = x1 + (x2 > x1 ? Math.abs(y2 - y1) : (-1) * Math.abs(y2 - y1))
                vertices = [x1, y1, x1, y2, x2, y1, x2, y2]
            } else if (state.mode === "rectangle" ) {
                vertices = [x1, y1, x1, y2, x2, y1, x2, y2]
            } else if (state.mode === "line"){
                vertices = [x1, y1, x2, y2]
            } else {
                vertices = [...state.vertices, x2, y2]
            }

            state.drawing = false;
            saveObject(vertices)
            drawObjects();
        }
    });

    function initShaderProgram(gl, vertexSource, fragmentSource) {
        const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
            return null;
        }

        return shaderProgram;
    }


    function loadShader(gl, type, source) {
        const shader = gl.createShader(type);

        gl.shaderSource(shader, source);

        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    function recordPosition(e){
        mousex = 2 * (e.offsetX / canvas.clientWidth) - 1
        mousey = 2 * (1 - (e.offsetY / canvas.clientHeight)) - 1
    }

    function saveObject(vertices){
        const object = new geometryObject(objectArray.length, shaderProgram, gl);
        object.setVertexArray(vertices);
        object.setColors(hexToRgbA(document.getElementById("inputColor").value));
        object.setPosition(0, 0);
        object.setRotation(0);
        object.setScale(1, 1);
        objectArray.push(object);
    }

    function drawObject(vertices){
        const object = new geometryObject(objectArray.length, shaderProgram, gl);
        object.setVertexArray(vertices);
        object.setColors(hexToRgbA(document.getElementById("inputColor").value));
        object.setPosition(0, 0);
        object.setRotation(0);
        object.setScale(1, 1);
        object.bind();
        object.draw();
    }
    class geometryObject {

        constructor(id, shader, gl) {
            this.id = id;
            this.shader = shader;
            this.gl = gl;
            this.position = null;
            this.rotation = null;
            this.scale = null;
            this.color = null;
            this.vertices = null;
            this.vertexBuffer;
            this.colorBuffer;
        }

        getID() {
            return this.id;
        }
        getVertices() {
            return this.vertices;
        }
        getVerticesById(vertexId) {
            return [this.vertices[vertexId], this.vertices[vertexId+1]];
        }
        getColor() {
            return this.color;
        }
        setPosition(x, y) {
            this.position = [x, y];
        }
        setRotation(rot) {
            this.rotation = rot;
        }
        setScale(x, y) {
            this.scale = [x, y];
        }
        setColors(color) {
            this.color = color;
        }
        setVerticesByID(verticesID, x, y) {
            this.vertices[verticesID] = x;
            this.vertices[verticesID + 1] = y;
        }
        setVertexArray(vertices) {
            this.vertices = vertices;
        }

        bind() {
            const vertBuf = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertBuf);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STATIC_DRAW);
            this.vertexBuffer = vertBuf;
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

            const colorBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.color), this.gl.STATIC_DRAW);
            this.colorBuffer = colorBuffer;
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        }
        draw() {
            const gl = this.gl;
            gl.useProgram(this.shader);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            const vertexPos = gl.getAttribLocation(this.shader, 'a_position');
            gl.vertexAttribPointer(vertexPos, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vertexPos);

            const uniformCol = gl.getUniformLocation(this.shader, 'u_fragColor');
            gl.uniform4fv(uniformCol, this.color);

            const projectionMat = this.computeProjection();

            const uniformPos = gl.getUniformLocation(this.shader, 'u_proj_mat');
            gl.uniformMatrix3fv(uniformPos, false, projectionMat);

            if (this.vertices.length == 4) {
                gl.drawArrays(gl.LINES, 0, this.vertices.length);
            } else if (this.vertices.length == 6) {
                gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 2);
            } else {
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertices.length / 2);
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }
        computeProjection() {
            const translateMat = makeTranslationMatrics(this.position[0], this.position[1]);
            const rotationMat = makeRotationXMat(this.rotation);
            const scaleMat = makeScaleMat(this.scale[0], this.scale[1]);
            return multiplyMatrix(multiplyMatrix(scaleMat, rotationMat), translateMat);
        }
    }
    function hexToRgbA(hex){
        var c;
        if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
            c= hex.substring(1).split('');
            if(c.length== 3){
                c= [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c= '0x'+c.join('');
            return [((c>>16)&255)/255, ((c>>8)&255)/255, (c&255)/255,1];
        }
        throw new Error('Bad Hex');
    }
    function render(datainput, shaderProgram, gl) {
        var arrayobj = parsingData(datainput);
        arrayobj.forEach(function (item, index) {
            const object = new geometryObject(index, shaderProgram, gl);
            object.setVertexArray(item.vertices);
            object.setColors(item.vcolor);
            object.setPosition(0, 0);
            object.setRotation(0);
            object.setScale(1, 1);
            objectArray.push(object);
        });
        drawObjects();
    }

    function parsingData(data) {
        var objArray = [];
        var lines = data.split("\n");
        var objectCount = parseInt(lines[0]);
        var startline = 1;

        for (var obj = 0; obj < objectCount; obj++) {
            var vertex = lines[startline].split(",");
            for (var i = 0; i < vertex.length; i++) vertex[i] = parseFloat(vertex[i]);
            startline++;
            var color = lines[startline].split(",");
            for (var i = 0; i < color.length; i++) color[i] = parseFloat(color[i]);
            startline++;
            var objglo = {
                vertices: vertex,
                vcolor: color
            }
            objArray.push(objglo);
        }
        return objArray;
    }

    function getMouseCoordinate(event) {
        var x = event.clientX,
            y = event.clientY,
            rect = event.target.getBoundingClientRect();
        var xPosition = (x - rect.right + rect.width / 2) / rect.width * 2;
        var yPosition = (rect.bottom - y - rect.height / 2) / rect.height * 2;
        return [xPosition, yPosition];
    }

    function calcDistance(x1, y1, x2, y2) {
        var x = Math.pow(x1 - x2, 2),
            y = Math.pow(y1 - y2, 2);
        return Math.sqrt(x + y);
    }

    function getNearestVertex(x, y) {
        minVal = 2;
        minObjId = -1;
        minVerId = -1;
        for (var i = 0; i < objectArray.length; i++) {
            var objId = objectArray[i].getID(),
                objVa = objectArray[i].getVertices();
            for (var v = 0; v < objVa.length; v += 2) {
                var dist = calcDistance(x, y, objVa[v], objVa[v + 1]);
                if (dist < minVal) {
                    minVal = dist;
                    minObjId = objId;
                    minVerId = v;
                }
            }
        }
        if (minObjId == -1 || minVal > 0.03) {
            return null;
        }
        return [minObjId, minVerId];
    }

    function makeTranslationMatrics(x, y) {
        const translateMat = [
            1, 0, 0,
            0, 1, 0,
            x, y, 1
        ];
        return translateMat;
    }

    function makeScaleMat(k1, k2) {
        const scaleMat = [
            k1, 0, 0,
            0, k2, 0,
            0, 0, 1
        ];
        return scaleMat;
    }

    function makeRotationXMat(degrees) {
        const rad = degrees * Math.PI / 180;
        const sin = Math.sin(rad);
        const cos = Math.cos(rad);
        const rotationMat = [
            cos, -sin, 0,
            sin, cos, 0,
            0, 0, 1
        ]
        return rotationMat;
    }

    function multiplyMatrix(matA, matB) {
        const out = []
        for (let i = 0; i < 3; ++i) {
            for (let j = 0; j < 3; ++j) {
                let temp = 0
                for (let k = 0; k < 3; ++k) {
                    temp += matA[i * 3 + k] * matB[k * 3 + j]
                }
                out.push(temp)
            }
        }
        return out
    }

    function savefile() {
        var content = "";
        content += objectArray.length + "\n";
        objectArray.forEach(objToString);

        function objToString(value) {
            content += value.vertices.toString() + "\n";
            content += value.color.toString() + "\n";
        }
        var link = document.createElement('a');
        link.download = 'model.txt';
        var blob = new Blob([content], { type: 'text/plain' });
        link.href = window.URL.createObjectURL(blob);
        link.click()
    }

    function scaleObject(value){
        objectArray[objectArray.length-1].setScale(value, value)
    }

    function drawObjects(){
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(255, 255, 255, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        for (var obj of objectArray){
            obj.bind();
            obj.draw();
        }
    }

    document.getElementById("save").onclick = function () { savefile() };

    document.getElementById("clear").addEventListener("click", function(e){
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(255, 255, 255, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        objectArray = []
    })
}

main()