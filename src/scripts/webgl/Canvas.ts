import { mat4 } from 'gl-matrix'
import { Camera } from './core/Camera'
import { EventDispatcher } from './core/EventDispatcher'
import { OrthographicCamera } from './core/OrthographicCamera'
import { PerspectiveCamera } from './core/PerspectiveCamera'
import { webgl } from './core/WebGL'
import { Plane } from './mesh/Plane'
import fs from './shader/fragmentShader.glsl'
import vs from './shader/vertexShader.glsl'
import { CubeTexture } from './texture/CubeTexture'
import { Texture } from './texture/Texture'
import { TextureBase } from './texture/TextureBase'

export class Canvas {
  private plane?: Plane
  private events?: EventDispatcher
  private textures: TextureBase[] = []
  private camera: Camera

  constructor(canvas: HTMLCanvasElement) {
    webgl.setup(canvas)
    this.events = this.createEvents()
    this.camera = this.createCamera()

    const paths = ['matcap.png', 'px.jpg', 'py.jpg', 'pz.jpg', 'nx.jpg', 'ny.jpg', 'nz.jpg'].map((file) => `/images/${file}`)

    Texture.LoadImages(paths).then((images) => {
      this.createScreen(images)
      webgl.animation(this.render)
    })
  }

  private createEvents() {
    const events = new EventDispatcher(webgl.canvas)
    events.resize = this.handleResize
    return events
  }

  private handleResize = () => {
    if (this.camera instanceof PerspectiveCamera) {
      this.camera.aspect = webgl.size.aspect
    } else if (this.camera instanceof OrthographicCamera) {
      this.camera.left = -1 * webgl.size.aspect
      this.camera.right = 1 * webgl.size.aspect
    }

    this.camera.updateProjectionMatrix()
    this.plane?.unifrom.set('projectionMatrix', this.camera.projectionMatrix)
    this.plane?.unifrom.set('projectionMatrixInverse', this.camera.projectionMatrixInverse)
  }

  private createCamera() {
    const camera = new PerspectiveCamera({ fov: 45, aspect: webgl.size.aspect, near: 0.01, far: 10, position: [0, 0, 2] })

    // const camera = new OrthographicCamera({
    //   left: -1 * webgl.size.aspect,
    //   right: 1 * webgl.size.aspect,
    //   top: 1,
    //   bottom: -1,
    //   near: 0.01,
    //   far: 10,
    //   position: [0, 0, 6],
    // })
    camera.controls.dumping = 0.15
    return camera
  }

  private createScreen(images: HTMLImageElement[]) {
    const matcapImage = images.find((img) => img.src.includes('matcap'))!
    const matcap = new Texture(matcapImage)
    this.textures.push(matcap)

    const envmapImages = images.filter((img) => !img.src.includes('matcap'))
    const cubeTextureSource = CubeTexture.CreateSource(envmapImages)
    const cubeTexture = new CubeTexture(cubeTextureSource)
    this.textures.push(cubeTexture)

    this.plane = new Plane(vs, fs, { width: 2, height: 2 })
    // prettier-ignore
    this.plane.unifrom.addAll({
      uTime:                   { type: '1f',  value: 0 },
      uMatcap:                 { type: 't',   value: matcap },
      uEnvMap:                 { type: 't',   value: cubeTexture },
      cameraPosition:          { type: '3fv', value: this.camera.position },
      modelMatrix:             { type: 'm4',  value: this.plane.modelMatrix },
      viewMatrix:              { type: 'm4',  value: this.camera.viewMatrix },
      projectionMatrix:        { type: 'm4',  value: this.camera.projectionMatrix },
      viewMatrixInverse:       { type: 'm4',  value: this.camera.viewMatrixInverse },
      projectionMatrixInverse: { type: 'm4',  value: this.camera.projectionMatrixInverse },
      normalMatrix:            { type: 'm4',  value: null },
    })
  }

  private render = () => {
    this.camera.controls.update()

    this.plane?.unifrom.set('uTime', webgl.time.elapsed)
    this.plane?.unifrom.set('viewMatrix', this.camera.viewMatrix)
    this.plane?.unifrom.set('viewMatrixInverse', this.camera.viewMatrixInverse)
    this.plane?.unifrom.set('cameraPosition', this.camera.position)

    const normalMatrix = mat4.create()
    mat4.transpose(normalMatrix, this.camera.viewMatrixInverse)
    this.plane?.unifrom.set('normalMatrix', normalMatrix)

    this.plane?.render()
  }

  dispose() {
    webgl.dispose()
    this.plane?.dispose()
    this.textures.forEach((t) => t.dispose())
    this.camera?.dispose()
    this.events?.remove()
  }
}
