function createSquare(gl, x1, y1, x2, y2, color) {
  // prettier-ignore
  x2 = x1 + (x2 > x1 ? Math.abs(y2 - y1) : -1 * Math.abs(y2 - y1));
  const positions = [
    [x1, y1],
    [x1, y2],
    [x2, y2],
    [x2, y1],
  ];
  return { positions, color, glShape: gl.TRIANGLE_FAN };
}

function createRectangle(
  gl,
  x1,
  y1,
  x2,
  y2,
  color // array of 3 integer
) {
  // prettier-ignore
  const positions = [
    [x1, y1],
    [x1, y2],
    [x2, y2],
    [x2, y1],
  ]

  return { positions, color, glShape: gl.TRIANGLE_FAN };
}

function createLine(gl, x1, y1, x2, y2, color) {
  const positions = [
    [x1, y1],
    [x2, y2],
  ];
  return { positions, color, glShape: gl.LINE_STRIP };
}
