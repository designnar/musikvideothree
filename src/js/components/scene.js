import {
  Color,
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Mesh,
  SphereGeometry,
  MeshMatcapMaterial,
  AxesHelper,
  MeshLambertMaterial,
  DirectionalLight,
  AmbientLight,
  CircleGeometry,
  TorusGeometry,
  RepeatWrapping,
  BufferGeometry,
  BufferAttribute,
  MeshBasicMaterial,
  PointsMaterial,
  Points,
  Vector3,
  BoxGeometry,
  Object3D,
  InstancedMesh,
  AudioListener,  
  Audio,          
  AudioLoader,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Reflector } from 'three/addons/objects/Reflector.js'
import Stats from 'stats-js'
import LoaderManager from '@/js/managers/LoaderManager'
import GUI from 'lil-gui'
import vertexShader from '../glsl/main.vert'
import fragmentShader from '../glsl/main.frag'
import { randFloat } from 'three/src/math/MathUtils.js'
//import { reflector } from 'three/src/nodes/TSL.js'

console.log(vertexShader)
console.log(fragmentShader)



export default class MainScene {
  constructor() {
    this.canvas = document.querySelector('.scene')
    this.guiObj = {
      y: 0,
      showTitle: true,
       starColor: '#ff0000',  
       backgroundColor: '#000000'  
    }
     this.isZooming = false 
     this.angle = 0
       this.lastColorChange = 0  

    this.init()
  }

  init = async () => {
    // Preload assets before initiating the scene
    const assets = [
      {
        name: 'waterdudv',
        texture: './img/waterdudv.jpg',
      },
    ]

    await LoaderManager.load(assets)

    this.setStats()
    this.setGUI()
    this.setScene()
    this.setRender()
    this.setCamera()
    this.setControls()
   //this.setAxesHelper()

    this.handleResize()


    this.setSphere()
    this.setLights() 
    this.setStars()

    this.setReflector()

    

    // start RAF
    this.events()
  }

  /**
   * Our Webgl renderer, an object that will draw everything in our canvas
   * https://threejs.org/docs/?q=rend#api/en/renderers/WebGLRenderer
   */
  setRender() {
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    })
  }

  /**
   * This is our scene, we'll add any object
   * https://threejs.org/docs/?q=scene#api/en/scenes/Scene
   */
  setScene() {
    this.scene = new Scene()
    this.scene.background = new Color(0x000000)
  }

  /**
   * Our Perspective camera, this is the point of view that we'll have
   * of our scene.
   * A perscpective camera is mimicing the human eyes so something far we'll
   * look smaller than something close
   * https://threejs.org/docs/?q=pers#api/en/cameras/PerspectiveCamera
   */
  setCamera() {
    const aspectRatio = this.width / this.height
    const fieldOfView = 60
    const nearPlane = 0.1
    const farPlane = 10000

    this.camera = new PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane)
    this.camera.position.y = 1000
    this.camera.position.x = 1000
    this.camera.position.z = 1000
    this.camera.lookAt(0, 0, 0)

    this.scene.add(this.camera)
  }

  /**
   * Threejs controls to have controls on our scene
   * https://threejs.org/docs/?q=orbi#examples/en/controls/OrbitControls
   */
  setControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    // this.controls.dampingFactor = 0.04
  }

  /**
   * Axes Helper
   * https://threejs.org/docs/?q=Axesh#api/en/helpers/AxesHelper
   */
  setAxesHelper() {
    const axesHelper = new AxesHelper(3)
    this.scene.add(axesHelper)
  }

  /**
   * Create a SphereGeometry
   * https://threejs.org/docs/?q=box#api/en/geometries/SphereGeometry
   * with a Basic material
   * https://threejs.org/docs/?q=mesh#api/en/materials/MeshBasicMaterial
   */
  setSphere() {
    // kugle 
    const geometry = new SphereGeometry(1, 32, 32)
    const material = new MeshLambertMaterial({ color: '#ffffff' })

    this.sphereMesh = new Mesh(geometry, material)
    this.scene.add(this.sphereMesh)  // RETTET: var this.scene i stedet for this.#scene

  }

    // donut
    // const geometryTorus = new TorusGeometry(1, 0.4, 16, 100)
    // this.torusMesh = new Mesh(geometryTorus, material)

    // this.torusMesh.position.y = 8
    // this.torusMesh.position.x = 3
    // this.torusMesh.position.z = -2

    
    // this.scene.add(this.torusMesh)  // RETTET: var this.scene i stedet for this.#scene

  



  setLights() {
    const directionalLight = new DirectionalLight(0xffffff, 0.7)
   directionalLight.position.x = 1
    this.scene.add(directionalLight)  

    const light = new AmbientLight( 0x777777 ); // soft white light
this.scene.add( light );

  }

  setReflector(){
    // reflectors/mirrors

				
				const geometry = new CircleGeometry( 40, 64 );
				const customShader = Reflector.ReflectorShader

        customShader.vertexShader = vertexShader
        customShader.fragmentShader = fragmentShader

        const dudvMap = LoaderManager.assets['waterdudv'].texture
        dudvMap.wrapS = dudvMap.wrapT = RepeatWrapping
        customShader.uniforms.tDudv = { value: dudvMap}
        customShader.uniforms.time = { value: 0}
       

        this.groundMirror = new Reflector( geometry, {
          shader: customShader,
					clipBias: 0.003,
					textureWidth: window.innerWidth,
					textureHeight: window.innerHeight, 
					color: 0x000000
				} );
				this.groundMirror.position.y = 0;
				this.groundMirror.rotateX( - Math.PI / 2 );
				this.scene.add( this.groundMirror );
  }

setupAudio() {
  this.audioListener = new AudioListener()
  this.camera.add(this.audioListener)
  
  // Droplets lyd
  this.sound = new Audio(this.audioListener)
  const audioLoader = new AudioLoader()
  audioLoader.load('./audio/droplets.mp3', (buffer) => {
    this.sound.setBuffer(buffer)
    this.sound.setLoop(true)
    this.sound.setVolume(0.09)
  })
  
  // Westworld lyd (ny!)
  this.westworldSound = new Audio(this.audioListener)
  audioLoader.load('./audio/westworld.mp3', (buffer) => {
    this.westworldSound.setBuffer(buffer)
    this.westworldSound.setLoop(true)
    this.westworldSound.setVolume(1.0)
  })
}
 


  setStars() {
    const geometry = new BufferGeometry();
// create a simple square shape. We duplicate the top left and bottom right
// vertices because each vertex needs to appear once per triangle.
const vertices = []
const range = 200
for (let i = 0; i < 3000; i++) {
  const point = new Vector3(randFloat(-range, range), randFloat(10, 200), randFloat(-range, range))
  vertices.push(...point)
}

// itemSize = 3 because there are 3 values (components) per vertex
geometry.setAttribute( 'position', new BufferAttribute( new Float32Array(vertices), 3 ) );
this.starMaterial = new PointsMaterial({ color: 0xff0000 })  
const mesh = new Points(geometry, this.starMaterial)

this.scene.add(mesh)
  }



  /**
   * Build stats to display fps
   */
  setStats() {
    this.stats = new Stats()
    this.stats.showPanel(0)
    document.body.appendChild(this.stats.dom)
  }

setGUI() {
  const titleEl = document.querySelector('.main-title')

  const handleColorChange = () => {
    if (this.starMaterial) {
      this.starMaterial.color.set(this.guiObj.starColor)
    }
  }

  const handleBackgroundChange = () => {
    this.scene.background.set(this.guiObj.backgroundColor)
  }

  const gui = new GUI()
  gui.addColor(this.guiObj, 'starColor').name('Star Color').onChange(handleColorChange)
  gui.addColor(this.guiObj, 'backgroundColor').name('Background').onChange(handleBackgroundChange)  // ← TILFØJ DENNE LINJE
}

  /**
   * List of events
   */
  events() {
     window.addEventListener('resize', this.handleResize, { passive: true })

     window.addEventListener('keydown', this.handleKeyDown)
     window.addEventListener('keyup', this.handleKeyUp)
     window.addEventListener('click', this.handleClick, { once: true })

    this.draw(0)
  }

handleKeyDown = (event) => {
  if (event.code === 'Space') {
    this.isZooming = true
    
    // Start Westworld lyd
    if (this.westworldSound && !this.westworldSound.isPlaying) {
      this.westworldSound.play()
    }
  }
}

handleKeyUp = (event) => {
  if (event.code === 'Space') {
    this.isZooming = false
    
    // Stop Westworld lyd
    if (this.westworldSound && this.westworldSound.isPlaying) {
      this.westworldSound.pause()
    }
  }
}

handleClick = () => {
  // Skjul intro screen
  const introScreen = document.querySelector('.intro-screen')
  if (introScreen) {
    introScreen.classList.add('hidden')
  }
  
  if (!this.sound) {
    this.setupAudio()
  }
  
  // Vent 1 sekund, så lyden kan loade først
  setTimeout(() => {
    if (this.sound) {
      this.sound.play()
    }
  }, 1000)
}

// EVENTS
draw = (time) => {
  // ...
}

  // EVENTS

  /**
   * Request animation frame function
   * This function is called 60/time per seconds with no performance issue
   * Everything that happens in the scene is drawed here
   * @param {Number} now
   */
  draw = (time) => {
    // now: time in ms
    this.stats.begin()

    
    //bevægelse af kugle
   this.sphereMesh.position.y = Math.sin(time / 1500) + 2.2

    // bevægelse af donut
    // this.torusMesh.position.y = Math.sin(time / 750) + 6
    // // rotation af donut
    // this.torusMesh.rotation.y += 0.01
    // this.torusMesh.rotation.x += 0.01
    // this.torusMesh.rotation.z += 0.01

    // her får man vandet til at bevæge sig. Udommenter linje hvis det skal ligne is
    this.groundMirror.material.uniforms.time.value += 0.05

if (this.isZooming) {
  // Tjek afstand til kuglen
  const distance = Math.sqrt(
    this.camera.position.x ** 2 + 
    this.camera.position.y ** 2 + 
    this.camera.position.z ** 2
  )
  
  // Zoom kun hvis vi er længere væk end minimum afstand
  if (distance > 9) {
    const delta = time - (this.lastTime || time)
    this.lastTime = time
    const zoomSpeed = Math.pow(0.9991, delta / (1000 / 60))
    this.camera.position.x *= zoomSpeed
    this.camera.position.y *= zoomSpeed
    this.camera.position.z *= zoomSpeed
  }
  
  // Når kameraet er tæt nok, TILFØJ rotation
  if (distance < 10) {
    // Beregn nuværende vinkel UD FRA kameraets position
    this.angle = Math.atan2(this.camera.position.z, this.camera.position.x)
    
    // Tilføj rotation
    this.angle += 0.001
    
    const currentRadius = Math.sqrt(
      this.camera.position.x ** 2 + 
      this.camera.position.z ** 2
    )
    
    this.camera.position.x = Math.cos(this.angle) * currentRadius
    this.camera.position.z = Math.sin(this.angle) * currentRadius
  }

  // TILFØJ DETTE - Skift stjernefarve hver 500ms (halvt sekund)
  if (this.starMaterial && time - this.lastColorChange > 1000) {
    const randomColor = Math.random() * 0xffffff
    this.starMaterial.color.setHex(randomColor)
    this.lastColorChange = time
  }
  
  this.camera.lookAt(0, 0, 0)
}

     this.stats.end()
    this.raf = window.requestAnimationFrame(this.draw)

    if (this.controls) this.controls.update() // for damping
    this.renderer.render(this.scene, this.camera)

   

  }

  /**
   * On resize, we need to adapt our camera based
   * on the new window width and height and the renderer
   */
  handleResize = () => {
    this.width = window.innerWidth
    this.height = window.innerHeight

    // Update camera
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()

    const DPR = window.devicePixelRatio ? window.devicePixelRatio : 1

    this.renderer.setPixelRatio(DPR)
    this.renderer.setSize(this.width, this.height)
  }
}