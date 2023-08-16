import { vec3, quat } from 'gl-matrix'
import { EventDispatcher } from './EventDispatcher'
import { lerp, clamp } from '../utils/math'
import { webgl } from './WebGL'
import { Camera } from './Camera'
import { isTouch } from '@scripts/utils'

export class Controls {
  /**
   * 数値を指定した場合、updateをanimation loopで明示的に呼び出す必要がある
   */
  public _dumping: number | false = false

  private events: EventDispatcher
  private rotate = {
    current: { x: 0, y: 0 },
    target: { x: 0, y: 0 },
  }
  private mouse = {
    key: -1,
    prev: [0, 0],
  }
  private zoom = {
    prevTouch: 0,
    current: 1,
    target: 1,
    min: 0.5,
    max: 2,
  }

  constructor(private camera: Camera) {
    this.events = this.createEvents()
  }

  update() {
    if (this.dumping === false) return

    const cam = this.camera

    this.rotate.current.x = lerp(this.rotate.current.x, this.rotate.target.x, this.dumping)
    this.rotate.current.y = lerp(this.rotate.current.y, this.rotate.target.y, this.dumping)
    const { x: rotX, y: rotY } = this.rotate.current

    this.zoom.current = lerp(this.zoom.current, this.zoom.target, this.dumping)

    const PI2 = Math.PI * 2
    const v = vec3.fromValues(1, 0, 0)
    const u = vec3.fromValues(0, 1, 0)

    const q = quat.create()
    const qx = quat.create()
    const qy = quat.create()
    // y軸まわりのQ
    quat.setAxisAngle(qx, u, rotX * PI2)
    // x正ベクトルに作用させる（vはxz平面上にある）
    vec3.transformQuat(v, v, qx)
    // 作用させた軸まわりのQ
    quat.setAxisAngle(qy, v, rotY * PI2)
    // qy*qx作用のQ
    quat.mul(q, qy, qx)
    // z正ベクトルを基準に回転
    vec3.transformQuat(cam.position, [0, 0, cam.distance * this.zoom.current], q)
    vec3.transformQuat(cam.up, [0, 1, 0], q)

    cam.updateViewMatrix()
  }

  set enable(v: boolean) {
    this.events.enable = v
  }

  get dumping() {
    return this._dumping
  }

  set dumping(v: number | false) {
    this.enable = true
    this._dumping = v
  }

  set zoomScale(minmax: [number, number]) {
    this.zoom.min = minmax[0]
    this.zoom.max = minmax[1]
  }

  private createEvents() {
    const events = new EventDispatcher(webgl.canvas)
    events.mousemove = this.handleMousemove
    events.mousedown = this.handleMousedown
    events.mouseup = this.handleMouseup
    events.mouseout = this.handleMouseup
    events.wheel = this.handleWheel
    events.touchmove = this.handleTouchmove
    events.touchstart = this.handleTouchstart
    events.touchend = this.handleTouchend
    return events
  }

  private fnMove(cx: number, cy: number) {
    if (this.mouse.key === 0) {
      const { width, height } = webgl.size
      const s = 1 / Math.min(width, height)
      const dx = cx - this.mouse.prev[0]
      const dy = cy - this.mouse.prev[1]
      this.rotate.target.x -= dx * s
      this.rotate.target.y -= dy * s
      this.rotate.target.y = clamp(this.rotate.target.y % 1, -0.25, 0.25)
      this.mouse.prev = [cx, cy]

      if (this.dumping === false) {
        this.dumping = 1
        this.update()
        this.dumping = false
      }
    }
  }

  private fnZoom(delta: number) {
    const d = this.zoom.target * (isTouch() ? 0.03 : 0.1)
    if (delta < 0) {
      this.zoom.target -= d
    } else {
      this.zoom.target += d
    }
    this.zoom.target = clamp(this.zoom.target, this.zoom.min, this.zoom.max)

    if (this.dumping === false) {
      this.dumping = 1
      this.update()
      this.dumping = false
    }
  }

  private handleMousemove = (e: MouseEvent) => {
    this.fnMove(e.clientX, e.clientY)
  }

  private handleMousedown = (e: MouseEvent) => {
    this.mouse.key = e.button
    this.mouse.prev = [e.clientX, e.clientY]
  }

  private handleMouseup = () => {
    this.mouse.key = -1
  }

  private handleWheel = (e: WheelEvent) => {
    this.fnZoom(e.deltaY)
  }

  private handleTouchmove = (e: TouchEvent) => {
    e.preventDefault()

    if (e.targetTouches.length === 1) {
      const { clientX, clientY } = e.targetTouches[0]
      this.fnMove(clientX, clientY)
    } else if (e.targetTouches.length === 2) {
      const distance = Math.hypot(e.targetTouches[0].clientX - e.targetTouches[1].clientX, e.targetTouches[0].clientY - e.targetTouches[1].clientY)
      this.fnZoom(this.zoom.prevTouch - distance)
      this.zoom.prevTouch = distance
    }
  }

  private handleTouchstart = (e: TouchEvent) => {
    e.preventDefault()

    if (e.targetTouches.length === 1) {
      const { clientX, clientY } = e.targetTouches[0]
      this.mouse.key = 0
      this.mouse.prev = [clientX, clientY]
    } else if (e.targetTouches.length === 2) {
      const distance = Math.hypot(e.targetTouches[0].clientX - e.targetTouches[1].clientX, e.targetTouches[0].clientY - e.targetTouches[1].clientY)
      this.zoom.prevTouch = distance
    }
  }

  private handleTouchend = () => {
    this.mouse.key = -1
  }

  dispose() {
    this.events.remove()
  }
}
