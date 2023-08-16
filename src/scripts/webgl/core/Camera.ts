import { mat4, vec3 } from 'gl-matrix'
import { Controls } from './Controls'

export type CameraCoord = {
  position?: vec3
  target?: vec3
  up?: vec3
}

export abstract class Camera {
  public defaultPosition: vec3 = [0, 0, 1]
  public position: vec3 = [0, 0, 1]
  public target: vec3 = [0, 0, 0]
  public up: vec3 = [0, 1, 0]
  public readonly controls: Controls

  protected _projectionMatrix = mat4.create()
  protected _projectionMatrixInverse = mat4.create()
  protected _viewMatrix = mat4.create()
  protected _viewMatrixInverse = mat4.create()

  constructor(params?: CameraCoord) {
    if (params) {
      params.position && vec3.copy(this.position, params.position)
      params.position && vec3.copy(this.defaultPosition, params.position)
      params.target && vec3.copy(this.target, params.target)
      params.up && vec3.copy(this.up, params.up)
    }

    this.updateViewMatrix()

    this.controls = new Controls(this)
    this.controls.enable = false
  }

  abstract updateProjectionMatrix(): void

  updateViewMatrix() {
    mat4.lookAt(this._viewMatrix, this.position, this.target, this.up)
    mat4.invert(this._viewMatrixInverse, this._viewMatrix)
  }

  get distance() {
    return vec3.length(this.defaultPosition)
  }

  get projectionMatrix() {
    return this._projectionMatrix
  }

  get projectionMatrixInverse() {
    return this._projectionMatrixInverse
  }

  get viewMatrix() {
    return this._viewMatrix
  }

  get viewMatrixInverse() {
    return this._viewMatrixInverse
  }

  dispose() {
    this.controls.dispose()
  }
}
