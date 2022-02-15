function main() {
    const canvas = document.getElementById('canvas')
    canvas.width = window.innerWidth*0.8
    canvas.height = window.innerHeight
    const gl = canvas.getContext('webgl2')
    if (!gl) {
        alert('WebGL is not supported on this browser/device')
        return
    }
}

main()