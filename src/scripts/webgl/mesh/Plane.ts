import { Attributes, Program } from '../core/Program'
import { webgl } from '../core/WebGL'

type Params = {
  width: number
  height: number
}

export class Plane extends Program {
  constructor(vs: string, fs: string, params: Params) {
    super(vs, fs, Plane.createAttributes(params), Plane.createIndices())
  }

  private static createAttributes(params: Params): Attributes {
    const [w, h] = [params.width / 2, params.height / 2]
    // prettier-ignore
    const position = [
      -w,  h, 0,
       w,  h, 0,
      -w, -h, 0,
       w, -h, 0,
    ]
    // prettier-ignore
    const normal = [
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
    ]
    // prettier-ignore
    const uv = [
      0, 1,
      1, 1,
      0, 0,
      1, 0,
    ]

    return {
      position: { data: Float32Array.from(position), location: 0, stride: 3 },
      normal: { data: Float32Array.from(normal), location: 1, stride: 3 },
      uv: { data: Float32Array.from(uv), location: 2, stride: 2 },
    }
  }

  private static createIndices() {
    // prettier-ignore
    const indices = [
      0, 2, 1,
      1, 2, 3,
    ]
    return Uint16Array.from(indices)
  }

  render() {
    super.render()

    const gl = webgl.gl
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
  }
}
