import { mat4 } from 'gl-matrix'
import { Camera, CameraCoord } from './Camera'

type Params = {
  fov?: number
  aspect?: number
  near?: number
  far?: number
}

export class PerspectiveCamera extends Camera {
  public fov = 45
  public aspect = 1
  public near = 0.01
  public far = 10

  constructor(params?: Params & CameraCoord) {
    super(params)

    if (params) {
      params.fov && (this.fov = params.fov)
      params.aspect && (this.aspect = params.aspect)
      params.near && (this.near = params.near)
      params.far && (this.far = params.far)
    }
    this.updateProjectionMatrix()
  }

  updateProjectionMatrix() {
    mat4.perspective(this._projectionMatrix, this.fov, this.aspect, this.near, this.far)
    mat4.invert(this._projectionMatrixInverse, this._projectionMatrix)
  }
}
