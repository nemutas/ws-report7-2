import { mat4, vec3 } from 'gl-matrix'
import { Uniform } from './Uniform'
import { webgl } from './WebGL'

type Usage = 'STATIC_DRAW' | 'DYNAMIC_DRAW' | 'STREAM_DRAW'

type AttributeNames = 'position' | 'normal' | 'uv'

export type Attributes = { [name in AttributeNames]: { data: Float32Array; stride: number; location: number; usage?: Usage } }

export abstract class Program {
  public readonly unifrom: Uniform

  private program: WebGLProgram
  private vao: WebGLVertexArrayObject | null
  private vbo: { [name in string]: WebGLBuffer | null } = {}
  private ibo?: WebGLBuffer | null
  private _modelMatrix = mat4.create()

  constructor(
    private vertexShader: string,
    private fragmentShader: string,
    private attributes: Attributes,
    private indices?: Uint16Array,
  ) {
    const vs = this.createShaderObject(this.vertexShader, 'vertex')
    const fs = this.createShaderObject(this.fragmentShader, 'fragment')
    this.program = this.createProgramObject(vs, fs)
    this.unifrom = new Uniform(webgl.gl, this.program)

    this.vao = this.createVAO()
  }

  /**
   * シェーダオブジェクトを生成する
   */
  private createShaderObject(shaderSource: string, type: 'vertex' | 'fragment') {
    const gl = webgl.gl
    const _type = type === 'vertex' ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER
    const shader = gl.createShader(_type)
    if (!shader) throw new Error('cannot created shader')

    gl.shaderSource(shader, shaderSource)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'error')

    return shader
  }

  /**
   * プログラムオブジェクトを生成する
   */
  private createProgramObject(vs: WebGLShader, fs: WebGLShader) {
    const gl = webgl.gl
    const program = gl.createProgram()
    if (!program) throw new Error('cannot created program')

    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    gl.deleteShader(vs)
    gl.deleteShader(fs)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'error')

    gl.useProgram(program)
    return program
  }

  private createVAO() {
    const gl = webgl.gl
    const vao = gl.createVertexArray()

    gl.bindVertexArray(vao)
    Object.entries(this.attributes).forEach(([name, v]) => {
      const vbo = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
      gl.bufferData(gl.ARRAY_BUFFER, v.data, v.usage ? gl[v.usage] : gl.STATIC_DRAW)
      gl.enableVertexAttribArray(v.location)
      gl.vertexAttribPointer(v.location, v.stride, gl.FLOAT, false, 0, 0)
      this.vbo[name] = vbo
    })
    if (this.indices) {
      const ibo = gl.createBuffer()
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW)
    }
    gl.bindVertexArray(null)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)

    return vao
  }

  setAttribute(name: string, data: BufferSource, stride: number, location: number, usage: Usage = 'STATIC_DRAW') {
    if (this.vao) return
    const gl = webgl.gl
    const vao = this.vao!

    gl.bindVertexArray(vao)

    const vbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl[usage])
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, stride, gl.FLOAT, false, 0, 0)

    gl.bindVertexArray(null)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    this.vbo[name] = vbo
  }

  /**
   * bufferを有効化する
   */
  enableBuffer() {
    webgl.gl.bindVertexArray(this.vao)
  }

  /**
   * attributeを更新する
   * @param name 名前
   * @param datas 更新データ
   */
  updateAttribute(name: string, datas: BufferSource) {
    const gl = webgl.gl
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo[name])
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, datas)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
  }

  // =====================================================
  // model matrix
  get modelMatrix() {
    return this._modelMatrix
  }

  translate(offset: vec3) {
    mat4.translate(this._modelMatrix, this._modelMatrix, offset)
  }

  rotate(axis: vec3, angle: number) {
    mat4.rotate(this._modelMatrix, this._modelMatrix, angle, vec3.normalize(vec3.create(), axis))
  }

  // =====================================================
  // render
  render() {
    this.enableBuffer()
  }

  // =====================================================
  // dispose
  private deleteProgram() {
    webgl.gl.deleteProgram(this.program)
  }

  private deleteVAO() {
    webgl.gl.deleteVertexArray(this.vao)
  }

  private deleteVBO() {
    Object.values(this.vbo).forEach((vbo) => webgl.gl.deleteBuffer(vbo))
  }

  private deleteIBO() {
    this.ibo && webgl.gl.deleteBuffer(this.ibo)
  }

  dispose() {
    this.deleteProgram()
    this.deleteVBO()
    this.deleteIBO()
    this.deleteVAO()
  }
}
