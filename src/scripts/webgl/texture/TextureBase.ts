import { webgl } from '../core/WebGL'

type Wrap = 'CLAMP_TO_EDGE' | 'REPEAT' | 'MIRRORED_REPEAT'
type Filter = 'NEAREST' | 'LINEAR' | 'NEAREST_MIPMAP_NEAREST' | 'NEAREST_MIPMAP_LINEAR' | 'LINEAR_MIPMAP_NEAREST' | 'LINEAR_MIPMAP_LINEAR'

export type Options = {
  wrapS?: Wrap
  wrapT?: Wrap
  mipmap?: boolean
  magFilter?: Filter
  minFilter?: Filter
}

export abstract class TextureBase {
  private static ResolvePath(path: string) {
    const p = path.startsWith('/') ? path.substring(1) : path
    return import.meta.env.BASE_URL + p
  }

  static LoadImage(path: string) {
    return new Promise((resolve) => {
      const img = new Image()
      img.src = this.ResolvePath(path)
      img.onload = () => resolve(img)
    }) as Promise<HTMLImageElement>
  }

  static async LoadImages(paths: string[]) {
    return await Promise.all(paths.map(async (path) => await this.LoadImage(path)))
  }

  static CoveredScale(screenAspect: number, imageAspect: number): [number, number] {
    if (screenAspect < imageAspect) return [screenAspect / imageAspect, 1]
    else return [1, imageAspect / screenAspect]
  }

  // --------------------------------
  private _texture: WebGLTexture | null = null
  private _wrapS: Wrap = 'CLAMP_TO_EDGE'
  private _wrapT: Wrap = 'CLAMP_TO_EDGE'
  private _mipmap: boolean = true
  private _magFilter: Filter = 'NEAREST'
  private _minFilter: Filter = 'NEAREST'

  constructor(private options?: Options) {
    this.setOptions()
  }

  private setOptions() {
    if (!this.options) return

    this.wrapS = this.options.wrapS
    this.wrapT = this.options.wrapT
    this.mipmap = this.options.mipmap
    this.magFilter = this.options.magFilter
    this.minFilter = this.options.minFilter
  }

  protected setParams(target: number) {
    const gl = webgl.gl
    const { wrapS, wrapT, mipmap, minFilter, magFilter } = this.opt

    if (mipmap) {
      gl.generateMipmap(target)
      gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl[minFilter])
      gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, gl[magFilter])
    } else {
      gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    }
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl[wrapS])
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl[wrapT])
  }

  set wrapS(v: Wrap | undefined) {
    v && (this._wrapS = v)
  }

  set wrapT(v: Wrap | undefined) {
    v && (this._wrapT = v)
  }

  set mipmap(v: boolean | undefined) {
    v && (this._mipmap = v)
  }

  set magFilter(v: Filter | undefined) {
    v && (this._magFilter = v)
  }

  set minFilter(v: Filter | undefined) {
    v && (this._minFilter = v)
  }

  protected get opt() {
    return { wrapS: this._wrapS, wrapT: this._wrapT, mipmap: this._mipmap, magFilter: this._magFilter, minFilter: this._minFilter }
  }

  protected set texture(t: WebGLTexture | null) {
    this._texture = t
  }

  get texture() {
    return this._texture
  }

  dispose() {
    webgl.gl.deleteTexture(this._texture)
  }
}
