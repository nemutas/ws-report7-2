import { webgl } from '../core/WebGL'
import { TextureBase, Options } from './TextureBase'

const FaceNames = ['px', 'py', 'pz', 'nx', 'ny', 'nz'] as const
type Face = (typeof FaceNames)[number]

export type CubeTextureSource = { [key in Face]?: { data: HTMLImageElement; target: number } }

export class CubeTexture extends TextureBase {
  /**
   * ソースセットを生成する
   * @param images ファイル名が "px" | "py" | "pz" | "nx" | "ny" | "nz" の画像リソース群
   * @returns
   */
  static CreateSource(images: HTMLImageElement[]) {
    const gl = webgl.gl

    const source: CubeTextureSource = {}

    images.forEach((img) => {
      const fileName = img.src.split('/').at(-1)?.split('.')[0]
      const faceNames: string[] = [...FaceNames]
      if (!fileName || !faceNames.includes(fileName)) return

      let target: number = -1
      if (fileName === 'px') target = gl.TEXTURE_CUBE_MAP_POSITIVE_X
      else if (fileName === 'py') target = gl.TEXTURE_CUBE_MAP_POSITIVE_Y
      else if (fileName === 'pz') target = gl.TEXTURE_CUBE_MAP_POSITIVE_Z
      else if (fileName === 'nx') target = gl.TEXTURE_CUBE_MAP_NEGATIVE_X
      else if (fileName === 'ny') target = gl.TEXTURE_CUBE_MAP_NEGATIVE_Y
      else if (fileName === 'nz') target = gl.TEXTURE_CUBE_MAP_NEGATIVE_Z

      source[fileName as Face] = { data: img, target }
    })

    return source
  }

  // ----------------------------------------------------
  constructor(
    private source: CubeTextureSource,
    options?: Options,
  ) {
    super(options)
    this.texture = this.createTexture()
  }

  private createTexture() {
    const gl = webgl.gl

    const texture = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)

    Object.values(this.source).forEach((src) => {
      gl.texImage2D(src.target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src.data)
    })

    this.setParams(gl.TEXTURE_CUBE_MAP)
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null)
    return texture
  }
}
