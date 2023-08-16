import { HEX, RGBA, hexToRgb } from '../utils/color'
import { clamp } from '../utils/math'

class WebGL {
  private _gl?: WebGL2RenderingContext
  private _canvas?: HTMLCanvasElement
  private backgroundColor: RGBA = [1, 1, 1, 1]
  private animeId?: number

  public time = { delta: 0, elapsed: 0 }
  private prevTime = 0

  setup(canvas: HTMLCanvasElement) {
    this._canvas = canvas
    this._gl = this.createContext()
    this.clearColor()
    this.clearDepth()
    this.addEvents()
    this.resize()
  }

  get canvas() {
    if (this._canvas) return this._canvas
    else throw new Error('HTMLCanvasElement is not defined')
  }

  get gl() {
    if (this._gl) return this._gl
    else throw new Error('WebGL2RenderingContext is not defined')
  }

  private createContext() {
    const gl = this.canvas.getContext('webgl2')
    if (gl) {
      gl.enable(gl.DEPTH_TEST)
      // gl.enable(gl.BLEND)
      // gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE)
      return gl
    } else {
      throw new Error('webgl2 not supported')
    }
  }

  private addEvents() {
    window.addEventListener('resize', this.resize)
  }

  private resize = () => {
    this.canvas.width = window.innerWidth * window.devicePixelRatio
    this.canvas.height = window.innerHeight * window.devicePixelRatio
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
  }

  private clearDepth() {
    this.gl.clearDepth(1)
    this.gl.clear(this.gl.DEPTH_BUFFER_BIT)
  }

  private clearColor() {
    this.gl.clearColor(this.backgroundColor[0], this.backgroundColor[1], this.backgroundColor[2], this.backgroundColor[3])
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
  }

  set background(color: RGBA | HEX) {
    if (typeof color === 'string') {
      const c = hexToRgb(color)
      if (c) {
        this.backgroundColor = [c.r, c.g, c.b, this.backgroundColor[3]]
      }
    } else {
      const c = (v: number) => clamp(v, 0, 1)
      this.backgroundColor = [c(color[0]), c(color[1]), c(color[2]), c(color[3])]
    }

    this.clearColor()
  }

  get size() {
    return { width: this.canvas.width, height: this.canvas.height, aspect: this.canvas.width / this.canvas.height }
  }

  animation(anime: () => void) {
    this.animeId = requestAnimationFrame(this.animation.bind(this, anime))

    const now = performance.now()
    this.time.delta = (now - this.prevTime) * 0.001
    this.time.elapsed += this.time.delta
    this.prevTime = now

    this.clearColor()
    this.clearDepth()
    anime()
  }

  cancelAnimation() {
    this.animeId && cancelAnimationFrame(this.animeId)
  }

  dispose() {
    window.removeEventListener('resize', this.resize)
    this.cancelAnimation()
  }
}

export const webgl = new WebGL()
