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
} from './modelGenerators';
import {
  createDetailedRoadTexture,
  createFootpathTexture,
} from './proceduralTextures';
import { soundEngine } from '../audio/SoundFX';
import { Mission, PlayerStats, TimeOfDay, WeatherType } from '../types/game';

// Mobile device & Software WebGL detection guards
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

interface HitParticle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
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
  private playerVelY: number = 0;
  private isGrounded: boolean = true;
  public isSprinting: boolean = false;
  private isPunching: boolean = false;
  private punchTimer: number = 0;

  // Vehicles & Traffic System
  public drivableCng: VehicleRig;
  public drivableRickshaw: VehicleRig;
  public activeVehicle: VehicleRig | null = null;
  public trafficVehicles: TrafficVehicle[] = [];

  // NPCs & Police
  public npcs: {
    rig: CharacterRig;
    target: THREE.Vector3;
    speed: number;
    isPanicking: boolean;
    state: 'WALKING' | 'IDLE';
    idleTimer: number;
  }[] = [];
  public policeOfficers: { rig: CharacterRig; patrolPos: THREE.Vector3; speed: number }[] = [];

  // Lighting & Environment
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private rainParticles: THREE.Points | null = null;
  private hitParticles: HitParticle[] = [];

  // Loops & Timing
  private frameId: number = 0;
  private lastTime: number = 0;
  private isRunning: boolean = false;

  // Input states
  public inputMove = { x: 0, y: 0 };
  public inputSprint = false;
  public inputJump = false;

  // Stats
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

  private wantedCooldownTimer: number = 0;
  private footstepTimer: number = 0;
  public activeMission: Mission | null = null;
  public onMissionObjectiveReached?: () => void;
  public onPoliceArrest?: () => void;
  public onNearShop?: (shopName: string, promptText: string) => void;
  public onLeaveShop?: () => void;
  public onPunchHit?: (pos: THREE.Vector3) => void;

  public currentNearShop: string | null = null;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x38bdf8); // Sky blue
    this.scene.fog = new THREE.FogExp2(0x7dd3fc, 0.009);

    this.camera = new THREE.PerspectiveCamera(
      58,
      container.clientWidth / container.clientHeight,
      0.1,
      400
    );

    // 2. High-Performance Mobile-Optimized Renderer
    const enableShadows = !isMobileDevice && !isSoftwareGl;
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isMobileDevice && !isSoftwareGl,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    // Cap pixel ratio to 1.0 on mobile to completely prevent high-DPI GPU fill-rate exhaustion
    this.renderer.setPixelRatio(isMobileDevice || isSoftwareGl ? 1.0 : Math.min(window.devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = enableShadows;
    if (enableShadows) {
      this.renderer.shadowMap.type = THREE.BasicShadowMap;
    }

    container.appendChild(this.renderer.domElement);

    // 3. Studio Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Lighting Rig
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

    // 5. Construct Dense Dhaka City District
    this.buildDenseDhakaCity();

    // 6. Spawn High-Fidelity Hero Thief Character
    this.playerRig = createThiefModel();
    this.playerRig.root.position.copy(this.playerPos);
    this.scene.add(this.playerRig.root);

    // 7. Spawn Drivable Vehicles (CNG & Rickshaw parked curbside)
    this.drivableCng = createCNGModel();
    this.drivableCng.root.position.set(-9.2, 0, -4);
    this.drivableCng.root.rotation.y = 0.1;
    this.scene.add(this.drivableCng.root);

    this.drivableRickshaw = createRickshawModel();
    this.drivableRickshaw.root.position.set(9.2, 0, 16);
    this.drivableRickshaw.root.rotation.y = Math.PI - 0.1;
    this.scene.add(this.drivableRickshaw.root);

    // 8. Spawn Moving Traffic (CNG, Bus, Rickshaw, Police Car)
    this.spawnMovingTraffic();

    // 9. Spawn Populated Crowd NPCs (24+ diverse characters)
    this.spawnCrowdNPCs();

    // 10. Spawn Bangladesh Police Officers
    this.spawnPoliceOfficers();

    // 11. Rain Particle System
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

  private buildDenseDhakaCity() {
    // Ground Foundation
    const groundGeo = new THREE.PlaneGeometry(320, 320);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.95 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 1. Central 4-Lane Dhaka Avenue (North-South, 18m wide)
    const roadTex = createDetailedRoadTexture();
    const roadMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.8 });
    const mainRoad = new THREE.Mesh(new THREE.PlaneGeometry(18, 280), roadMat);
    mainRoad.rotation.x = -Math.PI / 2;
    mainRoad.position.set(0, 0.02, 0);
    mainRoad.receiveShadow = true;
    this.scene.add(mainRoad);

    // 2. Interlocking Paved Footpaths with Curbs on both sides (6m wide sidewalks)
    const footpathTex = createFootpathTexture();
    const footpathMat = new THREE.MeshStandardMaterial({ map: footpathTex, roughness: 0.85 });

    // West Sidewalk
    const westFootpath = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.22, 280), footpathMat);
    westFootpath.position.set(-12.25, 0.11, 0);
    westFootpath.receiveShadow = true;
    this.scene.add(westFootpath);

    // East Sidewalk
    const eastFootpath = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.22, 280), footpathMat);
    eastFootpath.position.set(12.25, 0.11, 0);
    eastFootpath.receiveShadow = true;
    this.scene.add(eastFootpath);

    // 3. Dense Multi-Storey Buildings (14 to 24 meters tall, 3 to 6 storeys)
    // West Side Buildings
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

    // East Side Buildings
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

    // 4. Rooftop Access Ramp & High Platform (for acrobatic escape & rooftop mission)
    const rampMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.4, 30), rampMat);
    ramp.rotation.x = -0.42;
    ramp.position.set(-33, 7.5, -20);
    this.scene.add(ramp);

    // Extraction Red Smoke Signal Beacon on West Building Roof
    const smokeBeacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 3.5, 8),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.0 })
    );
    smokeBeacon.position.set(-23.5, 25.5, -85);
    this.scene.add(smokeBeacon);

    const beaconPoint = new THREE.PointLight(0xef4444, 4, 30);
    beaconPoint.position.set(-23.5, 26, -85);
    this.scene.add(beaconPoint);

    // 5. Electric Utility Poles with Overhead Black Cables
    for (let z = -90; z <= 90; z += 30) {
      // West pole
      const poleW = createElectricPoleWithWires();
      poleW.position.set(-10.5, 0, z);
      this.scene.add(poleW);

      // East pole
      const poleE = createElectricPoleWithWires();
      poleE.position.set(10.5, 0, z);
      poleE.rotation.y = Math.PI;
      this.scene.add(poleE);

      // Overhead Sagging Wire Cable spanning across the road!
      const cableCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-10.5, 7.8, z),
        new THREE.Vector3(0, 6.2, z),
        new THREE.Vector3(10.5, 7.8, z)
      );
      const cableGeo = new THREE.TubeGeometry(cableCurve, 12, 0.022, 6, false);
      const cableMesh = new THREE.Mesh(cableGeo, new THREE.MeshBasicMaterial({ color: 0x09090b }));
      this.scene.add(cableMesh);
    }

    // 6. Street Lamp Posts with glowing warm lanterns
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

    // 7. Roadside Trees in Planter Boxes along footpaths
    for (let z = -80; z <= 80; z += 40) {
      const treeW = createRoadsideTree();
      treeW.position.set(-14.2, 0, z + 15);
      this.scene.add(treeW);

      const treeE = createRoadsideTree();
      treeE.position.set(14.2, 0, z - 15);
      this.scene.add(treeE);
    }

    // 8. Bustling Open-Air Market District on Sidewalk (কাঁচা বাজার ও মাছের আড়ৎ)
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
    bus.root.position.set(4.2, 0, -60);
    this.scene.add(bus.root);
    this.trafficVehicles.push({
      rig: bus,
      laneZDir: 1,
      targetSpeed: 11,
      currentSpeed: 10,
      xLane: 4.2,
    });

    // 2. Green CNG Auto-Rickshaw cruising South
    const cngTraffic = createCNGModel();
    cngTraffic.root.position.set(-4.2, 0, 70);
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

    // 4. Police Patrol SUV with active siren lights cruising South
    const policeCar = createPoliceCarModel();
    policeCar.root.position.set(-4.5, 0, 10);
    policeCar.root.rotation.y = Math.PI;
    this.scene.add(policeCar.root);
    this.trafficVehicles.push({
      rig: policeCar,
      laneZDir: -1,
      targetSpeed: 14,
      currentSpeed: 13,
      xLane: -4.5,
    });
  }

  private spawnCrowdNPCs() {
    const archetypes = ['SHOPKEEPER', 'ELDER', 'STUDENT', 'WOMAN', 'PULLER'] as const;
    const colors = [0xef4444, 0x10b981, 0x3b82f6, 0xf59e0b, 0x8b5cf6, 0xec4899, 0x14b8a6, 0xf97316];

    // Spawn 16 diverse NPCs along sidewalks, shop entrances, and bazaar stalls
    for (let i = 0; i < 16; i++) {
      const arch = archetypes[i % archetypes.length];
      const col = colors[i % colors.length];
      const rig = createCitizenModel(arch, col);

      const isWest = i % 2 === 0;
      const x = (isWest ? -1 : 1) * (11.5 + (Math.random() * 3 - 1.5));
      const z = -85 + (i * 170) / 16 + (Math.random() * 6 - 3);

      rig.root.position.set(x, 0.22, z);
      this.scene.add(rig.root);

      this.npcs.push({
        rig,
        target: new THREE.Vector3(x, 0.22, z + (Math.random() * 30 - 15)),
        speed: 1.2 + Math.random() * 0.9,
        isPanicking: false,
        state: 'WALKING',
        idleTimer: 0,
      });
    }
  }

  private spawnPoliceOfficers() {
    const spawns = [
      new THREE.Vector3(12.5, 0.22, -45), // Near Police Control Post
      new THREE.Vector3(-12.5, 0.22, 25), // On West Sidewalk
      new THREE.Vector3(0, 0, 95),        // Checkpoint South
    ];

    spawns.forEach((pt) => {
      const rig = createPoliceModel();
      rig.root.position.copy(pt);
      this.scene.add(rig.root);

      this.policeOfficers.push({
        rig,
        patrolPos: pt.clone(),
        speed: 2.4,
      });
    });
  }

  private initRainParticles() {
    const count = 4000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 140;
      pos[i * 3 + 1] = Math.random() * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 180;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xbae6fd,
      size: 0.18,
      transparent: true,
      opacity: 0.7,
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

  // Cartoon Punch / Slap Action ("ঢিসুম!")
  public performPunch() {
    if (this.isPunching || this.stats.isDriving) return;
    this.isPunching = true;
    this.punchTimer = 0.35;

    soundEngine.playPunch();

    const punchPos = this.playerPos.clone().add(
      new THREE.Vector3(Math.sin(this.playerRot) * 1.5, 0.9, Math.cos(this.playerRot) * 1.5)
    );

    this.spawnHitSparks(punchPos);

    // Hit nearby NPCs
    for (const npc of this.npcs) {
      if (npc.rig.root.position.distanceTo(punchPos) < 2.2) {
        npc.isPanicking = true;
        const pushDir = npc.rig.root.position.clone().sub(this.playerPos).normalize();
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
      if (cop.rig.root.position.distanceTo(punchPos) < 2.2) {
        const pushDir = cop.rig.root.position.clone().sub(this.playerPos).normalize();
        cop.rig.root.position.addScaledVector(pushDir, 2.5);
        this.addWantedLevel(2);
        soundEngine.speakBengali('সাহস কত! পুলিশের গায়ে হাত!', 1.0, 1.1);
        break;
      }
    }
  }

  private spawnHitSparks(pos: THREE.Vector3) {
    const count = 10;
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), sparkMat);
      p.position.copy(pos);
      this.scene.add(p);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 7,
        Math.random() * 5 + 2.5,
        (Math.random() - 0.5) * 7
      );
      this.hitParticles.push({ mesh: p, vel, life: 0.35 });
    }
  }

  // Enter / Exit Vehicle
  public toggleVehicle() {
    if (this.stats.isDriving) {
      // Exit
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
      // Enter nearby CNG
      if (this.playerPos.distanceTo(this.drivableCng.root.position) < 3.5) {
        this.stats.isDriving = true;
        this.stats.drivingVehicleType = 'CNG';
        this.activeVehicle = this.drivableCng;
        this.playerRig.root.visible = false;
        soundEngine.setCngEngine(true, 0);
        soundEngine.playHorn();

        if (this.activeMission?.targetType === 'DRIVE_CNG' && this.onMissionObjectiveReached) {
          this.onMissionObjectiveReached();
        }
      } else if (this.playerPos.distanceTo(this.drivableRickshaw.root.position) < 3.2) {
        this.stats.isDriving = true;
        this.stats.drivingVehicleType = 'RICKSHAW';
        this.activeVehicle = this.drivableRickshaw;
        this.playerRig.root.visible = false;
        soundEngine.playRickshawBell();
      }
    }
  }

  public honkVehicleHorn() {
    if (this.stats.drivingVehicleType === 'CNG') {
      soundEngine.playHorn();
    } else if (this.stats.drivingVehicleType === 'RICKSHAW') {
      soundEngine.playRickshawBell();
    }
  }

  public addWantedLevel(amount: number) {
    this.stats.wantedLevel = Math.min(5, this.stats.wantedLevel + amount);
    this.wantedCooldownTimer = 12.0;
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
      const dt = Math.min(rawDt, 0.05);

      this.update(dt);
      this.renderer.render(this.scene, this.camera);

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
    // 1. Hit Sparks
    for (let i = this.hitParticles.length - 1; i >= 0; i--) {
      const p = this.hitParticles[i];
      p.life -= dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.vel.y -= 12 * dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.hitParticles.splice(i, 1);
      }
    }

    // 2. Rain Particles
    if (this.rainParticles && this.rainParticles.visible) {
      const posAttr = this.rainParticles.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 1; i < arr.length; i += 3) {
        arr[i] -= 32 * dt;
        if (arr[i] < 0) arr[i] = 50;
      }
      posAttr.needsUpdate = true;
    }

    // 3. Player Walking or Vehicle Driving
    if (this.stats.isDriving && this.activeVehicle) {
      this.updateActiveVehicle(dt);
    } else {
      this.updatePlayerWalking(dt);
    }

    // 4. Update Dynamic Road Traffic (Buses, CNGs, Rickshaws)
    this.updateTraffic(dt);

    // 5. Update Crowd NPCs (24+ characters)
    this.updateCrowdNPCs(dt);

    // 6. Update Police Officers & Siren Strobes
    this.updatePolice(dt);

    // 7. Wanted Level Decay
    if (this.stats.wantedLevel > 0) {
      this.wantedCooldownTimer -= dt;
      if (this.wantedCooldownTimer <= 0) {
        this.stats.wantedLevel = Math.max(0, this.stats.wantedLevel - 1);
        this.wantedCooldownTimer = 10.0;
        if (this.stats.wantedLevel === 0) {
          soundEngine.setPoliceSiren(false);
        }
      }
    }

    // 8. Check Shop & Objective Proximities
    this.checkProximities();

    // 9. Third-Person Camera with Smooth Damping
    this.updateCamera(dt);
  }

  private updatePlayerWalking(dt: number) {
    if (!this.inputSprint && this.stats.stamina < this.stats.maxStamina) {
      this.stats.stamina = Math.min(this.stats.maxStamina, this.stats.stamina + 18 * dt);
    }

    const isMoving = Math.abs(this.inputMove.x) > 0.05 || Math.abs(this.inputMove.y) > 0.05;
    this.isSprinting = this.inputSprint && this.stats.stamina > 5 && isMoving;
    if (this.isSprinting) {
      this.stats.stamina = Math.max(0, this.stats.stamina - 26 * dt);
    }

    const moveSpeed = this.isSprinting ? 10.0 : 4.8;

    if (isMoving) {
      this.playerRot = Math.atan2(this.inputMove.x, this.inputMove.y);
      const dx = Math.sin(this.playerRot) * moveSpeed * dt;
      const dz = Math.cos(this.playerRot) * moveSpeed * dt;

      this.playerPos.x += dx;
      this.playerPos.z += dz;

      // Bound to city district
      this.playerPos.x = Math.max(-28, Math.min(28, this.playerPos.x));
      this.playerPos.z = Math.max(-120, Math.min(120, this.playerPos.z));

      // Footstep sound
      this.footstepTimer += dt;
      if (this.footstepTimer > (this.isSprinting ? 0.24 : 0.40)) {
        this.footstepTimer = 0;
        soundEngine.playFootstep(this.isSprinting);
      }
    }

    // Jump Physics
    if (this.inputJump && this.isGrounded) {
      this.playerVelY = 8.0;
      this.isGrounded = false;
      this.inputJump = false;
      soundEngine.playJump();
    }

    if (!this.isGrounded) {
      this.playerVelY -= 22 * dt;
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
        this.playerRig.torso.rotation.x = this.isSprinting ? 0.15 : 0; // Forward sprint lean
      } else {
        // Subtle Breathing Idle
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

    const maxSpeed = this.activeVehicle.vehicleType === 'CNG' ? 22 : 8;
    const accel = this.activeVehicle.vehicleType === 'CNG' ? 15 : 6.5;
    const drag = 3.8;

    const throttle = -this.inputMove.y;
    if (Math.abs(throttle) > 0.1) {
      this.activeVehicle.speed += throttle * accel * dt;
      this.activeVehicle.speed = Math.max(-maxSpeed * 0.35, Math.min(maxSpeed, this.activeVehicle.speed));
    } else {
      if (this.activeVehicle.speed > 0) {
        this.activeVehicle.speed = Math.max(0, this.activeVehicle.speed - drag * dt);
      } else if (this.activeVehicle.speed < 0) {
        this.activeVehicle.speed = Math.min(0, this.activeVehicle.speed + drag * dt);
      }
    }

    const steer = -this.inputMove.x;
    if (Math.abs(this.activeVehicle.speed) > 0.2) {
      const turnMult = this.activeVehicle.speed > 0 ? 1 : -1;
      this.activeVehicle.steerAngle += steer * 2.4 * dt * turnMult;
    }

    const vx = Math.sin(this.activeVehicle.steerAngle) * this.activeVehicle.speed * dt;
    const vz = Math.cos(this.activeVehicle.steerAngle) * this.activeVehicle.speed * dt;

    this.activeVehicle.root.position.x += vx;
    this.activeVehicle.root.position.z += vz;
    this.activeVehicle.root.rotation.y = this.activeVehicle.steerAngle;

    // Rotate wheels
    const wheelRot = (this.activeVehicle.speed * dt) / 0.35;
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

      // Wrap around city boundaries
      if (t.laneZDir > 0 && pos.z > 130) {
        pos.z = -130;
      } else if (t.laneZDir < 0 && pos.z < -130) {
        pos.z = 130;
      }

      // Rotate wheels with speed
      const wRot = (t.currentSpeed * dt) / 0.4;
      for (const w of t.rig.wheels) {
        w.rotation.x += wRot * t.laneZDir;
      }
    }
  }

  private updateCrowdNPCs(dt: number) {
    const playerP = this.playerPos;
    for (const npc of this.npcs) {
      const pos = npc.rig.root.position;
      const dist = pos.distanceTo(playerP);
      const isFar = dist > 32;

      if (npc.isPanicking) {
        const panicDir = pos.clone().sub(playerP).normalize();
        pos.addScaledVector(panicDir, 5.0 * dt);
        npc.rig.root.rotation.y = Math.atan2(panicDir.x, panicDir.z);

        if (!isFar) {
          // Panicking run animation
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
            const dir = npc.target.clone().sub(pos).normalize();
            pos.addScaledVector(dir, npc.speed * dt);
            npc.rig.root.rotation.y = Math.atan2(dir.x, dir.z);

            if (!isFar) {
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
          if (!isFar) {
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
        const dir = targetPos.clone().sub(pos).normalize();
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
          const dir = cop.patrolPos.clone().sub(pos).normalize();
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

    // Check Active Mission Objective Proximity
    if (this.activeMission && !this.activeMission.completed) {
      const tPos = new THREE.Vector3(
        this.activeMission.targetPos.x,
        this.activeMission.targetPos.y,
        this.activeMission.targetPos.z
      );
      if (checkPos.distanceTo(tPos) < 5.0) {
        if (this.onMissionObjectiveReached) this.onMissionObjectiveReached();
      }
    }
  }

  private updateCamera(dt: number) {
    const target = this.stats.isDriving && this.activeVehicle
      ? this.activeVehicle.root.position
      : this.playerPos;

    const rot = this.stats.isDriving && this.activeVehicle
      ? this.activeVehicle.steerAngle
      : this.playerRot;

    const dist = this.stats.isDriving ? 9.5 : 6.0;
    const height = this.stats.isDriving ? 3.8 : 2.7;

    const offset = new THREE.Vector3(
      -Math.sin(rot) * dist,
      height,
      -Math.cos(rot) * dist
    );

    const desiredCamPos = target.clone().add(offset);
    this.camera.position.lerp(desiredCamPos, 8.5 * dt);

    const lookTarget = target.clone().add(new THREE.Vector3(0, 1.4, 0));
    this.camera.lookAt(lookTarget);
  }

  // Draw 2D Mini-Map Radar
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

    // Mission Beacon (Pulsing Gold)
    if (this.activeMission) {
      const mx = w / 2 + (this.activeMission.targetPos.x - centerPos.x) * scale;
      const my = h / 2 + (this.activeMission.targetPos.z - centerPos.z) * scale;
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(mx, my, 7 + Math.sin(performance.now() * 0.008) * 2, 0, Math.PI * 2);
      ctx.fill();
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
