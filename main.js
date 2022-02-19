document.getElementById("square").onclick = function () {
  shapes.push(
    createSquare(
      gl,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      [Math.random(), Math.random(), Math.random()]
    )
  );
  draw();
};

document.getElementById("rectangle").onclick = function () {
  shapes.push(
    createRectangle(
      gl,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      [Math.random(), Math.random(), Math.random()]
    )
  );
  draw();
};

document.getElementById("line").onclick = function () {
  shapes.push(
    createLine(
      gl,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      [Math.random(), Math.random(), Math.random()]
    )
  );
  draw();
};

document.getElementById("clear").onclick = function () {
  shapes = [];
  draw();
};

gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(255, 255, 255, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

const positionLocation = gl.getAttribLocation(program, `a_position`);
gl.vertexAttribPointer(
  positionLocation,
  2,
  gl.FLOAT,
  gl.FALSE,
  5 * Float32Array.BYTES_PER_ELEMENT,
  0
);
gl.enableVertexAttribArray(positionLocation);

const colorLocation = gl.getAttribLocation(program, `a_color`);
gl.vertexAttribPointer(
  colorLocation,
  3,
  gl.FLOAT,
  gl.FALSE,
  5 * Float32Array.BYTES_PER_ELEMENT,
  2 * Float32Array.BYTES_PER_ELEMENT
);
gl.enableVertexAttribArray(colorLocation);

gl.useProgram(program);
