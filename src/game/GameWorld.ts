import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  CharacterRig,
  VehicleRig,
  createThiefModel,
  createPoliceModel,
  createCitizenModel,
  createCNGModel,
  createRickshawModel,
  createDhakaBusModel,
  createPoliceCarModel,
  createDhakaBuilding,
  createElectricPoleWithWires,
  createDetailedMarketStalls,
  createRoadsideTree,
  createStreetLight,
  createMissionWaypointMarker,
} from './modelGenerators';
import {
  createDetailedRoadTexture,
  createFootpathTexture,
} from './proceduralTextures';
import { soundEngine } from '../audio/SoundFX';
import { Mission, PlayerStats, TimeOfDay, WeatherType } from '../types/game';

// Device & WebGL capability detection
const isMobileDevice = (() => {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent);
})();

const isSoftwareGl = (() => {
  if (typeof document === 'undefined') return true;
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
})();

// Reusable math variables to eliminate per-frame GC allocations
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _vec3Cam = new THREE.Vector3();

interface SparkParticle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  active: boolean;
}

interface TrafficVehicle {
  rig: VehicleRig;
  laneZDir: number; // 1 (North) or -1 (South)
  targetSpeed: number;
  currentSpeed: number;
  xLane: number;
}

export class GameWorld {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private container: HTMLElement;

  // Player Character
  public playerRig: CharacterRig;
  public playerPos: THREE.Vector3 = new THREE.Vector3(0, 0, 8);
  public playerRot: number = 0;
  private targetPlayerRot: number = 0;
  private playerVelY: number = 0;
  private isGrounded: boolean = true;
  public isSprinting: boolean = false;
  private isPunching: boolean = false;
  private punchTimer: number = 0;

  // Drivable Vehicles & Traffic
  public drivableCng: VehicleRig;
  public drivableRickshaw: VehicleRig;
  public drivableBus: VehicleRig;
  public drivablePoliceCar: VehicleRig;
  public activeVehicle: VehicleRig | null = null;
  public trafficVehicles: TrafficVehicle[] = [];

  // Crowd NPCs & Police
  public npcs: {
    rig: CharacterRig;
    target: THREE.Vector3;
    speed: number;
    isPanicking: boolean;
    state: 'WALKING' | 'IDLE';
    idleTimer: number;
    frameSkip: number;
  }[] = [];
  public policeOfficers: { rig: CharacterRig; patrolPos: THREE.Vector3; speed: number }[] = [];

  // Particle System Pools (Zero Garbage Collection)
  private sparkPool: SparkParticle[] = [];
  private rainParticles: THREE.Points | null = null;

  // Lighting & Environment
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private currentQuality: 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA' = 'HIGH';

  // Timing & Game Loop
  private frameId: number = 0;
  private lastTime: number = 0;
  private isRunning: boolean = false;

  // Real-time Performance Metrics
  public perf = {
    fps: 60,
    frameTimeMs: 16.6,
    drawCalls: 0,
    triangles: 0,
    activeNPCs: 0,
    activeVehicles: 0,
  };
  private frameCounter: number = 0;
  private fpsTimer: number = 0;

  // Inputs
  public inputMove = { x: 0, y: 0 };
  public inputSprint = false;
  public inputJump = false;
  public inputSteer = 0; // -1 (left), 1 (right)
  public inputThrottle = 0; // 1 (gas forward), -1 (brake/reverse)

  // Player Stats
  public stats: PlayerStats = {
    money: 25750,
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    wantedLevel: 1,
    isDriving: false,
    drivingVehicleType: null,
    speedKmh: 0,
  };

  private footstepTimer: number = 0;
  public activeMission: Mission | null = null;
  public missionDistance: number | null = null;
  public waypointMarker: {
    group: THREE.Group;
    lightPillar: THREE.Mesh;
    groundRing: THREE.Mesh;
    iconMesh: THREE.Mesh;
  } | null = null;
  private currentWaypointType: string | null = null;
  public isTitleMode: boolean = false;

  public onMissionObjectiveReached?: () => void;
  public onPoliceArrest?: () => void;
  public onNearShop?: (shopName: string, promptText: string) => void;
  public onLeaveShop?: () => void;
  public onPunchHit?: (pos: THREE.Vector3) => void;

  public currentNearShop: string | null = null;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene & Sky Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x38bdf8); // Dhaka sky blue
    this.scene.fog = new THREE.FogExp2(0x7dd3fc, 0.008);

    // 2. Camera with 60 FOV
    this.camera = new THREE.PerspectiveCamera(
      56,
      container.clientWidth / container.clientHeight,
      0.1,
      250
    );

    // 3. High-Performance WebGL Renderer
    const enableShadows = !isMobileDevice && !isSoftwareGl;
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isMobileDevice && !isSoftwareGl,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
      alpha: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(isMobileDevice ? 1.0 : Math.min(window.devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = enableShadows;
    if (enableShadows) {
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    container.appendChild(this.renderer.domElement);

    // 4. Studio Environment Lighting
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Lighting Setup
    this.dirLight = new THREE.DirectionalLight(0xfffbeb, 2.0);
    this.dirLight.position.set(45, 75, 40);
    this.dirLight.castShadow = enableShadows;
    if (enableShadows) {
      this.dirLight.shadow.mapSize.width = 1024;
      this.dirLight.shadow.mapSize.height = 1024;
      this.dirLight.shadow.camera.near = 10;
      this.dirLight.shadow.camera.far = 160;
      const d = 50;
      this.dirLight.shadow.camera.left = -d;
      this.dirLight.shadow.camera.right = d;
      this.dirLight.shadow.camera.top = d;
      this.dirLight.shadow.camera.bottom = -d;
      this.dirLight.shadow.bias = -0.0005;
      this.dirLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.dirLight);

    this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x854d0e, 0.75);
    this.scene.add(this.hemiLight);

    // 6. Pre-Allocate Hit Spark Particle Pool
    this.initSparkPool();

    // 7. Build Dhaka City District
    this.buildDenseDhakaCity();

    // 8. Spawn Hero Thief Player Character
    this.playerRig = createThiefModel();
    this.playerRig.root.position.copy(this.playerPos);
    this.scene.add(this.playerRig.root);

    // 9. Spawn Drivable Vehicles (CNG, Rickshaw, Bus, Police Cruiser)
    this.drivableCng = createCNGModel();
    this.drivableCng.root.position.set(-9.2, 0, -4);
    this.drivableCng.root.rotation.y = 0.1;
    this.scene.add(this.drivableCng.root);

    this.drivableRickshaw = createRickshawModel();
    this.drivableRickshaw.root.position.set(9.2, 0, 16);
    this.drivableRickshaw.root.rotation.y = Math.PI - 0.1;
    this.scene.add(this.drivableRickshaw.root);

    this.drivableBus = createDhakaBusModel();
    this.drivableBus.root.position.set(4.2, 0, -45);
    this.scene.add(this.drivableBus.root);

    this.drivablePoliceCar = createPoliceCarModel();
    this.drivablePoliceCar.root.position.set(-4.5, 0, 35);
    this.drivablePoliceCar.root.rotation.y = Math.PI;
    this.scene.add(this.drivablePoliceCar.root);

    // 10. Moving Traffic System
    this.spawnMovingTraffic();

    // 11. Diverse Crowd NPCs & Police
    this.spawnCrowdNPCs();
    this.spawnPoliceOfficers();

    // 12. Monsoon Rain Particles
    this.initRainParticles();

    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private initSparkPool() {
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const sparkGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    for (let i = 0; i < 24; i++) {
      const mesh = new THREE.Mesh(sparkGeo, sparkMat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.sparkPool.push({
        mesh,
        vel: new THREE.Vector3(),
        life: 0,
        active: false,
      });
    }
  }

  public setGraphicsQuality(q: 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA') {
    this.currentQuality = q;
    if (q === 'LOW') {
      this.renderer.setPixelRatio(1.0);
      this.renderer.shadowMap.enabled = false;
      this.dirLight.castShadow = false;
      if (this.scene.fog) (this.scene.fog as THREE.FogExp2).density = 0.012;
    } else if (q === 'MEDIUM') {
      this.renderer.setPixelRatio(1.0);
      this.renderer.shadowMap.enabled = false;
      this.dirLight.castShadow = false;
      if (this.scene.fog) (this.scene.fog as THREE.FogExp2).density = 0.009;
    } else if (q === 'HIGH') {
      this.renderer.setPixelRatio(isMobileDevice ? 1.0 : 1.25);
      this.renderer.shadowMap.enabled = !isMobileDevice && !isSoftwareGl;
      this.dirLight.castShadow = this.renderer.shadowMap.enabled;
      if (this.scene.fog) (this.scene.fog as THREE.FogExp2).density = 0.008;
    } else if (q === 'ULTRA') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      this.renderer.shadowMap.enabled = true;
      this.dirLight.castShadow = true;
      if (this.scene.fog) (this.scene.fog as THREE.FogExp2).density = 0.006;
    }
  }

  private buildDenseDhakaCity() {
    // 1. Ground Foundation
    const groundGeo = new THREE.PlaneGeometry(320, 320);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.95 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Central 4-Lane Dhaka Avenue (North-South, 18m wide)
    const roadTex = createDetailedRoadTexture();
    const roadMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.8 });
    const mainRoad = new THREE.Mesh(new THREE.PlaneGeometry(18, 280), roadMat);
    mainRoad.rotation.x = -Math.PI / 2;
    mainRoad.position.set(0, 0.02, 0);
    mainRoad.receiveShadow = true;
    this.scene.add(mainRoad);

    // 3. Interlocking Footpaths with Hazard Curbs (West and East Sidewalks)
    const footpathTex = createFootpathTexture();
    const footpathMat = new THREE.MeshStandardMaterial({ map: footpathTex, roughness: 0.85 });

    const westFootpath = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.22, 280), footpathMat);
    westFootpath.position.set(-12.25, 0.11, 0);
    westFootpath.receiveShadow = true;
    this.scene.add(westFootpath);

    const eastFootpath = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.22, 280), footpathMat);
    eastFootpath.position.set(12.25, 0.11, 0);
    eastFootpath.receiveShadow = true;
    this.scene.add(eastFootpath);

    // 4. Dense Multi-Storey Dhaka Buildings
    const westBuildings = [
      {
        w: 16, h: 22, d: 15, z: -85,
        wall: '#fcd34d', trim: '#fef08a',
        title: 'ঢাকা সুইটস ও মিষ্টি ভাণ্ডার', sub: 'খাঁটি ছানার রসগোল্লা, চমচম ও দধি', phone: '০১৭০০-১২৩৪৫৬',
        bg: '#dc2626', icon: '🍬', brick: false
      },
      {
        w: 18, h: 18, d: 15, z: -55,
        wall: '#fed7aa', trim: '#fdba74',
        title: 'ভাই ভাই ডিপার্টমেন্টাল স্টোর', sub: 'নিত্যপ্রয়োজনীয় সকল মুদি ও খাদ্য সামগ্রী', phone: '০১৯১১-২২৩৩৪৪',
        bg: '#16a34a', icon: '🛒', brick: true
      },
      {
        w: 16, h: 24, d: 15, z: -25,
        wall: '#bae6fd', trim: '#38bdf8',
        title: 'মায়ের দোয়া ফার্মেসী ও ড্রাগ হাউজ', sub: '২৪ ঘণ্টা জরুরি ওষুধ ও অক্সিজেন সেবা', phone: '০১৮২০-৫৫৫৬৬৬',
        bg: '#0284c7', icon: '💊', brick: false
      },
      {
        w: 17, h: 16, d: 15, z: 8,
        wall: '#fbcfe8', trim: '#f472b6',
        title: 'সোনার বাংলা রেস্তোরাঁ ও বিরিয়ানি', sub: 'ঢাকার ঐতিহ্যবাহী কাচ্চি বিরিয়ানি ও বোরহানি', phone: '০১৬০০-৭৭৮৮৯৯',
        bg: '#b91c1c', icon: '🍗', brick: false
      },
      {
        w: 16, h: 20, d: 15, z: 40,
        wall: '#bbf7d0', trim: '#86efac',
        title: 'নিউ ফ্যাশন টেইলার্স ও ফেব্রিক্স', sub: 'শার্ট, প্যান্ট, স্যুট ও পাঞ্জাবি তৈরি', phone: '০১৫০০-৯৯৮৮৭৭',
        bg: '#7c3aed', icon: '✂️', brick: true
      },
      {
        w: 18, h: 22, d: 15, z: 75,
        wall: '#e2e8f0', trim: '#94a3b8',
        title: 'জনতা হার্ডওয়্যার ও স্যানিটারি', sub: 'রং, পাইপ, মোটর ও ইলেকট্রিক সামগ্রী', phone: '০১৯০০-১১২২৩৩',
        bg: '#ea580c', icon: '🔧', brick: false
      },
    ];

    westBuildings.forEach((b) => {
      const bMesh = createDhakaBuilding(
        b.w, b.h, b.d, b.wall, b.trim, b.title, b.sub, b.phone, b.bg, b.icon, b.brick
      );
      bMesh.position.set(-23.5, 0, b.z);
      this.scene.add(bMesh);
    });

    const eastBuildings = [
      {
        w: 17, h: 20, d: 15, z: -80,
        wall: '#fef08a', trim: '#facc15',
        title: 'পদ্মার রূপালী ইলিশ মাছের আড়ৎ', sub: 'তাজা বড় ইলিশ, রুই ও সামুদ্রিক মাছ', phone: '০১৭০০-৩৩৪৪৫৫',
        bg: '#0369a1', icon: '🐟', brick: false
      },
      {
        w: 16, h: 24, d: 15, z: -50,
        wall: '#cbd5e1', trim: '#64748b',
        title: 'বাংলাদেশ পুলিশ কন্ট্রোল ফাঁড়ি', sub: 'আইনশৃঙ্খলা রক্ষা ও জননিরাপত্তা সেল', phone: '৯৯৯ / জরুরি কল',
        bg: '#1e3a8a', icon: '🚨', brick: true
      },
      {
        w: 18, h: 18, d: 15, z: -18,
        wall: '#fde047', trim: '#ca8a04',
        title: 'মায়ের দোয়া টং ক্যাফে', sub: 'স্পেশাল মালাই দুধ চা ও টাটকা বাকরখানি', phone: '০১৮১১-৬৬৭৭৮৮',
        bg: '#92400e', icon: '☕', brick: false
      },
      {
        w: 16, h: 22, d: 15, z: 15,
        wall: '#fed7aa', trim: '#ea580c',
        title: 'কাঁচা বাজার পাইকারি ভাণ্ডার', sub: 'টাটকা বেগুন, টমেটো, আলু ও কাঁচা মরিচ', phone: '০১৯০০-৪৪৩৩২২',
        bg: '#15803d', icon: '🥦', brick: false
      },
      {
        w: 17, h: 16, d: 15, z: 48,
        wall: '#fecdd3', trim: '#e11d48',
        title: 'ঢাকা সিটি ইলেকট্রনিক্স ও মোবাইল', sub: 'নতুন মোবাইল, চার্জার ও গ্যাজেটস', phone: '০১৬১১-৫৫৪৪৩৩',
        bg: '#4338ca', icon: '📱', brick: true
      },
      {
        w: 18, h: 22, d: 15, z: 82,
        wall: '#f5d0fe', trim: '#c026d3',
        title: 'রাজধানী বাস টিকিট কাউন্টার', sub: 'সকল জেলার দূরপাল্লার এসি ও নন-এসি বাস', phone: '০১৭৭৭-৮৮৯৯০০',
        bg: '#b91c1c', icon: '🚌', brick: false
      },
    ];

    eastBuildings.forEach((b) => {
      const bMesh = createDhakaBuilding(
        b.w, b.h, b.d, b.wall, b.trim, b.title, b.sub, b.phone, b.bg, b.icon, b.brick
      );
      bMesh.position.set(23.5, 0, b.z);
      this.scene.add(bMesh);
    });

    // 5. Electric Utility Poles & Cables
    for (let z = -90; z <= 90; z += 30) {
      const poleW = createElectricPoleWithWires();
      poleW.position.set(-10.5, 0, z);
      this.scene.add(poleW);

      const poleE = createElectricPoleWithWires();
      poleE.position.set(10.5, 0, z);
      poleE.rotation.y = Math.PI;
      this.scene.add(poleE);

      // Overhead drooping cable wire across the road
      const cableCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-10.5, 7.8, z),
        new THREE.Vector3(0, 6.2, z),
        new THREE.Vector3(10.5, 7.8, z)
      );
      const cableGeo = new THREE.TubeGeometry(cableCurve, 8, 0.02, 4, false);
      const cableMesh = new THREE.Mesh(cableGeo, new THREE.MeshBasicMaterial({ color: 0x09090b }));
      this.scene.add(cableMesh);
    }

    // 6. Street Lamp Posts
    for (let z = -75; z <= 75; z += 35) {
      const lampW = createStreetLight();
      lampW.position.set(-9.8, 0, z);
      lampW.rotation.y = Math.PI / 2;
      this.scene.add(lampW);

      const lampE = createStreetLight();
      lampE.position.set(9.8, 0, z);
      lampE.rotation.y = -Math.PI / 2;
      this.scene.add(lampE);
    }

    // 7. Roadside Trees
    for (let z = -80; z <= 80; z += 40) {
      const treeW = createRoadsideTree();
      treeW.position.set(-14.2, 0, z + 15);
      this.scene.add(treeW);

      const treeE = createRoadsideTree();
      treeE.position.set(14.2, 0, z - 15);
      this.scene.add(treeE);
    }

    // 8. Sidewalk Market Stalls
    const marketWest = createDetailedMarketStalls();
    marketWest.position.set(-13.5, 0.22, 12);
    marketWest.rotation.y = Math.PI / 2;
    this.scene.add(marketWest);

    const marketEast = createDetailedMarketStalls();
    marketEast.position.set(13.5, 0.22, -35);
    marketEast.rotation.y = -Math.PI / 2;
    this.scene.add(marketEast);
  }

  private spawnMovingTraffic() {
    // 1. Red Dhaka City Bus cruising North
    const bus = createDhakaBusModel();
    bus.root.position.set(4.2, 0, 75);
    this.scene.add(bus.root);
    this.trafficVehicles.push({
      rig: bus,
      laneZDir: 1,
      targetSpeed: 10,
      currentSpeed: 9.5,
      xLane: 4.2,
    });

    // 2. Green CNG Auto-Rickshaw cruising South
    const cngTraffic = createCNGModel();
    cngTraffic.root.position.set(-4.2, 0, 50);
    cngTraffic.root.rotation.y = Math.PI;
    this.scene.add(cngTraffic.root);
    this.trafficVehicles.push({
      rig: cngTraffic,
      laneZDir: -1,
      targetSpeed: 12,
      currentSpeed: 11,
      xLane: -4.2,
    });

    // 3. Traditional Rickshaw cruising North
    const rickshawTraffic = createRickshawModel();
    rickshawTraffic.root.position.set(6.8, 0, -20);
    this.scene.add(rickshawTraffic.root);
    this.trafficVehicles.push({
      rig: rickshawTraffic,
      laneZDir: 1,
      targetSpeed: 4.5,
      currentSpeed: 4.2,
      xLane: 6.8,
    });

    // 4. Police Patrol Cruiser cruising South
    const policeCar = createPoliceCarModel();
    policeCar.root.position.set(-4.5, 0, -60);
    policeCar.root.rotation.y = Math.PI;
    this.scene.add(policeCar.root);
    this.trafficVehicles.push({
      rig: policeCar,
      laneZDir: -1,
      targetSpeed: 13,
      currentSpeed: 12.5,
      xLane: -4.5,
    });
  }

  private spawnCrowdNPCs() {
    const archetypes = ['SHOPKEEPER', 'ELDER', 'STUDENT', 'WOMAN', 'PULLER'] as const;
    const colors = [0xef4444, 0x10b981, 0x3b82f6, 0xf59e0b, 0x8b5cf6, 0xec4899, 0x14b8a6, 0xf97316];

    for (let i = 0; i < 18; i++) {
      const arch = archetypes[i % archetypes.length];
      const col = colors[i % colors.length];
      const rig = createCitizenModel(arch, col);

      const isWest = i % 2 === 0;
      const x = (isWest ? -1 : 1) * (11.5 + (Math.random() * 3 - 1.5));
      const z = -85 + (i * 170) / 18 + (Math.random() * 6 - 3);

      rig.root.position.set(x, 0.22, z);
      this.scene.add(rig.root);

      this.npcs.push({
        rig,
        target: new THREE.Vector3(x, 0.22, z + (Math.random() * 30 - 15)),
        speed: 1.2 + Math.random() * 0.8,
        isPanicking: false,
        state: 'WALKING',
        idleTimer: 0,
        frameSkip: i % 2,
      });
    }
  }

  private spawnPoliceOfficers() {
    const spawns = [
      new THREE.Vector3(12.5, 0.22, -45),
      new THREE.Vector3(-12.5, 0.22, 25),
      new THREE.Vector3(0, 0, 95),
    ];

    spawns.forEach((pt) => {
      const rig = createPoliceModel();
      rig.root.position.copy(pt);
      this.scene.add(rig.root);

      this.policeOfficers.push({
        rig,
        patrolPos: pt.clone(),
        speed: 2.5,
      });
    });
  }

  private initRainParticles() {
    const count = 3000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 140;
      pos[i * 3 + 1] = Math.random() * 45;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 180;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xbae6fd,
      size: 0.16,
      transparent: true,
      opacity: 0.65,
    });
    this.rainParticles = new THREE.Points(geo, mat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }

  public setEnvironmentTime(time: TimeOfDay, weather: WeatherType) {
    if (time === 'DAY') {
      this.scene.background = new THREE.Color(0x38bdf8);
      if (this.scene.fog) (this.scene.fog as THREE.FogExp2).color.set(0x7dd3fc);
      this.dirLight.color.set(0xfffbeb);
      this.dirLight.intensity = 2.0;
      this.hemiLight.color.set(0xe0f2fe);
      this.hemiLight.groundColor.set(0x854d0e);
    } else if (time === 'SUNSET') {
      this.scene.background = new THREE.Color(0xf97316);
      if (this.scene.fog) (this.scene.fog as THREE.FogExp2).color.set(0xfdba74);
      this.dirLight.color.set(0xf97316);
      this.dirLight.intensity = 2.2;
      this.hemiLight.color.set(0xfed7aa);
      this.hemiLight.groundColor.set(0x7c2d12);
    } else if (time === 'NIGHT') {
      this.scene.background = new THREE.Color(0x0a0a14);
      if (this.scene.fog) (this.scene.fog as THREE.FogExp2).color.set(0x0f172a);
      this.dirLight.color.set(0x38bdf8);
      this.dirLight.intensity = 0.55;
      this.hemiLight.color.set(0x1e293b);
      this.hemiLight.groundColor.set(0x020617);
    } else if (time === 'DAWN') {
      this.scene.background = new THREE.Color(0xf472b6);
      if (this.scene.fog) (this.scene.fog as THREE.FogExp2).color.set(0xfbcfe8);
      this.dirLight.color.set(0xfde047);
      this.dirLight.intensity = 1.5;
      this.hemiLight.color.set(0xfce7f3);
    }

    if (this.rainParticles) {
      this.rainParticles.visible = weather === 'RAIN';
    }
  }

  // Instant Cartoon Punch / Slap Action ("ঢিসুম!") - < 1ms response
  public performPunch() {
    if (this.isPunching || this.stats.isDriving) return;
    this.isPunching = true;
    this.punchTimer = 0.32;

    soundEngine.playPunch();

    const punchPos = _vec3A.copy(this.playerPos).add(
      new THREE.Vector3(Math.sin(this.playerRot) * 1.5, 0.9, Math.cos(this.playerRot) * 1.5)
    );

    this.spawnHitSparks(punchPos);

    // Hit nearby NPCs
    for (const npc of this.npcs) {
      if (npc.rig.root.position.distanceTo(punchPos) < 2.3) {
        npc.isPanicking = true;
        const pushDir = _vec3B.copy(npc.rig.root.position).sub(this.playerPos).normalize();
        npc.rig.root.position.addScaledVector(pushDir, 2.2);
        npc.rig.root.rotation.z = (Math.random() > 0.5 ? 1 : -1) * 0.45;

        this.stats.money += 350;
        soundEngine.playCoin();
        this.addWantedLevel(1);
        soundEngine.speakBengali('আরে চোর চোর! আমাকে মারলো কেন রে!', 1.25, 1.15);

        if (this.onPunchHit) this.onPunchHit(npc.rig.root.position);
        break;
      }
    }

    // Hit Police
    for (const cop of this.policeOfficers) {
      if (cop.rig.root.position.distanceTo(punchPos) < 2.3) {
        const pushDir = _vec3B.copy(cop.rig.root.position).sub(this.playerPos).normalize();
        cop.rig.root.position.addScaledVector(pushDir, 2.5);
        this.addWantedLevel(2);
        soundEngine.playPoliceWhistle();
        soundEngine.speakBengali('সাহস কত! পুলিশের গায়ে হাত!', 1.0, 1.1);
        break;
      }
    }
  }

  // Instant Jump Action Trigger
  public triggerJumpImmediate() {
    if (this.isGrounded && !this.stats.isDriving) {
      this.playerVelY = 8.2;
      this.isGrounded = false;
      soundEngine.playJump();
    }
  }

  // Reuse particles from pool (Zero Allocations)
  private spawnHitSparks(pos: THREE.Vector3) {
    let count = 0;
    for (const p of this.sparkPool) {
      if (!p.active) {
        p.active = true;
        p.life = 0.32;
        p.mesh.position.copy(pos);
        p.mesh.visible = true;
        p.vel.set(
          (Math.random() - 0.5) * 6.5,
          Math.random() * 5.0 + 2.0,
          (Math.random() - 0.5) * 6.5
        );
        count++;
        if (count >= 8) break;
      }
    }
  }

  // Enter / Exit Vehicle (CNG, Rickshaw, Bus, Police Cruiser)
  public toggleVehicle() {
    if (this.stats.isDriving) {
      // Exit Vehicle
      if (this.activeVehicle) {
        this.playerPos.copy(this.activeVehicle.root.position);
        this.playerPos.x += 1.8;
        this.playerRig.root.position.copy(this.playerPos);
        this.playerRig.root.visible = true;
      }
      this.stats.isDriving = false;
      this.stats.drivingVehicleType = null;
      this.stats.speedKmh = 0;
      this.activeVehicle = null;
      soundEngine.setCngEngine(false);
    } else {
      // Enter nearby Vehicle
      const checkVehicles: { rig: VehicleRig; type: PlayerStats['drivingVehicleType'] }[] = [
        { rig: this.drivableCng, type: 'CNG' },
        { rig: this.drivableRickshaw, type: 'RICKSHAW' },
        { rig: this.drivableBus, type: 'BUS' },
        { rig: this.drivablePoliceCar, type: 'POLICE_CAR' },
      ];

      for (const v of checkVehicles) {
        if (this.playerPos.distanceTo(v.rig.root.position) < 4.0) {
          this.activeVehicle = v.rig;
          this.stats.isDriving = true;
          this.stats.drivingVehicleType = v.type;
          this.playerRig.root.visible = false;
          soundEngine.speakBengali('গাড়ির চাকা ঘুরাও মামা!', 1.15, 1.1);
          break;
        }
      }
    }
  }

  public honkVehicleHorn() {
    if (this.stats.isDriving && this.activeVehicle?.vehicleType === 'RICKSHAW') {
      soundEngine.playRickshawBell();
    } else {
      soundEngine.playHorn();
    }
  }

  public addWantedLevel(amount: number) {
    this.stats.wantedLevel = Math.min(5, this.stats.wantedLevel + amount);
    if (this.stats.wantedLevel >= 1) {
      soundEngine.setPoliceSiren(true);
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    soundEngine.startDhakaMegaphone();

    const tick = (now: number) => {
      if (!this.isRunning) return;
      const rawDt = (now - this.lastTime) * 0.001;
      this.lastTime = now;
      const dt = Math.min(rawDt, 0.05); // Cap delta time at 50ms to prevent collision tunnel glitches

      this.update(dt);
      this.renderer.render(this.scene, this.camera);

      // Measure performance
      this.frameCounter++;
      this.fpsTimer += dt;
      if (this.fpsTimer >= 0.5) {
        this.perf.fps = Math.round(this.frameCounter / this.fpsTimer);
        this.perf.frameTimeMs = +(dt * 1000).toFixed(1);
        this.perf.drawCalls = this.renderer.info.render.calls;
        this.perf.triangles = this.renderer.info.render.triangles;
        this.perf.activeNPCs = this.npcs.length;
        this.perf.activeVehicles = this.trafficVehicles.length;
        this.frameCounter = 0;
        this.fpsTimer = 0;
      }

      this.frameId = requestAnimationFrame(tick);
    };

    this.frameId = requestAnimationFrame(tick);
  }

  public stop() {
    this.isRunning = false;
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = 0;
    }
    soundEngine.stopDhakaMegaphone();
    soundEngine.setPoliceSiren(false);
    soundEngine.setCngEngine(false);
  }

  private update(dt: number) {
    // 1. Update Spark Particles from pool
    for (const p of this.sparkPool) {
      if (p.active) {
        p.life -= dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.vel.y -= 14 * dt;
        if (p.life <= 0) {
          p.active = false;
          p.mesh.visible = false;
        }
      }
    }

    // 2. Monsoon Rain Animation
    if (this.rainParticles && this.rainParticles.visible) {
      const pos = this.rainParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] -= 32 * dt;
        if (pos[i] < 0) pos[i] = 45;
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Player Movement or Vehicle Physics
    if (this.stats.isDriving && this.activeVehicle) {
      this.updateActiveVehicle(dt);
    } else {
      this.updatePlayerWalking(dt);
    }

    // 4. Moving Traffic System
    this.updateTraffic(dt);

    // 5. Crowd NPCs AI & Animations with LOD
    this.updateCrowdNPCs(dt);

    // 6. Bangladesh Police Patrol & Pursuit
    this.updatePolice(dt);

    // 7. Check Shop Proximity & Active Objective
    this.checkProximities();

    // 8. 3D Waypoint Light Pillar & Marker Animation
    this.updateWaypointMarker(dt);

    // 9. Third-Person Smooth Damped Camera
    this.updateCamera(dt);
  }

  private updatePlayerWalking(dt: number) {
    if (!this.inputSprint && this.stats.stamina < this.stats.maxStamina) {
      this.stats.stamina = Math.min(this.stats.maxStamina, this.stats.stamina + 20 * dt);
    }

    const isMoving = Math.abs(this.inputMove.x) > 0.05 || Math.abs(this.inputMove.y) > 0.05;
    this.isSprinting = this.inputSprint && this.stats.stamina > 5 && isMoving;
    if (this.isSprinting) {
      this.stats.stamina = Math.max(0, this.stats.stamina - 28 * dt);
    }

    const moveSpeed = this.isSprinting ? 9.8 : 4.8;

    if (isMoving) {
      this.targetPlayerRot = Math.atan2(this.inputMove.x, this.inputMove.y);
      // Smooth angular interpolation
      this.playerRot = THREE.MathUtils.lerp(this.playerRot, this.targetPlayerRot, Math.min(1.0, 14 * dt));

      const dx = Math.sin(this.playerRot) * moveSpeed * dt;
      const dz = Math.cos(this.playerRot) * moveSpeed * dt;

      this.playerPos.x += dx;
      this.playerPos.z += dz;

      // Bound within Dhaka district
      this.playerPos.x = Math.max(-28, Math.min(28, this.playerPos.x));
      this.playerPos.z = Math.max(-120, Math.min(120, this.playerPos.z));

      // Footsteps
      this.footstepTimer += dt;
      if (this.footstepTimer > (this.isSprinting ? 0.23 : 0.38)) {
        this.footstepTimer = 0;
        soundEngine.playFootstep(this.isSprinting);
      }
    }

    // Jump Physics
    if (this.inputJump && this.isGrounded) {
      this.triggerJumpImmediate();
      this.inputJump = false;
    }

    if (!this.isGrounded) {
      this.playerVelY -= 24 * dt;
      this.playerPos.y += this.playerVelY * dt;
      if (this.playerPos.y <= 0) {
        this.playerPos.y = 0;
        this.playerVelY = 0;
        this.isGrounded = true;
      }
    }

    this.playerRig.root.position.copy(this.playerPos);
    this.playerRig.root.rotation.y = this.playerRot;

    // Fluid Natural Limb Animation
    if (this.isPunching) {
      this.punchTimer -= dt;
      this.playerRig.rightArm.rotation.x = -Math.PI / 2 + Math.sin(this.punchTimer * 20) * 0.45;
      this.playerRig.rightForearm.rotation.x = -Math.PI / 6;
      if (this.punchTimer <= 0) {
        this.isPunching = false;
        this.playerRig.rightArm.rotation.x = 0;
        this.playerRig.rightForearm.rotation.x = 0;
      }
    } else {
      if (isMoving) {
        this.playerRig.animTime += dt * (this.isSprinting ? 14 : 7.5);
        const swing = Math.sin(this.playerRig.animTime) * 0.65;
        this.playerRig.leftLeg.rotation.x = swing;
        this.playerRig.rightLeg.rotation.x = -swing;
        this.playerRig.leftCalf.rotation.x = Math.max(0, -swing * 0.5);
        this.playerRig.rightCalf.rotation.x = Math.max(0, swing * 0.5);

        this.playerRig.leftArm.rotation.x = -swing * 0.6;
        this.playerRig.rightArm.rotation.x = swing * 0.6;
        this.playerRig.torso.rotation.x = this.isSprinting ? 0.15 : 0;
      } else {
        // Natural Breathing Idle
        this.playerRig.animTime += dt * 2.5;
        const breath = Math.sin(this.playerRig.animTime) * 0.03;
        this.playerRig.torso.position.y = breath;
        this.playerRig.leftLeg.rotation.x = 0;
        this.playerRig.rightLeg.rotation.x = 0;
        this.playerRig.leftCalf.rotation.x = 0;
        this.playerRig.rightCalf.rotation.x = 0;
        this.playerRig.leftArm.rotation.x = 0;
        this.playerRig.rightArm.rotation.x = 0;
        this.playerRig.torso.rotation.x = 0;
      }
    }
  }

  private updateActiveVehicle(dt: number) {
    if (!this.activeVehicle) return;

    let maxSpeed = 22;
    let accel = 15;
    if (this.activeVehicle.vehicleType === 'RICKSHAW') {
      maxSpeed = 8;
      accel = 6.5;
    } else if (this.activeVehicle.vehicleType === 'BUS') {
      maxSpeed = 16;
      accel = 8.5;
    } else if (this.activeVehicle.vehicleType === 'POLICE_CAR') {
      maxSpeed = 26;
      accel = 18;
    }

    const drag = 3.8;
    const throttle = Math.abs(this.inputThrottle) > 0.01 ? this.inputThrottle : -this.inputMove.y;
    if (Math.abs(throttle) > 0.05) {
      this.activeVehicle.speed += throttle * accel * dt;
      this.activeVehicle.speed = Math.max(-maxSpeed * 0.35, Math.min(maxSpeed, this.activeVehicle.speed));
    } else {
      if (this.activeVehicle.speed > 0) {
        this.activeVehicle.speed = Math.max(0, this.activeVehicle.speed - drag * dt);
      } else if (this.activeVehicle.speed < 0) {
        this.activeVehicle.speed = Math.min(0, this.activeVehicle.speed + drag * dt);
      }
    }

    const steer = Math.abs(this.inputSteer) > 0.01 ? this.inputSteer : -this.inputMove.x;
    if (Math.abs(this.activeVehicle.speed) > 0.2) {
      const turnMult = this.activeVehicle.speed > 0 ? 1 : -1;
      this.activeVehicle.steerAngle += steer * 2.5 * dt * turnMult;
    }

    const vx = Math.sin(this.activeVehicle.steerAngle) * this.activeVehicle.speed * dt;
    const vz = Math.cos(this.activeVehicle.steerAngle) * this.activeVehicle.speed * dt;

    this.activeVehicle.root.position.x += vx;
    this.activeVehicle.root.position.z += vz;
    this.activeVehicle.root.rotation.y = this.activeVehicle.steerAngle;

    // Rotate wheels
    const wheelRot = (this.activeVehicle.speed * dt) / 0.38;
    for (const w of this.activeVehicle.wheels) {
      w.rotation.x += wheelRot;
    }

    if (this.activeVehicle.vehicleType === 'CNG') {
      soundEngine.setCngEngine(true, Math.abs(this.activeVehicle.speed) / maxSpeed);
    }

    this.stats.speedKmh = Math.round(Math.abs(this.activeVehicle.speed) * 3.6);
  }

  private updateTraffic(dt: number) {
    for (const t of this.trafficVehicles) {
      const pos = t.rig.root.position;
      pos.z += t.laneZDir * t.currentSpeed * dt;

      if (t.laneZDir > 0 && pos.z > 130) {
        pos.z = -130;
      } else if (t.laneZDir < 0 && pos.z < -130) {
        pos.z = 130;
      }

      const wRot = (t.currentSpeed * dt) / 0.4;
      for (const w of t.rig.wheels) {
        w.rotation.x += wRot * t.laneZDir;
      }
    }
  }

  private updateCrowdNPCs(dt: number) {
    const playerP = this.playerPos;

    for (let i = 0; i < this.npcs.length; i++) {
      const npc = this.npcs[i];
      const pos = npc.rig.root.position;
      const dist = pos.distanceTo(playerP);

      // Distance-Based LOD Optimization
      if (dist > 75) {
        npc.rig.root.visible = false;
        continue;
      }
      npc.rig.root.visible = true;

      const isMedium = dist > 32;

      if (npc.isPanicking) {
        const panicDir = _vec3A.copy(pos).sub(playerP).normalize();
        pos.addScaledVector(panicDir, 5.0 * dt);
        npc.rig.root.rotation.y = Math.atan2(panicDir.x, panicDir.z);

        if (!isMedium) {
          npc.rig.animTime += dt * 14;
          const swing = Math.sin(npc.rig.animTime) * 0.7;
          npc.rig.leftLeg.rotation.x = swing;
          npc.rig.rightLeg.rotation.x = -swing;
          npc.rig.leftArm.rotation.x = -Math.PI / 3 + swing * 0.5;
          npc.rig.rightArm.rotation.x = -Math.PI / 3 - swing * 0.5;
        }
      } else {
        if (npc.state === 'WALKING') {
          if (pos.distanceTo(npc.target) < 1.2) {
            npc.state = 'IDLE';
            npc.idleTimer = 2.0 + Math.random() * 3.0;
          } else {
            const dir = _vec3A.copy(npc.target).sub(pos).normalize();
            pos.addScaledVector(dir, npc.speed * dt);
            npc.rig.root.rotation.y = Math.atan2(dir.x, dir.z);

            if (!isMedium) {
              npc.rig.animTime += dt * 6.5;
              const swing = Math.sin(npc.rig.animTime) * 0.5;
              npc.rig.leftLeg.rotation.x = swing;
              npc.rig.rightLeg.rotation.x = -swing;
              npc.rig.leftArm.rotation.x = -swing * 0.4;
              npc.rig.rightArm.rotation.x = swing * 0.4;
            }
          }
        } else {
          npc.idleTimer -= dt;
          if (npc.idleTimer <= 0) {
            npc.state = 'WALKING';
            npc.target.set(
              pos.x + (Math.random() * 10 - 5),
              0.22,
              pos.z + (Math.random() * 40 - 20)
            );
          }
          if (!isMedium) {
            npc.rig.leftLeg.rotation.x = 0;
            npc.rig.rightLeg.rotation.x = 0;
          }
        }
      }
    }
  }

  private updatePolice(dt: number) {
    const targetPos = this.stats.isDriving && this.activeVehicle
      ? this.activeVehicle.root.position
      : this.playerPos;

    for (const cop of this.policeOfficers) {
      const pos = cop.rig.root.position;
      const dist = pos.distanceTo(targetPos);

      if (this.stats.wantedLevel >= 1 && dist < 50) {
        const dir = _vec3A.copy(targetPos).sub(pos).normalize();
        const chaseSpeed = 3.8 + this.stats.wantedLevel * 0.45;
        pos.addScaledVector(dir, chaseSpeed * dt);
        cop.rig.root.rotation.y = Math.atan2(dir.x, dir.z);

        cop.rig.animTime += dt * 11;
        const swing = Math.sin(cop.rig.animTime) * 0.75;
        cop.rig.leftLeg.rotation.x = swing;
        cop.rig.rightLeg.rotation.x = -swing;
        cop.rig.rightArm.rotation.x = -Math.PI / 4 + swing * 0.5;

        // Arrest trigger (< 1.8m)
        if (dist < 1.8 && !this.stats.isDriving) {
          if (this.onPoliceArrest) this.onPoliceArrest();
        }
      } else {
        if (pos.distanceTo(cop.patrolPos) > 4.5) {
          const dir = _vec3A.copy(cop.patrolPos).sub(pos).normalize();
          pos.addScaledVector(dir, 1.6 * dt);
          cop.rig.root.rotation.y = Math.atan2(dir.x, dir.z);
        }
      }
    }

    // Flash Police Cruiser Siren Strobes
    const policeVehicle = this.trafficVehicles.find((v) => v.rig.vehicleType === 'POLICE_CAR');
    if (policeVehicle && policeVehicle.rig.sirenLights) {
      const t = performance.now() * 0.012;
      policeVehicle.rig.sirenLights[0].intensity = Math.sin(t) > 0 ? 4.5 : 0;
      policeVehicle.rig.sirenLights[1].intensity = Math.sin(t) <= 0 ? 4.5 : 0;
    }
  }

  private checkProximities() {
    const checkPos = this.stats.isDriving && this.activeVehicle
      ? this.activeVehicle.root.position
      : this.playerPos;

    const shops = [
      { name: 'ঢাকা সুইটস', pos: new THREE.Vector3(-23.5, 0, -85), prompt: 'দোকানে কথা বলুন: গরম রসগোল্লা ও চমচম' },
      { name: 'মায়ের দোয়া ফার্মেসী', pos: new THREE.Vector3(-23.5, 0, -25), prompt: 'ফার্মেসী: ওষুধ ও পূর্ণ স্বাস্থ্য পুনরুদ্ধার' },
      { name: 'পদ্মার রূপালী ইলিশের আড়ৎ', pos: new THREE.Vector3(23.5, 0, -80), prompt: 'মাছের বাজার: বড় তাজা রূপালী ইলিশ' },
      { name: 'মায়ের দোয়া টং ক্যাফে', pos: new THREE.Vector3(23.5, 0, -18), prompt: 'টং ক্যাফে: স্পেশাল মালাই চা ও বাকরখানি' },
    ];

    let found: { name: string; prompt: string } | null = null;
    for (const s of shops) {
      if (checkPos.distanceTo(s.pos) < 8.0) {
        found = { name: s.name, prompt: s.prompt };
        break;
      }
    }

    if (found) {
      if (this.currentNearShop !== found.name) {
        this.currentNearShop = found.name;
        if (this.onNearShop) this.onNearShop(found.name, found.prompt);
      }
    } else {
      if (this.currentNearShop !== null) {
        this.currentNearShop = null;
        if (this.onLeaveShop) this.onLeaveShop();
      }
    }

    // Check Active Mission Objective Proximity & Live Distance
    if (this.activeMission && !this.activeMission.completed) {
      const tPos = new THREE.Vector3(
        this.activeMission.targetPos.x,
        this.activeMission.targetPos.y,
        this.activeMission.targetPos.z
      );
      const dist = checkPos.distanceTo(tPos);
      this.missionDistance = Math.round(dist);
      if (dist < 5.0) {
        if (this.onMissionObjectiveReached) this.onMissionObjectiveReached();
      }
    } else {
      this.missionDistance = null;
    }
  }

  // 3D Mission Waypoint Light Pillar & Marker Animation
  private updateWaypointMarker(dt: number) {
    if (this.activeMission && !this.activeMission.completed) {
      if (!this.waypointMarker || this.currentWaypointType !== this.activeMission.targetType) {
        if (this.waypointMarker) {
          this.scene.remove(this.waypointMarker.group);
        }
        this.waypointMarker = createMissionWaypointMarker(this.activeMission.targetType);
        this.currentWaypointType = this.activeMission.targetType;
        this.scene.add(this.waypointMarker.group);
      }
      this.waypointMarker.group.visible = true;
      this.waypointMarker.group.position.set(
        this.activeMission.targetPos.x,
        this.activeMission.targetPos.y,
        this.activeMission.targetPos.z
      );

      // Animate: spin target badge, pulse ground ring, fluctuate beam transparency
      this.waypointMarker.iconMesh.rotation.y += 2.2 * dt;
      const pulse = 1.0 + Math.sin(performance.now() * 0.006) * 0.2;
      this.waypointMarker.groundRing.scale.set(pulse, pulse, pulse);
      (this.waypointMarker.lightPillar.material as THREE.MeshBasicMaterial).opacity =
        0.35 + Math.sin(performance.now() * 0.005) * 0.15;
      this.waypointMarker.iconMesh.position.y = 2.4 + Math.sin(performance.now() * 0.004) * 0.35;
    } else if (this.waypointMarker) {
      this.waypointMarker.group.visible = false;
    }
  }

  // Cinematic Title Mode with seated Hero pose
  public setTitleMode(enabled: boolean) {
    this.isTitleMode = enabled;
    if (enabled) {
      this.playerPos.set(1.5, 0.42, 5.0);
      this.playerRot = -0.3;
      this.playerRig.root.position.copy(this.playerPos);
      this.playerRig.root.rotation.y = this.playerRot;
      // Seated pose on concrete sidewalk curb
      this.playerRig.leftLeg.rotation.x = -Math.PI / 2.2;
      this.playerRig.rightLeg.rotation.x = -Math.PI / 2.2;
      this.playerRig.leftCalf.rotation.x = Math.PI / 2.2;
      this.playerRig.rightCalf.rotation.x = Math.PI / 2.2;
      this.playerRig.leftArm.rotation.x = -Math.PI / 5;
      this.playerRig.rightArm.rotation.x = -Math.PI / 5;
      this.playerRig.torso.rotation.x = 0.08;
    } else {
      this.playerPos.set(0, 0, 8);
      this.playerRot = 0;
      this.playerRig.root.position.copy(this.playerPos);
      this.playerRig.root.rotation.y = 0;
      this.playerRig.leftLeg.rotation.x = 0;
      this.playerRig.rightLeg.rotation.x = 0;
      this.playerRig.leftCalf.rotation.x = 0;
      this.playerRig.rightCalf.rotation.x = 0;
      this.playerRig.leftArm.rotation.x = 0;
      this.playerRig.rightArm.rotation.x = 0;
      this.playerRig.torso.rotation.x = 0;
    }
  }

  // Smooth Third-Person Camera with exponential damping
  private updateCamera(dt: number) {
    if (this.isTitleMode) {
      // Cinematic Title Camera framing hero on sidewalk curb with Dhaka traffic
      _vec3Cam.set(-0.6, 1.5, 9.5);
      this.camera.position.lerp(_vec3Cam, Math.min(1.0, 5.0 * dt));
      _vec3A.set(1.5, 1.1, 5.0);
      this.camera.lookAt(_vec3A);
      return;
    }

    const target = this.stats.isDriving && this.activeVehicle
      ? this.activeVehicle.root.position
      : this.playerPos;

    const rot = this.stats.isDriving && this.activeVehicle
      ? this.activeVehicle.steerAngle
      : this.playerRot;

    const isDriving = this.stats.isDriving;
    const dist = isDriving ? (this.activeVehicle?.vehicleType === 'BUS' ? 12.0 : 8.8) : 5.8;
    const height = isDriving ? (this.activeVehicle?.vehicleType === 'BUS' ? 4.8 : 3.4) : 2.5;

    _vec3Cam.set(
      target.x - Math.sin(rot) * dist,
      target.y + height,
      target.z - Math.cos(rot) * dist
    );

    // Smooth lerp (Exponential damping)
    this.camera.position.lerp(_vec3Cam, Math.min(1.0, 9.5 * dt));

    _vec3A.set(target.x, target.y + 1.35, target.z);
    this.camera.lookAt(_vec3A);
  }

  // 2D Mini-Map Radar (Optimized)
  public drawMiniMap(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const centerPos = this.stats.isDriving && this.activeVehicle
      ? this.activeVehicle.root.position
      : this.playerPos;

    const scale = 1.1;

    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Radar Rings
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 30, 0, Math.PI * 2);
    ctx.arc(w / 2, h / 2, 56, 0, Math.PI * 2);
    ctx.stroke();

    // Central Avenue
    const roadX = w / 2 + (-centerPos.x) * scale;
    ctx.fillStyle = '#334155';
    ctx.fillRect(roadX - 10, 0, 20, h);

    // Shops
    ctx.fillStyle = '#38bdf8';
    const shops = [
      new THREE.Vector3(-23.5, 0, -85),
      new THREE.Vector3(-23.5, 0, -25),
      new THREE.Vector3(23.5, 0, -80),
      new THREE.Vector3(23.5, 0, -18),
    ];
    for (const s of shops) {
      const sx = w / 2 + (s.x - centerPos.x) * scale;
      const sy = h / 2 + (s.z - centerPos.z) * scale;
      ctx.beginPath();
      ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mission Beacon (Pulsing Gold) + Edge Direction Pointer
    if (this.activeMission && !this.activeMission.completed) {
      const relX = (this.activeMission.targetPos.x - centerPos.x) * scale;
      const relZ = (this.activeMission.targetPos.z - centerPos.z) * scale;
      const distPixels = Math.hypot(relX, relZ);
      const maxRadius = w / 2 - 12;

      if (distPixels > maxRadius) {
        // Target is beyond radar boundary: draw high-visibility pointer arrow on the perimeter!
        const angle = Math.atan2(relZ, relX);
        const edgeX = w / 2 + Math.cos(angle) * maxRadius;
        const edgeY = h / 2 + Math.sin(angle) * maxRadius;

        ctx.save();
        ctx.translate(edgeX, edgeY);
        ctx.rotate(angle);
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(9, 0);
        ctx.lineTo(-7, -6);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-7, 6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      } else {
        // Inside radar: draw pulsing target beacon with gold crosshair
        const mx = w / 2 + relX;
        const my = h / 2 + relZ;
        const pulse = Math.sin(performance.now() * 0.008) * 2;
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(mx, my, 6 + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mx, my, 9 + pulse, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Traffic vehicles (Blue dots)
    ctx.fillStyle = '#60a5fa';
    for (const t of this.trafficVehicles) {
      const tx = w / 2 + (t.rig.root.position.x - centerPos.x) * scale;
      const ty = h / 2 + (t.rig.root.position.z - centerPos.z) * scale;
      ctx.beginPath();
      ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Police (Red dots)
    ctx.fillStyle = '#ef4444';
    for (const cop of this.policeOfficers) {
      const cx = w / 2 + (cop.rig.root.position.x - centerPos.x) * scale;
      const cy = h / 2 + (cop.rig.root.position.z - centerPos.z) * scale;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player Green Arrow at center
    ctx.save();
    ctx.translate(w / 2, h / 2);
    const rot = this.stats.isDriving && this.activeVehicle
      ? this.activeVehicle.steerAngle
      : this.playerRot;
    ctx.rotate(rot);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(7, 7);
    ctx.lineTo(0, 3.5);
    ctx.lineTo(-7, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();

    // Border
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  public dispose() {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
