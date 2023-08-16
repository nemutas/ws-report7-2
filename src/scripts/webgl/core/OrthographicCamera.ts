import { mat4 } from 'gl-matrix'
import { Camera, CameraCoord } from './Camera'

type Params = {
  left?: number
  right?: number
  top?: number
  bottom?: number
  near?: number
  far?: number
}

export class OrthographicCamera extends Camera {
  public left = -1
  public right = 1
  public top = 1
  public bottom = -1
  public near = 0.01
  public far = 10

  constructor(params?: Params & CameraCoord) {
    super(params)

    if (params) {
      params.left && (this.left = params.left)
      params.right && (this.right = params.right)
      params.top && (this.top = params.top)
      params.bottom && (this.bottom = params.bottom)
      params.near && (this.near = params.near)
      params.far && (this.far = params.far)
    }
    this.updateProjectionMatrix()
  }

  updateProjectionMatrix() {
    mat4.ortho(this._projectionMatrix, this.left, this.right, this.bottom, this.top, this.near, this.far)
    mat4.invert(this._projectionMatrixInverse, this._projectionMatrix)
  }
}
