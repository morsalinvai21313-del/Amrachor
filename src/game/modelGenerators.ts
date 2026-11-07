import * as THREE from 'three';
import {
  createRichShopBanner,
  createBuildingFacadeTexture,
  createDetailedRoadTexture,
  createFootpathTexture,
  createBusSideTexture,
  createRichRickshawArt,
  createHumanFaceTexture,
  createVegFishBoxTexture,
} from './proceduralTextures';

export interface CharacterRig {
  root: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftForearm: THREE.Group;
  rightForearm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftCalf: THREE.Group;
  rightCalf: THREE.Group;
  moneySack?: THREE.Group;
  baton?: THREE.Mesh;
  animTime: number;
  archetype?: string;
}

export interface VehicleRig {
  root: THREE.Group;
  wheels: THREE.Mesh[];
  sirenLights?: THREE.PointLight[];
  headlights?: THREE.SpotLight[];
  vehicleType: 'CNG' | 'RICKSHAW' | 'BUS' | 'POLICE_CAR';
  speed: number;
  steerAngle: number;
}

// 1. High-Fidelity Hero Thief Character Model ("আমরা চোর")
export function createThiefModel(): CharacterRig {
  const root = new THREE.Group();
  root.name = 'Thief_Player';

  // Realistic human skin tone
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xc87d55, // Bengali warm skin tone
    roughness: 0.65,
    metalness: 0.05,
  });

  // Black and White Striped Fabric T-Shirt Material
  const stripeCanvas = document.createElement('canvas');
  stripeCanvas.width = 128;
  stripeCanvas.height = 128;
  const sCtx = stripeCanvas.getContext('2d')!;
  sCtx.fillStyle = '#f8fafc';
  sCtx.fillRect(0, 0, 128, 128);
  sCtx.fillStyle = '#0f172a';
  for (let y = 0; y < 128; y += 32) sCtx.fillRect(0, y, 128, 16);
  const stripeTex = new THREE.CanvasTexture(stripeCanvas);
  stripeTex.wrapS = THREE.RepeatWrapping;
  stripeTex.wrapT = THREE.RepeatWrapping;
  stripeTex.repeat.set(1, 4);

  const shirtMat = new THREE.MeshStandardMaterial({
    map: stripeTex,
    roughness: 0.7,
  });

  // Blue Checked Lungi Material
  const lungiCanvas = document.createElement('canvas');
  lungiCanvas.width = 128;
  lungiCanvas.height = 128;
  const lCtx = lungiCanvas.getContext('2d')!;
  lCtx.fillStyle = '#1e3a8a';
  lCtx.fillRect(0, 0, 128, 128);
  lCtx.fillStyle = 'rgba(56, 189, 248, 0.45)';
  for (let x = 0; x < 128; x += 16) lCtx.fillRect(x, 0, 8, 128);
  for (let y = 0; y < 128; y += 16) lCtx.fillRect(0, y, 128, 8);
  const lungiTex = new THREE.CanvasTexture(lungiCanvas);
  lungiTex.wrapS = THREE.RepeatWrapping;
  lungiTex.wrapT = THREE.RepeatWrapping;
  lungiTex.repeat.set(2, 4);

  const lungiMat = new THREE.MeshStandardMaterial({
    map: lungiTex,
    roughness: 0.8,
  });

  const shoeMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.5,
  });

  const shadesMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a0a0c,
    metalness: 0.9,
    roughness: 0.1,
    clearcoat: 1.0,
  });

  // Pelvis Anchor
  const pelvis = new THREE.Group();
  pelvis.position.y = 0.95;
  root.add(pelvis);

  // Upper Torso / Chest with shoulder taper
  const torso = new THREE.Group();
  torso.position.y = 0.05;
  pelvis.add(torso);

  const chestGeo = new THREE.CylinderGeometry(0.24, 0.20, 0.58, 12);
  const chestMesh = new THREE.Mesh(chestGeo, shirtMat);
  chestMesh.position.y = 0.3;
  chestMesh.castShadow = true;
  torso.add(chestMesh);

  // Clavicle & Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.14, 10), skinMat);
  neck.position.y = 0.62;
  torso.add(neck);

  // Head Group
  const head = new THREE.Group();
  head.position.y = 0.76;
  torso.add(head);

  // Sculpted Head & Face with jawline
  const faceTex = createHumanFaceTexture('#c87d55', false, false);
  const headGeo = new THREE.SphereGeometry(0.18, 16, 14);
  headGeo.scale(1, 1.15, 0.95);
  const headMat = new THREE.MeshStandardMaterial({
    map: faceTex,
    roughness: 0.65,
  });
  const headMesh = new THREE.Mesh(headGeo, headMat);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Thief Beanie Cap
  const beanieGeo = new THREE.SphereGeometry(0.19, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.58);
  const beanieMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
  const beanie = new THREE.Mesh(beanieGeo, beanieMat);
  beanie.position.y = 0.04;
  head.add(beanie);

  // Dark Sunglasses (Thief signature look)
  const shadesFrame = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.065, 0.06), shadesMat);
  shadesFrame.position.set(0, 0.02, 0.165);
  head.add(shadesFrame);

  // Metallic gold frame rims
  const goldRimMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
  const rimL = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 8, 16), goldRimMat);
  rimL.position.set(-0.06, 0.02, 0.18);
  head.add(rimL);
  const rimR = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 8, 16), goldRimMat);
  rimR.position.set(0.06, 0.02, 0.18);
  head.add(rimR);

  // Left Arm (Shoulder -> Bicep -> Elbow -> Forearm -> Hand)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.28, 0.52, 0);
  torso.add(leftArm);

  const lBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.28, 8), shirtMat);
  lBicep.position.y = -0.14;
  lBicep.castShadow = true;
  leftArm.add(lBicep);

  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -0.28, 0);
  leftArm.add(leftForearm);

  const lForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.05, 0.26, 8), skinMat);
  lForearmMesh.position.y = -0.13;
  leftForearm.add(lForearmMesh);

  // Left Hand
  const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), skinMat);
  lHand.position.y = -0.28;
  leftForearm.add(lHand);

  // Burlap Money Sack with "৳" stamped on it held in left hand
  const moneySack = new THREE.Group();
  moneySack.position.set(0, -0.18, 0.1);
  lHand.add(moneySack);

  const sackGeo = new THREE.SphereGeometry(0.24, 12, 12);
  sackGeo.scale(1, 1.35, 0.9);
  const sackMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.85,
    metalness: 0.1,
  });
  const sackMesh = new THREE.Mesh(sackGeo, sackMat);
  sackMesh.castShadow = true;
  moneySack.add(sackMesh);

  // Taka "৳" symbol on sack
  const takaCanvas = document.createElement('canvas');
  takaCanvas.width = 128;
  takaCanvas.height = 128;
  const tCtx = takaCanvas.getContext('2d')!;
  tCtx.fillStyle = '#0f172a';
  tCtx.textAlign = 'center';
  tCtx.textBaseline = 'middle';
  tCtx.font = 'bold 90px "Hind Siliguri", sans-serif';
  tCtx.fillText('৳', 64, 64);
  const takaTex = new THREE.CanvasTexture(takaCanvas);
  const takaDecal = new THREE.Mesh(
    new THREE.PlaneGeometry(0.28, 0.28),
    new THREE.MeshBasicMaterial({ map: takaTex, transparent: true })
  );
  takaDecal.position.set(0, 0, 0.23);
  moneySack.add(takaDecal);

  // Right Arm (Punch / Action Arm)
  const rightArm = new THREE.Group();
  rightArm.position.set(0.28, 0.52, 0);
  torso.add(rightArm);

  const rBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.28, 8), shirtMat);
  rBicep.position.y = -0.14;
  rBicep.castShadow = true;
  rightArm.add(rBicep);

  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -0.28, 0);
  rightArm.add(rightForearm);

  const rForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.05, 0.26, 8), skinMat);
  rForearmMesh.position.y = -0.13;
  rightForearm.add(rForearmMesh);

  const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), skinMat);
  rHand.position.y = -0.28;
  rightForearm.add(rHand);

  // Left Leg (Hip -> Thigh -> Knee -> Calf -> Shoe)
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.13, 0, 0);
  pelvis.add(leftLeg);

  const lThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.08, 0.42, 8), lungiMat);
  lThigh.position.y = -0.21;
  lThigh.castShadow = true;
  leftLeg.add(lThigh);

  const leftCalf = new THREE.Group();
  leftCalf.position.set(0, -0.42, 0);
  leftLeg.add(leftCalf);

  const lCalfMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.068, 0.42, 8), lungiMat);
  lCalfMesh.position.y = -0.21;
  lCalfMesh.castShadow = true;
  leftCalf.add(lCalfMesh);

  const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.24), shoeMat);
  lShoe.position.set(0, -0.45, 0.04);
  lShoe.castShadow = true;
  leftCalf.add(lShoe);

  // Right Leg
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.13, 0, 0);
  pelvis.add(rightLeg);

  const rThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.08, 0.42, 8), lungiMat);
  rThigh.position.y = -0.21;
  rThigh.castShadow = true;
  rightLeg.add(rThigh);

  const rightCalf = new THREE.Group();
  rightCalf.position.set(0, -0.42, 0);
  rightLeg.add(rightCalf);

  const rCalfMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.068, 0.42, 8), lungiMat);
  rCalfMesh.position.y = -0.21;
  rCalfMesh.castShadow = true;
  rightCalf.add(rCalfMesh);

  const rShoe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.24), shoeMat);
  rShoe.position.set(0, -0.45, 0.04);
  rShoe.castShadow = true;
  rightCalf.add(rShoe);

  return {
    root,
    torso,
    head,
    leftArm,
    rightArm,
    leftForearm,
    rightForearm,
    leftLeg,
    rightLeg,
    leftCalf,
    rightCalf,
    moneySack,
    animTime: 0,
    archetype: 'THIEF',
  };
}

// 2. High Quality Police Officer Model (বাংলাদেশ পুলিশ)
export function createPoliceModel(): CharacterRig {
  const root = new THREE.Group();
  root.name = 'Police_Officer';

  const uniformMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a, // Navy police uniform
    roughness: 0.6,
  });

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xba7651, roughness: 0.7 });
  const faceTex = createHumanFaceTexture('#ba7651', true, false);
  const faceMat = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.7 });
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
  const batonMat = new THREE.MeshStandardMaterial({ color: 0x3f1c04, roughness: 0.4 });

  const pelvis = new THREE.Group();
  pelvis.position.y = 0.98;
  root.add(pelvis);

  const torso = new THREE.Group();
  pelvis.add(torso);

  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.64, 12), uniformMat);
  chest.position.y = 0.32;
  chest.castShadow = true;
  torso.add(chest);

  // Duty belt with brass buckle
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.08, 12), beltMat);
  belt.position.y = 0.04;
  torso.add(belt);
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.04), goldMat);
  buckle.position.set(0, 0.04, 0.23);
  torso.add(buckle);

  // Head
  const head = new THREE.Group();
  head.position.y = 0.78;
  torso.add(head);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 12), faceMat);
  headMesh.scale.set(1, 1.15, 0.95);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Police Peaked Cap
  const capCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.18, 0.08, 14), uniformMat);
  capCrown.position.y = 0.13;
  head.add(capCrown);
  const redBand = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.03, 14), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
  redBand.position.y = 0.09;
  head.add(redBand);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.12), new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2 }));
  visor.position.set(0, 0.08, 0.16);
  visor.rotation.x = 0.18;
  head.add(visor);

  // Arms
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.31, 0.54, 0);
  torso.add(leftArm);
  const lUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.062, 0.28, 8), uniformMat);
  lUpper.position.y = -0.14;
  leftArm.add(lUpper);

  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -0.28, 0);
  leftArm.add(leftForearm);
  const lForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.055, 0.28, 8), uniformMat);
  lForearmMesh.position.y = -0.14;
  leftForearm.add(lForearmMesh);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.31, 0.54, 0);
  torso.add(rightArm);
  const rUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.062, 0.28, 8), uniformMat);
  rUpper.position.y = -0.14;
  rightArm.add(rUpper);

  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -0.28, 0);
  rightArm.add(rightForearm);
  const rForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.055, 0.28, 8), uniformMat);
  rForearmMesh.position.y = -0.14;
  rightForearm.add(rForearmMesh);

  // Police Baton (Lathi) in hand
  const baton = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.72, 8), batonMat);
  baton.position.set(0, -0.38, 0.18);
  baton.rotation.x = Math.PI / 4;
  rightForearm.add(baton);

  // Legs
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.14, 0, 0);
  pelvis.add(leftLeg);
  const lThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.08, 0.44, 8), uniformMat);
  lThigh.position.y = -0.22;
  leftLeg.add(lThigh);

  const leftCalf = new THREE.Group();
  leftCalf.position.set(0, -0.44, 0);
  leftLeg.add(leftCalf);
  const lCalfMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.44, 8), uniformMat);
  lCalfMesh.position.y = -0.22;
  leftCalf.add(lCalfMesh);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.14, 0, 0);
  pelvis.add(rightLeg);
  const rThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.08, 0.44, 8), uniformMat);
  rThigh.position.y = -0.22;
  rightLeg.add(rThigh);

  const rightCalf = new THREE.Group();
  rightCalf.position.set(0, -0.44, 0);
  rightLeg.add(rightCalf);
  const rCalfMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.44, 8), uniformMat);
  rCalfMesh.position.y = -0.22;
  rightCalf.add(rCalfMesh);

  return {
    root,
    torso,
    head,
    leftArm,
    rightArm,
    leftForearm,
    rightForearm,
    leftLeg,
    rightLeg,
    leftCalf,
    rightCalf,
    baton,
    animTime: 0,
    archetype: 'POLICE',
  };
}

// 3. Diverse Citizen NPC Generator (Shopkeeper, Elder, Student, Woman, Rickshaw Puller)
export function createCitizenModel(archetype: 'SHOPKEEPER' | 'ELDER' | 'STUDENT' | 'WOMAN' | 'PULLER', seedColor: number): CharacterRig {
  const root = new THREE.Group();
  root.name = `NPC_${archetype}`;

  const isElder = archetype === 'ELDER';
  const isWoman = archetype === 'WOMAN';
  const isShopkeeper = archetype === 'SHOPKEEPER';

  const skinTone = isElder ? '#d49a75' : isWoman ? '#e2a178' : '#c27b52';
  const faceTex = createHumanFaceTexture(skinTone, isElder || isShopkeeper, isElder);
  const faceMat = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.7 });
  const clothMat = new THREE.MeshStandardMaterial({ color: seedColor, roughness: 0.75 });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: isElder ? 0xf8fafc : isWoman ? 0x9333ea : 0x1e293b,
    roughness: 0.8,
  });

  const pelvis = new THREE.Group();
  pelvis.position.y = 0.92;
  root.add(pelvis);

  const torso = new THREE.Group();
  pelvis.add(torso);

  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.20, 0.58, 10), clothMat);
  chest.position.y = 0.29;
  chest.castShadow = true;
  torso.add(chest);

  // Gamchha (গামছা) for shopkeeper or rickshaw puller
  if (isShopkeeper || archetype === 'PULLER') {
    const gamchha = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.035, 6, 12),
      new THREE.MeshStandardMaterial({ color: 0xdc2626 })
    );
    gamchha.rotation.x = Math.PI / 2;
    gamchha.position.y = 0.55;
    torso.add(gamchha);
  }

  // Head
  const head = new THREE.Group();
  head.position.y = 0.72;
  torso.add(head);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), faceMat);
  headMesh.scale.set(1, 1.15, 0.95);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Headgear (Prayer cap for elder, hair bun for woman)
  if (isElder) {
    const tupi = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.17, 0.06, 12),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc })
    );
    tupi.position.y = 0.14;
    head.add(tupi);
  } else if (isWoman) {
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x09090b })
    );
    hair.position.set(0, 0.04, -0.16);
    head.add(hair);
  }

  // Arms
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.28, 0.5, 0);
  torso.add(leftArm);
  const lUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.26, 8), clothMat);
  lUpper.position.y = -0.13;
  leftArm.add(lUpper);

  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -0.26, 0);
  leftArm.add(leftForearm);
  const lFore = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.24, 8), clothMat);
  lFore.position.y = -0.12;
  leftForearm.add(lFore);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.28, 0.5, 0);
  torso.add(rightArm);
  const rUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.26, 8), clothMat);
  rUpper.position.y = -0.13;
  rightArm.add(rUpper);

  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -0.26, 0);
  rightArm.add(rightForearm);
  const rFore = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.24, 8), clothMat);
  rFore.position.y = -0.12;
  rightForearm.add(rFore);

  // Legs
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.12, 0, 0);
  pelvis.add(leftLeg);
  const lThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.40, 8), pantsMat);
  lThigh.position.y = -0.20;
  leftLeg.add(lThigh);

  const leftCalf = new THREE.Group();
  leftCalf.position.set(0, -0.40, 0);
  leftLeg.add(leftCalf);
  const lCalfMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.40, 8), pantsMat);
  lCalfMesh.position.y = -0.20;
  leftCalf.add(lCalfMesh);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.12, 0, 0);
  pelvis.add(rightLeg);
  const rThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.40, 8), pantsMat);
  rThigh.position.y = -0.20;
  rightLeg.add(rThigh);

  const rightCalf = new THREE.Group();
  rightCalf.position.set(0, -0.40, 0);
  rightLeg.add(rightCalf);
  const rCalfMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.40, 8), pantsMat);
  rCalfMesh.position.y = -0.20;
  rightCalf.add(rCalfMesh);

  return {
    root,
    torso,
    head,
    leftArm,
    rightArm,
    leftForearm,
    rightForearm,
    leftLeg,
    rightLeg,
    leftCalf,
    rightCalf,
    animTime: Math.random() * 10,
    archetype,
  };
}

// 4. Authentic Green CNG Auto-Rickshaw (ঢাকা মেট্রো সিএনজি)
export function createCNGModel(): VehicleRig {
  const root = new THREE.Group();
  root.name = 'Dhaka_CNG';
  const wheels: THREE.Mesh[] = [];

  const greenMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.35, metalness: 0.4 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.45, metalness: 0.1 });
  const blackMetal = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5, metalness: 0.7 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.35, roughness: 0.1 });

  // Main Cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.95, 1.8), greenMat);
  cabin.position.set(0, 0.9, -0.2);
  cabin.castShadow = true;
  root.add(cabin);

  // Aerodynamic nose
  const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.7, 0.8, 4), greenMat);
  nose.rotateY(Math.PI / 4);
  nose.position.set(0, 0.8, 0.95);
  root.add(nose);

  // Clear windshield
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.05), glassMat);
  windshield.position.set(0, 1.25, 0.72);
  windshield.rotation.x = -0.25;
  root.add(windshield);

  // Yellow Fiberglass Roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.16, 2.3), yellowMat);
  roof.position.set(0, 1.5, -0.05);
  roof.castShadow = true;
  root.add(roof);

  // Side Metal Safety Grille (Wire Mesh)
  for (let s = -1; s <= 1; s += 2) {
    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.75, 1.2), blackMetal);
    grille.position.set(s * 0.7, 1.0, -0.15);
    root.add(grille);
  }

  // Front Headlight (with spotlight)
  const spot = new THREE.SpotLight(0xfef08a, 2, 25, Math.PI / 6, 0.3);
  spot.position.set(0, 0.78, 1.4);
  spot.target.position.set(0, 0, 10);
  root.add(spot);
  root.add(spot.target);

  const headlight = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 0.8 })
  );
  headlight.rotation.x = Math.PI / 2;
  headlight.position.set(0, 0.78, 1.35);
  root.add(headlight);

  // Bengali License plate at back
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.04), new THREE.MeshStandardMaterial({ color: 0x15803d }));
  plate.position.set(0, 0.6, -1.12);
  root.add(plate);

  // 3 Wheels
  const addWheel = (x: number, y: number, z: number) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 14), tireMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, y, z);
    w.castShadow = true;
    root.add(w);
    wheels.push(w);
  };

  addWheel(0, 0.32, 1.1); // Front
  addWheel(-0.75, 0.32, -0.8); // Rear Left
  addWheel(0.75, 0.32, -0.8); // Rear Right

  return { root, wheels, headlights: [spot], vehicleType: 'CNG', speed: 0, steerAngle: 0 };
}

// 5. Traditional Dhaka Rickshaw Model with Rickshaw Art
export function createRickshawModel(): VehicleRig {
  const root = new THREE.Group();
  root.name = 'Dhaka_Rickshaw';
  const wheels: THREE.Mesh[] = [];

  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
  const artTex = createRichRickshawArt();

  // Pipe chassis
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 8), chromeMat);
  pipe.rotation.x = Math.PI / 2;
  pipe.position.set(0, 0.45, 0);
  root.add(pipe);

  // Fork and handlebar
  const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8), chromeMat);
  fork.position.set(0, 0.7, 1.1);
  root.add(fork);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 8), chromeMat);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, 1.15, 1.05);
  root.add(bar);

  // Passenger Seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.2, 0.6), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
  seat.position.set(0, 0.85, -0.4);
  root.add(seat);

  // Rickshaw Art Backboard
  const artBoard = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.65, 0.04),
    new THREE.MeshStandardMaterial({ map: artTex, roughness: 0.35 })
  );
  artBoard.position.set(0, 1.25, -0.72);
  root.add(artBoard);

  // Folding Canopy Hood
  const hood = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.65, 1.15, 12, 1, false, 0, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x0284c7 })
  );
  hood.rotation.z = Math.PI / 2;
  hood.position.set(0, 1.5, -0.45);
  root.add(hood);

  // 3 Spoked Wheels
  const addWheel = (x: number, y: number, z: number) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.08, 16), tireMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, y, z);
    w.castShadow = true;
    root.add(w);
    wheels.push(w);
  };

  addWheel(0, 0.44, 1.2);
  addWheel(-0.68, 0.44, -0.45);
  addWheel(0.68, 0.44, -0.45);

  return { root, wheels, vehicleType: 'RICKSHAW', speed: 0, steerAngle: 0 };
}

// 6. Classic Dhaka City Bus (ঢাকা মেট্রো বাস)
export function createDhakaBusModel(): VehicleRig {
  const root = new THREE.Group();
  root.name = 'Dhaka_City_Bus';
  const wheels: THREE.Mesh[] = [];

  const busTex = createBusSideTexture();
  const sideMat = new THREE.MeshStandardMaterial({ map: busTex, roughness: 0.4 });
  const frontMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x0f172a, roughness: 0.1 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });

  // Main Bus Body (8m length, 2.8m width, 3.2m height)
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.6, 8.5), sideMat);
  body.position.y = 1.8;
  body.castShadow = true;
  root.add(body);

  // Front Windshield
  const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.2, 0.1), glassMat);
  frontGlass.position.set(0, 2.2, 4.3);
  root.add(frontGlass);

  // Front Destination Board ("গাবতলী - ফার্মগেট - মতিঝিল")
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.35, 0.1),
    new THREE.MeshStandardMaterial({ color: 0xfacc15 })
  );
  board.position.set(0, 2.95, 4.28);
  root.add(board);

  // Double Headlights
  for (let s = -1; s <= 1; s += 2) {
    const light = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.1, 10),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 0.8 })
    );
    light.rotation.x = Math.PI / 2;
    light.position.set(s * 0.9, 1.1, 4.3);
    root.add(light);
  }

  // 4 Large Bus Wheels
  const addWheel = (x: number, y: number, z: number) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.35, 16), tireMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, y, z);
    w.castShadow = true;
    root.add(w);
    wheels.push(w);
  };

  addWheel(-1.4, 0.55, 2.6);
  addWheel(1.4, 0.55, 2.6);
  addWheel(-1.4, 0.55, -2.6);
  addWheel(1.4, 0.55, -2.6);

  return { root, wheels, vehicleType: 'BUS', speed: 0, steerAngle: 0 };
}

// 7. Police Patrol SUV (বাংলাদেশ পুলিশ গাড়ি)
export function createPoliceCarModel(): VehicleRig {
  const root = new THREE.Group();
  root.name = 'Police_Patrol_Car';
  const wheels: THREE.Mesh[] = [];

  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.2 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.3 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x0f172a, roughness: 0.1 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.75, 4.2), whiteMat);
  body.position.y = 0.75;
  body.castShadow = true;
  root.add(body);

  // Side blue police stripe
  const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 4.0), blueMat);
  stripeL.position.set(-0.96, 0.75, 0);
  root.add(stripeL);
  const stripeR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 4.0), blueMat);
  stripeR.position.set(0.96, 0.75, 0);
  root.add(stripeR);

  // Cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.65, 2.2), glassMat);
  cabin.position.set(0, 1.35, -0.2);
  root.add(cabin);

  // Roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.08, 2.25), whiteMat);
  roof.position.set(0, 1.7, -0.2);
  root.add(roof);

  // Emergency Siren Lightbar (Red and Blue)
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.24), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
  bar.position.set(0, 1.8, -0.2);
  root.add(bar);

  const redLight = new THREE.PointLight(0xef4444, 3, 20);
  redLight.position.set(-0.4, 1.85, -0.2);
  root.add(redLight);

  const blueLight = new THREE.PointLight(0x3b82f6, 3, 20);
  blueLight.position.set(0.4, 1.85, -0.2);
  root.add(blueLight);

  // 4 Wheels
  const addWheel = (x: number, y: number, z: number) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.26, 14), tireMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, y, z);
    w.castShadow = true;
    root.add(w);
    wheels.push(w);
  };

  addWheel(-1.0, 0.38, 1.25);
  addWheel(1.0, 0.38, 1.25);
  addWheel(-1.0, 0.38, -1.25);
  addWheel(1.0, 0.38, -1.25);

  return { root, wheels, sirenLights: [redLight, blueLight], vehicleType: 'POLICE_CAR', speed: 0, steerAngle: 0 };
}

// 8. Multi-Storey Dhaka Building with Detailed Bengali Storefront & Rooftops
export function createDhakaBuilding(
  width: number,
  height: number,
  depth: number,
  wallColor: string,
  trimColor: string,
  shopTitleBn: string,
  shopSubBn: string,
  phoneBn: string,
  bannerBg: string,
  badgeIcon: string,
  brickMode = false
): THREE.Group {
  const building = new THREE.Group();

  const facadeTex = createBuildingFacadeTexture(wallColor, trimColor, brickMode);
  const wallMat = new THREE.MeshStandardMaterial({
    map: facadeTex,
    roughness: 0.85,
  });

  const structure = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMat);
  structure.position.y = height / 2;
  structure.castShadow = true;
  structure.receiveShadow = true;
  building.add(structure);

  // Ground Floor Shop Rollup Shutter
  const shutterMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5, metalness: 0.5 });
  const shutter = new THREE.Mesh(new THREE.BoxGeometry(width * 0.85, 3.2, 0.1), shutterMat);
  shutter.position.set(0, 1.6, depth / 2 + 0.05);
  building.add(shutter);

  // Colorful Bengali Shop Signboard Banner
  const bannerTex = createRichShopBanner(shopTitleBn, shopSubBn, phoneBn, bannerBg, '#0f172a', badgeIcon);
  const banner = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.94, 1.6, 0.2),
    new THREE.MeshStandardMaterial({ map: bannerTex, roughness: 0.4 })
  );
  banner.position.set(0, 3.8, depth / 2 + 0.15);
  banner.castShadow = true;
  building.add(banner);

  // Rooftop Parapet
  const parapet = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.3, 0.9, depth + 0.3),
    new THREE.MeshStandardMaterial({ color: trimColor, roughness: 0.8 })
  );
  parapet.position.y = height + 0.45;
  building.add(parapet);

  // Classic Sintex Water Tank (পানির ট্যাংক)
  const tank = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.85, 1.8, 12),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
  );
  tank.position.set(width * 0.25, height + 1.0, depth * 0.15);
  tank.castShadow = true;
  building.add(tank);

  // TV Dish Antenna
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(0.65, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.4),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 })
  );
  dish.rotation.x = Math.PI / 4;
  dish.position.set(-width * 0.25, height + 0.8, -depth * 0.15);
  building.add(dish);

  return building;
}

// 9. Electric Utility Poles with Crossbars & Sagging Overhead Cables (বিদ্যুতের খুঁটি ও তার)
export function createElectricPoleWithWires(): THREE.Group {
  const poleGroup = new THREE.Group();
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x3f1c04, roughness: 0.8 });

  // Main pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 9.0, 8), concreteMat);
  pole.position.y = 4.5;
  pole.castShadow = true;
  poleGroup.add(pole);

  // 2 Horizontal Crossbars
  const crossbar1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.12), woodMat);
  crossbar1.position.set(0, 7.8, 0);
  poleGroup.add(crossbar1);

  const crossbar2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.12), woodMat);
  crossbar2.position.set(0, 8.4, 0);
  poleGroup.add(crossbar2);

  // Insulators
  const insMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
  for (let s = -1; s <= 1; s += 2) {
    const ins1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.15, 6), insMat);
    ins1.position.set(s * 1.0, 7.9, 0);
    poleGroup.add(ins1);

    const ins2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.15, 6), insMat);
    ins2.position.set(s * 0.7, 8.5, 0);
    poleGroup.add(ins2);
  }

  // Transformer Drum on Pole
  const trans = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 1.0, 10),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 })
  );
  trans.position.set(0.45, 6.2, 0);
  poleGroup.add(trans);

  return poleGroup;
}

// 10. Complete Street Market Stalls with Crates of Fresh Hilsa Fish, Vegetables, and Fruits
export function createDetailedMarketStalls(): THREE.Group {
  const market = new THREE.Group();
  market.name = 'Dhaka_Bazaar_District';

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.9 });
  const fishTex = createVegFishBoxTexture('FISH');
  const vegTex = createVegFishBoxTexture('VEG');
  const fruitTex = createVegFishBoxTexture('FRUIT');

  const fishMat = new THREE.MeshStandardMaterial({ map: fishTex, roughness: 0.4 });
  const vegMat = new THREE.MeshStandardMaterial({ map: vegTex, roughness: 0.6 });
  const fruitMat = new THREE.MeshStandardMaterial({ map: fruitTex, roughness: 0.6 });

  // 3 Covered Stalls in a bustling row
  const umbrellaColors = [0xdc2626, 0x0284c7, 0x16a34a];

  for (let s = 0; s < 3; s++) {
    const stall = new THREE.Group();
    stall.position.set(s * 5.5, 0, 0);

    // Table
    const table = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.85, 1.8), woodMat);
    table.position.set(0, 0.42, 0);
    table.castShadow = true;
    stall.add(table);

    // Large Market Striped Parasol / Umbrella
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 6), woodMat);
    pole.position.set(0, 1.6, 0);
    stall.add(pole);

    const umbrella = new THREE.Mesh(
      new THREE.ConeGeometry(2.4, 0.9, 12, 1, true),
      new THREE.MeshStandardMaterial({ color: umbrellaColors[s], roughness: 0.7 })
    );
    umbrella.position.set(0, 3.1, 0);
    umbrella.castShadow = true;
    stall.add(umbrella);

    // Produce Baskets on table
    const boxMat = s === 0 ? fishMat : s === 1 ? vegMat : fruitMat;
    for (let b = -1.2; b <= 1.2; b += 1.2) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, 1.2), boxMat);
      box.position.set(b, 0.95, 0);
      box.castShadow = true;
      stall.add(box);
    }

    market.add(stall);
  }

  return market;
}

// 11. Roadside Tree with Foliage and Concrete Planter Box
export function createRoadsideTree(): THREE.Group {
  const tree = new THREE.Group();

  // Square concrete planter box
  const planter = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.4, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 })
  );
  planter.position.y = 0.2;
  tree.add(planter);

  // Dirt
  const soil = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.05, 1.6),
    new THREE.MeshStandardMaterial({ color: 0x3f1c04, roughness: 0.95 })
  );
  soil.position.y = 0.4;
  tree.add(soil);

  // Trunk
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.28, 4.0, 8),
    new THREE.MeshStandardMaterial({ color: 0x5c2b0c, roughness: 0.9 })
  );
  trunk.position.y = 2.2;
  trunk.castShadow = true;
  tree.add(trunk);

  // Lush multi-sphere tropical foliage
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 });
  const f1 = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), foliageMat);
  f1.position.set(0, 4.8, 0);
  f1.castShadow = true;
  tree.add(f1);

  const f2 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), foliageMat);
  f2.position.set(0.6, 5.4, 0.4);
  tree.add(f2);

  const f3 = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 8), foliageMat);
  f3.position.set(-0.5, 5.2, -0.3);
  tree.add(f3);

  return tree;
}

// 12. Street Lamp with Warm Emissive Glow
export function createStreetLight(): THREE.Group {
  const group = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 6.0, 8), poleMat);
  pole.position.y = 3.0;
  pole.castShadow = true;
  group.add(pole);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.08), poleMat);
  arm.position.set(0.6, 5.9, 0);
  group.add(arm);

  const lantern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.12, 0.35, 8),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 1.0 })
  );
  lantern.position.set(1.2, 5.7, 0);
  group.add(lantern);

  const light = new THREE.PointLight(0xfef08a, 1.8, 16);
  light.position.set(1.2, 5.5, 0);
  group.add(light);

  return group;
}
