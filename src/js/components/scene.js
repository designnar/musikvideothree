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
  ShaderMaterial,
  PointsMaterial,
  Points,
  Vector3,
  BoxGeometry,
  Object3D,
  InstancedMesh,
  AdditiveBlending,
  BackSide,
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
       backgroundColor: '#000000',
       starRotationSpeed: 0.00015  
    }
     this.isZooming = false 
     this.angle = 0
       this.lastColorChange = 0  
       this.lastFrameTime = 0

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
    const radius = 2.15
    this.sphereMesh = new Object3D()
    this.sphereMesh.position.y = 2.8

    this.rehoboamUniforms = {
      time: { value: 0 },
      baseColor: { value: new Color(0x050706) },
      redColor: { value: new Color(0xff2418) },
    }

    const sphereGeometry = new SphereGeometry(radius, 96, 64)
    const sphereMaterial = new ShaderMaterial({
      uniforms: this.rehoboamUniforms,
      vertexShader: `
        varying vec2 vSphereUv;
        varying vec3 vWorldNormal;

        void main() {
          vSphereUv = uv;
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 baseColor;
        uniform vec3 redColor;

        varying vec2 vSphereUv;
        varying vec3 vWorldNormal;

        float random(vec2 value) {
          return fract(sin(dot(value, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
          float rows = 42.0;
          float columns = 84.0;
          vec2 grid = vec2(vSphereUv.x * columns, vSphereUv.y * rows);
          vec2 cell = floor(grid);
          vec2 localCell = fract(grid);

          float horizontalGroove = 1.0 - smoothstep(0.035, 0.09, abs(localCell.y - 0.5));
          float verticalGrid = 1.0 - smoothstep(0.03, 0.12, abs(localCell.x - 0.5));
          float dataSeed = random(cell);
          float pulse = step(0.78, sin(time * 2.4 + cell.x * 0.28 + cell.y * 0.75) * 0.5 + 0.5);
          float dash = step(0.90, dataSeed) * pulse * smoothstep(0.12, 0.22, localCell.x) * (1.0 - smoothstep(0.78, 0.92, localCell.x));

          vec3 lightDirection = normalize(vec3(-0.3, 0.45, 0.8));
          float light = max(dot(normalize(vWorldNormal), lightDirection), 0.0);
          float fresnel = pow(1.0 - abs(vWorldNormal.z), 2.0);

          vec3 color = baseColor;
          color += vec3(0.035, 0.05, 0.045) * light;
          color += vec3(0.06, 0.07, 0.065) * horizontalGroove;
          color -= vec3(0.025) * verticalGrid;
          color += redColor * dash * 1.9;
          color += redColor * fresnel * 0.12;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    })

    const core = new Mesh(sphereGeometry, sphereMaterial)
    this.sphereMesh.add(core)

    const ringMaterial = new MeshBasicMaterial({ color: 0x141a16 })
    const redMaterial = new MeshBasicMaterial({
      color: 0xff2418,
      transparent: true,
      opacity: 0.88,
      blending: AdditiveBlending,
    })

    for (let i = 0; i < 32; i++) {
      const y = -radius * 0.86 + (i / 31) * radius * 1.72
      const ringRadius = Math.sqrt(radius ** 2 - y ** 2)
      const ringGeometry = new TorusGeometry(ringRadius + 0.035, 0.011, 8, 160)
      const ring = new Mesh(ringGeometry, ringMaterial)
      ring.rotation.x = Math.PI / 2
      ring.position.y = y
      this.sphereMesh.add(ring)
    }

    const dataGeometry = new BoxGeometry(0.24, 0.018, 0.045)
    for (let i = 0; i < 160; i++) {
      const y = randFloat(-radius * 0.78, radius * 0.78)
      const theta = randFloat(0, Math.PI * 2)
      const ringRadius = Math.sqrt(radius ** 2 - y ** 2) + 0.06
      const dataLight = new Mesh(dataGeometry, redMaterial)
      dataLight.position.set(
        Math.cos(theta) * ringRadius,
        y,
        Math.sin(theta) * ringRadius
      )
      dataLight.rotation.y = Math.PI / 2 - theta
      dataLight.scale.x = randFloat(0.6, 1.9)
      this.sphereMesh.add(dataLight)
    }

    const glowGeometry = new SphereGeometry(radius * 1.06, 64, 48)
    const glowMaterial = new MeshBasicMaterial({
      color: 0x55110d,
      transparent: true,
      opacity: 0.13,
      blending: AdditiveBlending,
      side: BackSide,
    })
    this.sphereMesh.add(new Mesh(glowGeometry, glowMaterial))

    this.scene.add(this.sphereMesh)

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
    const starCount = 3000
    const range = 200
    const geometry = new BoxGeometry(0.7, 0.7, 0.7)
    this.starMaterial = new MeshBasicMaterial({ color: 0xff0000 })
    this.starMesh = new InstancedMesh(geometry, this.starMaterial, starCount)
    const star = new Object3D()

    for (let i = 0; i < starCount; i++) {
      star.position.set(
        randFloat(-range, range),
        randFloat(10, 200),
        randFloat(-range, range)
      )
      star.rotation.set(
        randFloat(0, Math.PI),
        randFloat(0, Math.PI),
        randFloat(0, Math.PI)
      )
      const size = randFloat(0.4, 1.4)
      star.scale.set(size, size, size)
      star.updateMatrix()
      this.starMesh.setMatrixAt(i, star.matrix)
    }

    this.starMesh.instanceMatrix.needsUpdate = true
    this.scene.add(this.starMesh)
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
	  gui.add(this.guiObj, 'starRotationSpeed', -0.001, 0.001, 0.00001).name('Star Speed')
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

    
	    // Bevægelse af Rehoboam-kuglen
		    this.sphereMesh.position.y = Math.sin(time / 1500) + 2.8
	    if (this.rehoboamUniforms) {
	      this.rehoboamUniforms.time.value = time * 0.001
	    }

    // bevægelse af donut
    // this.torusMesh.position.y = Math.sin(time / 750) + 6
    // // rotation af donut
    // this.torusMesh.rotation.y += 0.01
    // this.torusMesh.rotation.x += 0.01
    // this.torusMesh.rotation.z += 0.01

	    // her får man vandet til at bevæge sig. Udommenter linje hvis det skal ligne is
	    this.groundMirror.material.uniforms.time.value += 0.05

	    const delta = time - this.lastFrameTime
	    this.lastFrameTime = time

	    if (this.starMesh) {
	      this.starMesh.rotation.y += delta * this.guiObj.starRotationSpeed
	    }

	    if (this.sphereMesh) {
	      this.sphereMesh.rotation.y += delta * 0.00008
	    }
	
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
