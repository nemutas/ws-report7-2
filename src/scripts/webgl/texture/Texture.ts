import { Options, TextureBase } from './TextureBase'
import { webgl } from '../core/WebGL'

export class Texture extends TextureBase {
  private _name: string

  constructor(
    private source: HTMLImageElement,
    options?: Options,
  ) {
    super(options)
    this.texture = this.createTexture()
    this._name = source.src.split('/').at(-1)?.split('.')[0] ?? ''
  }

  private createTexture() {
    const gl = webgl.gl

    const texture = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.source)
    this.setParams(gl.TEXTURE_2D)
    gl.bindTexture(gl.TEXTURE_2D, null)

    return texture
  }

  get name() {
    return this._name
  }

  get size() {
    const { width, height } = this.source
    return { width, height, aspect: width / height }
  }
}
