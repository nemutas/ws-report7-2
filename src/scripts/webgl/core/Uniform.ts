import { CubeTexture } from '../texture/CubeTexture'
import { Texture } from '../texture/Texture'
import { TextureBase } from '../texture/TextureBase'

type UniformType = '1f' | '1i' | '2fv' | '3fv' | 'm4' | 't'

export class Uniform {
  private uniforms: Object & { [name in string]: { location: WebGLUniformLocation | null; type: UniformType; texture?: TextureBase; unit?: number } } = {}
  private textureUnit = 0

  constructor(
    private gl: WebGL2RenderingContext,
    private program: WebGLProgram,
  ) {}

  /**
   * uniformを追加する
   * @param name 一意な名前
   * @param type データ型
   * @param value 初期値
   */
  add(name: string, type: UniformType, value?: any) {
    const gl = this.gl
    const location = gl.getUniformLocation(this.program, name)

    if (type === 't' && value instanceof TextureBase) {
      this.uniforms[name] = { location, type, texture: value, unit: this.textureUnit++ }
    } else if (type !== 't') {
      this.uniforms[name] = { location, type }
    }

    if (value) {
      this.set(name, value)
    }
  }

  addAll(uniforms: { [name in string]: { value: any; type: UniformType } }) {
    Object.entries(uniforms).forEach(([name, v]) => {
      this.add(name, v.type, v.value)
    })
  }

  /**
   * uniformを設定する
   * @param name
   * @param value データ型に対応した値
   */
  set(name: string, value: any) {
    const gl = this.gl

    if (!this.uniforms.hasOwnProperty(name)) return

    const { location, type, texture, unit } = this.uniforms[name]
    if (!location) return

    switch (type) {
      case '1f':
        gl.uniform1f(location, value)
        break
      case '1i':
        gl.uniform1i(location, value)
        break
      case '2fv':
        gl.uniform2fv(location, value)
        break
      case '3fv':
        gl.uniform3fv(location, value)
        break
      case 'm4':
        gl.uniformMatrix4fv(location, false, value)
        break
      case 't':
        if (value instanceof TextureBase) {
          this.uniforms[name].texture = value
        }

        let target = -1
        if (texture instanceof Texture) target = gl.TEXTURE_2D
        else if (texture instanceof CubeTexture) target = gl.TEXTURE_CUBE_MAP
        if (target < 0) return

        gl.activeTexture(gl.TEXTURE0 + unit!)
        gl.bindTexture(target, texture!.texture)
        gl.uniform1i(location, unit!)
        break
    }
  }

  /**
   * uniformの値を取得する
   */
  get(name: string): any | null {
    if (!this.uniforms[name]?.location) return null
    return this.gl.getUniform(this.program, this.uniforms[name].location!)
  }

  /**
   * 数値uniformに加算する
   */
  addValue(name: string, value: number) {
    const origin = this.get(name)
    if (typeof origin === 'number') {
      this.set(name, origin + value)
    }
  }
}
