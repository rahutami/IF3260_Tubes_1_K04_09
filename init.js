const canvas = document.getElementById("canvas");

const gl = canvas.getContext("webgl");

if (!gl) {
  throw new Error("WebGL not supported!");
}

let shapes = [];

let state = {
  mode: "line",
};

const vertexShaderSource = `
    precision mediump float;
    attribute vec2 a_position;
    attribute vec3 a_color;

    varying vec3 v_color;

    void main(){
        gl_Position = vec4(a_position,0, 1);
        v_color = a_color;
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    varying vec3 v_color;

    void main(){
        gl_FragColor = vec4(v_color, 1);
    }
`;
