import * as THREE from 'three';
import {
  createRichShopBanner,
  createBuildingFacadeTexture,
  createBusSideTexture,
  createRichRickshawArt,
  createCNGDetailsTexture,
  createPoliceLiveryTexture,
  createHumanFaceTexture,
  createPlaidTrousersTexture,
  createTShirtStripesTexture,
  createShopShelvesTexture,
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
  leftHand?: THREE.Group;
  rightHand?: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftCalf: THREE.Group;
  rightCalf: THREE.Group;
  leftFoot?: THREE.Group;
  rightFoot?: THREE.Group;
  moneySack?: THREE.Group;
  baton?: THREE.Mesh;
  animTime: number;
  archetype?: string;
  isKnockedDown?: boolean;
  knockDownTimer?: number;
}

export interface VehicleRig {
  root: THREE.Group;
  wheels: THREE.Mesh[];
  sirenLights?: THREE.PointLight[];
  headlights?: THREE.SpotLight[];
  vehicleType: 'CNG' | 'RICKSHAW' | 'BUS' | 'CAR' | 'BIKE' | 'POLICE_CAR';
  speed: number;
  steerAngle: number;
}

// Reusable Shared Geometries & Materials (Extreme Memory & GPU Optimization)
const sharedGeos = {
  wheelTire: new THREE.CylinderGeometry(0.38, 0.38, 0.22, 16),
  wheelRim: new THREE.CylinderGeometry(0.24, 0.24, 0.24, 16),
  rickshawWheel: new THREE.CylinderGeometry(0.48, 0.48, 0.05, 18),
  limbUpper: new THREE.CylinderGeometry(0.08, 0.07, 0.38, 10),
  limbLower: new THREE.CylinderGeometry(0.07, 0.06, 0.38, 10),
  jointSphere: new THREE.SphereGeometry(0.075, 8, 8),
  sneaker: new THREE.BoxGeometry(0.11, 0.08, 0.22),
  waterTank: new THREE.CylinderGeometry(0.85, 0.85, 1.6, 12),
};

sharedGeos.wheelTire.rotateZ(Math.PI / 2);
sharedGeos.wheelRim.rotateZ(Math.PI / 2);
sharedGeos.rickshawWheel.rotateZ(Math.PI / 2);

const sharedMats = {
  blackRubber: new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 }),
  silverRim: new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.8, roughness: 0.25 }),
  goldMetal: new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.85, roughness: 0.2 }),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.5,
    roughness: 0.1,
    metalness: 0.1,
  }),
  headlightLens: new THREE.MeshBasicMaterial({ color: 0xfef08a }),
  taillightLens: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
  policeBlueLight: new THREE.MeshBasicMaterial({ color: 0x3b82f6 }),
  cngGreen: new THREE.MeshStandardMaterial({ color: 0x15803d, metalness: 0.35, roughness: 0.35 }),
  cngCanopyBlack: new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.85 }),
  chrome: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.1 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x5c2b0c, roughness: 0.85 }),
  whiteSneaker: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }),
};

// 1. High-Fidelity Hero Thief Character Model ("আমরা চোর")
// Natural Human Body Proportions, Expressive Face, Aviator Sunglasses, Striped T-Shirt, Plaid Trousers, Sneakers, Money Sack
export function createThiefModel(): CharacterRig {
  const root = new THREE.Group();
  root.name = 'Hero_Thief_Player';

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xc87d55, // Bengali warm skin tone
    roughness: 0.55,
  });

  const shirtMat = new THREE.MeshStandardMaterial({
    map: createTShirtStripesTexture(),
    roughness: 0.65,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    map: createPlaidTrousersTexture(),
    roughness: 0.75,
  });

  // Pelvis / Hips
  const pelvis = new THREE.Group();
  pelvis.position.y = 0.95;
  root.add(pelvis);

  // Torso / Chest with natural muscular taper
  const torso = new THREE.Group();
  pelvis.add(torso);

  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.58, 12), shirtMat);
  chest.position.y = 0.29;
  chest.castShadow = true;
  torso.add(chest);

  // Crew Neck Collar
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.12, 0.02, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 })
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0.58, 0);
  torso.add(collar);

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.14, 10), skinMat);
  neck.position.y = 0.64;
  torso.add(neck);

  // Head Group
  const head = new THREE.Group();
  head.position.y = 0.82;
  torso.add(head);

  // Sculpted Head & Face with jawline and chin
  const faceTex = createHumanFaceTexture('#c87d55', false, false);
  const headMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 14),
    new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.55 })
  );
  headMesh.scale.set(1, 1.15, 0.95);
  headMesh.castShadow = true;
  head.add(headMesh);

  // 3D Ears
  const earL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), skinMat);
  earL.scale.set(0.5, 1, 0.8);
  earL.position.set(-0.19, 0, 0);
  head.add(earL);

  const earR = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), skinMat);
  earR.scale.set(0.5, 1, 0.8);
  earR.position.set(0.19, 0, 0);
  head.add(earR);

  // Voluminous Styled Black Hair (Side parting with stylish bangs)
  const hairGroup = new THREE.Group();
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.85 });

  const hairTop = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
    hairMat
  );
  hairTop.position.set(0, 0.06, -0.01);
  hairGroup.add(hairTop);

  // Front stylish bangs
  const bangs = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.06), hairMat);
  bangs.rotation.z = -0.15;
  bangs.position.set(-0.04, 0.15, 0.14);
  hairGroup.add(bangs);
  head.add(hairGroup);

  // Dark Aviator Sunglasses (চশমা)
  const glasses = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.9, roughness: 0.1 });
  const lensMat = new THREE.MeshPhysicalMaterial({
    color: 0x09090b,
    metalness: 0.95,
    roughness: 0.05,
    clearcoat: 1.0,
  });

  const lensL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.02), lensMat);
  lensL.position.set(-0.06, 0.02, 0.18);
  glasses.add(lensL);

  const lensR = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.02), lensMat);
  lensR.position.set(0.06, 0.02, 0.18);
  glasses.add(lensR);

  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.02), frameMat);
  bridge.position.set(0, 0.03, 0.18);
  glasses.add(bridge);
  head.add(glasses);

  // Articulated Arms with Shoulder Caps, Elbows, and Sculpted Hands
  const makeArm = (isRight: boolean) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(isRight ? 0.28 : -0.28, 0.52, 0);

    // Shoulder cap
    const cap = new THREE.Mesh(sharedGeos.jointSphere, shirtMat);
    shoulder.add(cap);

    // Upper arm (Short sleeve + bare arm)
    const upper = new THREE.Mesh(sharedGeos.limbUpper, shirtMat);
    upper.position.y = -0.19;
    upper.castShadow = true;
    shoulder.add(upper);

    // Elbow Joint
    const forearm = new THREE.Group();
    forearm.position.y = -0.38;
    shoulder.add(forearm);

    const elbow = new THREE.Mesh(sharedGeos.jointSphere, skinMat);
    forearm.add(elbow);

    // Forearm
    const lower = new THREE.Mesh(sharedGeos.limbLower, skinMat);
    lower.position.y = -0.19;
    lower.castShadow = true;
    forearm.add(lower);

    // Wristband
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.03, 8),
      new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    band.position.y = -0.36;
    forearm.add(band);

    // Hand with distinct thumb & fingers
    const hand = new THREE.Group();
    hand.position.y = -0.42;

    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.04), skinMat);
    palm.position.y = -0.04;
    hand.add(palm);

    const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.05, 0.025), skinMat);
    thumb.position.set(isRight ? -0.04 : 0.04, -0.03, 0.02);
    hand.add(thumb);

    forearm.add(hand);
    torso.add(shoulder);
    return { shoulder, forearm, hand };
  };

  const leftArmData = makeArm(false);
  const rightArmData = makeArm(true);

  // Articulated Legs with Plaid Trousers, Knee Joints, and White Sneakers
  const makeLeg = (isRight: boolean) => {
    const hip = new THREE.Group();
    hip.position.set(isRight ? 0.12 : -0.12, 0, 0);

    const hipJoint = new THREE.Mesh(sharedGeos.jointSphere, pantsMat);
    hip.add(hipJoint);

    const thigh = new THREE.Mesh(sharedGeos.limbUpper, pantsMat);
    thigh.position.y = -0.19;
    thigh.castShadow = true;
    hip.add(thigh);

    const calf = new THREE.Group();
    calf.position.y = -0.38;
    hip.add(calf);

    const knee = new THREE.Mesh(sharedGeos.jointSphere, pantsMat);
    calf.add(knee);

    const shin = new THREE.Mesh(sharedGeos.limbLower, pantsMat);
    shin.position.y = -0.19;
    shin.castShadow = true;
    calf.add(shin);

    // Trousers rolled cuff
    const cuff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.04, 8),
      new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.8 })
    );
    cuff.position.y = -0.36;
    calf.add(cuff);

    // White Sneaker with Black Laces & Sole
    const foot = new THREE.Group();
    foot.position.y = -0.42;

    const sneaker = new THREE.Mesh(sharedGeos.sneaker, sharedMats.whiteSneaker);
    sneaker.position.set(0, -0.02, 0.05);
    sneaker.castShadow = true;
    foot.add(sneaker);

    // Black Laces detailing
    const laces = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.02, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x09090b })
    );
    laces.position.set(0, 0.03, 0.04);
    foot.add(laces);

    calf.add(foot);
    pelvis.add(hip);
    return { hip, calf, foot };
  };

  const leftLegData = makeLeg(false);
  const rightLegData = makeLeg(true);

  // Round Burlap Money Sack slung on back with Bengali Taka Symbol ৳
  const moneySack = new THREE.Group();
  moneySack.position.set(0.14, 0.35, -0.24);

  const sackMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 })
  );
  sackMesh.scale.set(0.9, 1.25, 0.85);
  sackMesh.castShadow = true;
  moneySack.add(sackMesh);

  // Tied Rope knot at top of sack
  const rope = new THREE.Mesh(
    new THREE.TorusGeometry(0.07, 0.02, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0x78350f })
  );
  rope.position.set(0, 0.26, 0);
  moneySack.add(rope);

  // Bengali ৳ Symbol badge on sack
  const canvasTaka = document.createElement('canvas');
  canvasTaka.width = 64;
  canvasTaka.height = 64;
  const tCtx = canvasTaka.getContext('2d')!;
  tCtx.fillStyle = '#0f172a';
  tCtx.font = 'bold 44px "Hind Siliguri", sans-serif';
  tCtx.textAlign = 'center';
  tCtx.textBaseline = 'middle';
  tCtx.fillText('৳', 32, 34);
  const takaTex = new THREE.CanvasTexture(canvasTaka);
  const takaBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.2, 0.2),
    new THREE.MeshBasicMaterial({ map: takaTex, transparent: true })
  );
  takaBadge.position.set(0, 0, 0.21);
  moneySack.add(takaBadge);
  torso.add(moneySack);

  return {
    root,
    torso,
    head,
    leftArm: leftArmData.shoulder,
    rightArm: rightArmData.shoulder,
    leftForearm: leftArmData.forearm,
    rightForearm: rightArmData.forearm,
    leftHand: leftArmData.hand,
    rightHand: rightArmData.hand,
    leftLeg: leftLegData.hip,
    rightLeg: rightLegData.hip,
    leftCalf: leftLegData.calf,
    rightCalf: rightLegData.calf,
    leftFoot: leftLegData.foot,
    rightFoot: rightLegData.foot,
    moneySack,
    animTime: 0,
    archetype: 'HERO_THIEF',
  };
}

// 2. Bangladesh Police Officer Character Model (বাংলাদেশ পুলিশ)
export function createPoliceModel(): CharacterRig {
  const root = new THREE.Group();
  root.name = 'Police_Officer';

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xbf7854, roughness: 0.6 });
  const uniformMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.65 }); // Deep Bangladesh police blue
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.5 });
  const bootsMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2, metalness: 0.6 });

  const pelvis = new THREE.Group();
  pelvis.position.y = 0.95;
  root.add(pelvis);

  const torso = new THREE.Group();
  pelvis.add(torso);

  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.6, 12), uniformMat);
  chest.position.y = 0.3;
  chest.castShadow = true;
  torso.add(chest);

  // Duty Belt & Gold Buckle
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.08, 12), beltMat);
  belt.position.y = 0.04;
  torso.add(belt);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.04), sharedMats.goldMetal);
  buckle.position.set(0, 0.04, 0.21);
  torso.add(buckle);

  // Head with Police Mustache & Official Peaked Cap (পিক ক্যাপ)
  const head = new THREE.Group();
  head.position.y = 0.8;
  torso.add(head);

  const faceTex = createHumanFaceTexture('#bf7854', true, true);
  const headMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 14, 12),
    new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.6 })
  );
  headMesh.scale.set(1, 1.15, 0.95);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Bangladesh Police Cap (পিক ক্যাপ)
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.19, 0.12, 14),
    new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.7 })
  );
  cap.position.set(0, 0.16, 0.02);
  head.add(cap);

  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.02, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.1, metalness: 0.8 })
  );
  visor.position.set(0, 0.11, 0.16);
  head.add(visor);

  // Gold Police Cap Badge
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), sharedMats.goldMetal);
  badge.position.set(0, 0.18, 0.2);
  head.add(badge);

  // Helper for police limbs
  const makeLimb = (isArm: boolean, isRight: boolean) => {
    const parent = new THREE.Group();
    if (isArm) {
      parent.position.set(isRight ? 0.3 : -0.3, 0.52, 0);
      torso.add(parent);
    } else {
      parent.position.set(isRight ? 0.13 : -0.13, 0, 0);
      pelvis.add(parent);
    }

    const upper = new THREE.Mesh(sharedGeos.limbUpper, uniformMat);
    upper.position.y = -0.19;
    upper.castShadow = true;
    parent.add(upper);

    const child = new THREE.Group();
    child.position.y = -0.38;
    parent.add(child);

    const lower = new THREE.Mesh(sharedGeos.limbLower, isArm ? skinMat : uniformMat);
    lower.position.y = -0.19;
    lower.castShadow = true;
    child.add(lower);

    if (isArm) {
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.04), skinMat);
      hand.position.y = -0.42;
      child.add(hand);
    } else {
      const boot = new THREE.Mesh(sharedGeos.sneaker, bootsMat);
      boot.position.set(0, -0.42, 0.05);
      child.add(boot);
    }

    return { parent, child };
  };

  const lArm = makeLimb(true, false);
  const rArm = makeLimb(true, true);
  const lLeg = makeLimb(false, false);
  const rLeg = makeLimb(false, true);

  // Police Lathi / Baton in right hand
  const baton = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.65, 8),
    sharedMats.wood
  );
  baton.position.set(0, -0.38, 0.18);
  baton.rotation.x = Math.PI / 3;
  rArm.child.add(baton);

  return {
    root,
    torso,
    head,
    leftArm: lArm.parent,
    rightArm: rArm.parent,
    leftForearm: lArm.child,
    rightForearm: rArm.child,
    leftLeg: lLeg.parent,
    rightLeg: rLeg.parent,
    leftCalf: lLeg.child,
    rightCalf: rLeg.child,
    baton,
    animTime: 0,
    archetype: 'POLICE',
  };
}

// 3. Diverse Bangladeshi Crowd NPCs (নাগরিকবৃন্দ ও মারামারির শত্রু)
export function createCitizenModel(
  archetype: 'SHOPKEEPER' | 'ELDER' | 'STUDENT' | 'WOMAN' | 'PULLER' | 'BRAWLER_RED',
  primaryColor = 0x3b82f6
): CharacterRig {
  const root = new THREE.Group();
  root.name = `NPC_${archetype}`;

  const isElder = archetype === 'ELDER';
  const isWoman = archetype === 'WOMAN';
  const isBrawlerRed = archetype === 'BRAWLER_RED';

  const skinTone = isElder ? 0x9a5c3d : isWoman ? 0xd49575 : 0xbf7854;
  const skinMat = new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.65 });
  const clothMat = new THREE.MeshStandardMaterial({
    color: isBrawlerRed ? 0xb91c1c : primaryColor, // Crimson red for brawler enemy matching screenshot!
    roughness: 0.75,
  });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 });

  const pelvis = new THREE.Group();
  pelvis.position.y = 0.92;
  root.add(pelvis);

  const torso = new THREE.Group();
  pelvis.add(torso);

  const chest = new THREE.Mesh(
    new THREE.CylinderGeometry(isWoman ? 0.22 : 0.24, 0.19, 0.56, 10),
    isElder ? whiteMat : clothMat
  );
  chest.position.y = 0.28;
  chest.castShadow = true;
  torso.add(chest);

  const head = new THREE.Group();
  head.position.y = 0.76;
  torso.add(head);

  const faceTex = createHumanFaceTexture(
    isElder ? '#9a5c3d' : isWoman ? '#d49575' : '#bf7854',
    isElder || isBrawlerRed,
    false
  );
  const headMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 12, 10),
    new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.6 })
  );
  headMesh.scale.set(1, 1.15, 0.95);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Elder Skullcap / Muslim Topi
  if (isElder) {
    const topi = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.18, 0.08, 10), whiteMat);
    topi.position.y = 0.16;
    head.add(topi);
  }

  // Woman Hair Bun (খোঁপা)
  if (isWoman) {
    const bun = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 })
    );
    bun.position.set(0, 0.04, -0.16);
    head.add(bun);
  }

  const makeLimb = (isArm: boolean, isRight: boolean) => {
    const parent = new THREE.Group();
    if (isArm) {
      parent.position.set(isRight ? 0.28 : -0.28, 0.48, 0);
      torso.add(parent);
    } else {
      parent.position.set(isRight ? 0.12 : -0.12, 0, 0);
      pelvis.add(parent);
    }

    const upper = new THREE.Mesh(sharedGeos.limbUpper, isArm ? skinMat : clothMat);
    upper.position.y = -0.19;
    upper.castShadow = true;
    parent.add(upper);

    const child = new THREE.Group();
    child.position.y = -0.38;
    parent.add(child);

    const lower = new THREE.Mesh(sharedGeos.limbLower, skinMat);
    lower.position.y = -0.19;
    lower.castShadow = true;
    child.add(lower);

    return { parent, child };
  };

  const lArm = makeLimb(true, false);
  const rArm = makeLimb(true, true);
  const lLeg = makeLimb(false, false);
  const rLeg = makeLimb(false, true);

  return {
    root,
    torso,
    head,
    leftArm: lArm.parent,
    rightArm: rArm.parent,
    leftForearm: lArm.child,
    rightForearm: rArm.child,
    leftLeg: lLeg.parent,
    rightLeg: rLeg.parent,
    leftCalf: lLeg.child,
    rightCalf: rLeg.child,
    animTime: Math.random() * 10,
    archetype,
  };
}

// 4. Detailed Green CNG Auto-Rickshaw Model (সিএনজি অটো-রিকশা)
export function createCNGModel(): VehicleRig {
  const root = new THREE.Group();
  root.name = 'Green_CNG';

  const wheels: THREE.Mesh[] = [];

  // Main chassis aerodynamic shell
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.25, 2.6), sharedMats.cngGreen);
  body.position.y = 0.85;
  body.castShadow = true;
  root.add(body);

  // Black Canvas Roof Canopy (ছাদের কালো হুড)
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.22, 2.45), sharedMats.cngCanopyBlack);
  roof.position.set(0, 1.55, 0);
  root.add(roof);

  // Front Windshield with black frame
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.65, 0.08), sharedMats.glass);
  windshield.position.set(0, 1.15, 1.25);
  root.add(windshield);

  // Side Metal Safety Grille / Mesh Cage Doors (সিএনজির পাশের খাঁচা)
  const cageMat = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    metalness: 0.8,
    roughness: 0.4,
    wireframe: true,
  });
  const leftCage = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.75), cageMat);
  leftCage.position.set(-0.71, 1.05, -0.2);
  leftCage.rotation.y = Math.PI / 2;
  root.add(leftCage);

  const rightCage = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.75), cageMat);
  rightCage.position.set(0.71, 1.05, -0.2);
  rightCage.rotation.y = -Math.PI / 2;
  root.add(rightCage);

  // Dhaka Registration Plate ("ঢাকা মেট্রো-থ ১১-৪২০২")
  const plateTex = createCNGDetailsTexture();
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 0.4),
    new THREE.MeshStandardMaterial({ map: plateTex, roughness: 0.3 })
  );
  plate.position.set(0, 0.6, -1.31);
  plate.rotation.y = Math.PI;
  root.add(plate);

  // Front Chrome Headlight
  const headlight = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 12), sharedMats.chrome);
  headlight.rotation.x = Math.PI / 2;
  headlight.position.set(0, 0.85, 1.35);
  root.add(headlight);

  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.12, 12), sharedMats.headlightLens);
  lens.position.set(0, 0.85, 1.41);
  root.add(lens);

  // Rear Taillights
  const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.06), sharedMats.taillightLens);
  tailL.position.set(-0.55, 0.75, -1.32);
  root.add(tailL);

  const tailR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.06), sharedMats.taillightLens);
  tailR.position.set(0.55, 0.75, -1.32);
  root.add(tailR);

  // 3 Wheels (1 Front Center, 2 Rear Sides)
  const wFront = new THREE.Mesh(sharedGeos.wheelTire, sharedMats.blackRubber);
  wFront.position.set(0, 0.38, 1.05);
  wFront.castShadow = true;
  root.add(wFront);
  wheels.push(wFront);

  const wRearL = new THREE.Mesh(sharedGeos.wheelTire, sharedMats.blackRubber);
  wRearL.position.set(-0.72, 0.38, -0.85);
  wRearL.castShadow = true;
  root.add(wRearL);
  wheels.push(wRearL);

  const wRearR = new THREE.Mesh(sharedGeos.wheelTire, sharedMats.blackRubber);
  wRearR.position.set(0.72, 0.38, -0.85);
  wRearR.castShadow = true;
  root.add(wRearR);
  wheels.push(wRearR);

  return {
    root,
    wheels,
    vehicleType: 'CNG',
    speed: 0,
    steerAngle: 0,
  };
}

// 5. Detailed Traditional Dhaka Rickshaw Model (ঐতিহ্যবাহী ঢাকাই রিকশা)
export function createRickshawModel(): VehicleRig {
  const root = new THREE.Group();
  root.name = 'Dhaka_Rickshaw';

  const wheels: THREE.Mesh[] = [];

  // Chrome Tubular Bicycle Frame
  const frame = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8), sharedMats.chrome);
  frame.rotation.x = Math.PI / 2;
  frame.position.set(0, 0.55, 0.3);
  root.add(frame);

  // Handlebars & Bell ("টিং টিং")
  const handlebar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.04), sharedMats.chrome);
  handlebar.position.set(0, 1.15, 1.05);
  root.add(handlebar);

  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), sharedMats.goldMetal);
  bell.position.set(0.2, 1.2, 1.05);
  root.add(bell);

  // Passenger Bench Seat with Red/Gold Rexine Floral Cushion
  const seatMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.18, 0.45), seatMat);
  seat.position.set(0, 0.85, -0.45);
  root.add(seat);

  const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.45, 0.1), seatMat);
  backrest.position.set(0, 1.15, -0.65);
  root.add(backrest);

  // Ornate Rickshaw Hood Canopy (রিকশার ভাঁজ হওয়া হুড)
  const hood = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 0.98, 12, 1, false, 0, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6 })
  );
  hood.rotation.z = Math.PI / 2;
  hood.position.set(0, 1.35, -0.6);
  root.add(hood);

  // Authentic Colorful Bengali Rickshaw Art Rear Plate (রিকশা আর্ট)
  const artTex = createRichRickshawArt();
  const artPlate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.85, 0.5),
    new THREE.MeshStandardMaterial({ map: artTex, roughness: 0.4 })
  );
  artPlate.position.set(0, 0.72, -0.88);
  artPlate.rotation.y = Math.PI;
  root.add(artPlate);

  // Large Spoked Wheels (1 Front, 2 Rear)
  const wFront = new THREE.Mesh(sharedGeos.rickshawWheel, sharedMats.blackRubber);
  wFront.position.set(0, 0.48, 1.3);
  wFront.castShadow = true;
  root.add(wFront);
  wheels.push(wFront);

  const wRearL = new THREE.Mesh(sharedGeos.rickshawWheel, sharedMats.blackRubber);
  wRearL.position.set(-0.58, 0.48, -0.55);
  wRearL.castShadow = true;
  root.add(wRearL);
  wheels.push(wRearL);

  const wRearR = new THREE.Mesh(sharedGeos.rickshawWheel, sharedMats.blackRubber);
  wRearR.position.set(0.58, 0.48, -0.55);
  wRearR.castShadow = true;
  root.add(wRearR);
  wheels.push(wRearR);

  return {
    root,
    wheels,
    vehicleType: 'RICKSHAW',
    speed: 0,
    steerAngle: 0,
  };
}

// 6. Detailed Dhaka Local Bus Model ("মুড়ির টিন" / লোকাল বাস)
export function createDhakaBusModel(): VehicleRig {
  const root = new THREE.Group();
  root.name = 'Dhaka_Bus';

  const wheels: THREE.Mesh[] = [];

  const busTex = createBusSideTexture();
  const bodyMat = new THREE.MeshStandardMaterial({ map: busTex, roughness: 0.7 });
  const busBody = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.4, 8.5), bodyMat);
  busBody.position.y = 1.7;
  busBody.castShadow = true;
  root.add(busBody);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(2.45, 0.35, 8.45),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 })
  );
  roof.position.set(0, 2.95, 0);
  root.add(roof);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 0.1), sharedMats.glass);
  windshield.position.set(0, 2.1, 4.26);
  root.add(windshield);

  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.1), sharedMats.chrome);
  grille.position.set(0, 1.05, 4.26);
  root.add(grille);

  const bumper = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.3, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.8 })
  );
  bumper.position.set(0, 0.6, 4.3);
  root.add(bumper);

  const hl1 = new THREE.Mesh(new THREE.CircleGeometry(0.16, 12), sharedMats.headlightLens);
  hl1.position.set(-0.85, 1.05, 4.27);
  root.add(hl1);

  const hl2 = new THREE.Mesh(new THREE.CircleGeometry(0.16, 12), sharedMats.headlightLens);
  hl2.position.set(0.85, 1.05, 4.27);
  root.add(hl2);

  const rack = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.25, 4.5),
    new THREE.MeshStandardMaterial({ color: 0x475569, wireframe: true })
  );
  rack.position.set(0, 3.25, -0.5);
  root.add(rack);

  const wheelPositions = [
    [-1.2, 0.52, 2.6],
    [1.2, 0.52, 2.6],
    [-1.2, 0.52, -2.4],
    [1.2, 0.52, -2.4],
    [-1.2, 0.52, -3.2],
    [1.2, 0.52, -3.2],
  ];

  wheelPositions.forEach(([x, y, z]) => {
    const w = new THREE.Mesh(sharedGeos.wheelTire, sharedMats.blackRubber);
    w.scale.set(1.2, 1.2, 1.2);
    w.position.set(x, y, z);
    w.castShadow = true;
    root.add(w);
    wheels.push(w);
  });

  return {
    root,
    wheels,
    vehicleType: 'BUS',
    speed: 0,
    steerAngle: 0,
  };
}

// 7. Police Patrol SUV Model (বাংলাদেশ পুলিশ গাড়ি)
export function createPoliceCarModel(): VehicleRig {
  const root = new THREE.Group();
  root.name = 'Police_Patrol_Car';

  const wheels: THREE.Mesh[] = [];
  const sirenLights: THREE.PointLight[] = [];

  const liveryTex = createPoliceLiveryTexture();
  const bodyMat = new THREE.MeshStandardMaterial({ map: liveryTex, roughness: 0.35, metalness: 0.2 });

  const carBody = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.95, 4.4), bodyMat);
  carBody.position.y = 0.85;
  carBody.castShadow = true;
  root.add(carBody);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.75, 2.4),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 })
  );
  cabin.position.set(0, 1.55, -0.2);
  root.add(cabin);

  const winFront = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.6, 0.08), sharedMats.glass);
  winFront.position.set(0, 1.52, 1.02);
  root.add(winFront);

  const bullBar = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.65, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.9, roughness: 0.2 })
  );
  bullBar.position.set(0, 0.75, 2.25);
  root.add(bullBar);

  // Roof Emergency Siren Lightbar
  const lightbarBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.08, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 })
  );
  lightbarBase.position.set(0, 1.95, -0.2);
  root.add(lightbarBase);

  // Red Siren
  const redLight = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.16), sharedMats.taillightLens);
  redLight.position.set(-0.25, 2.02, -0.2);
  root.add(redLight);

  const redPoint = new THREE.PointLight(0xef4444, 4.0, 15);
  redPoint.position.set(-0.25, 2.05, -0.2);
  root.add(redPoint);
  sirenLights.push(redPoint);

  // Blue Siren
  const blueLight = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.16), sharedMats.policeBlueLight);
  blueLight.position.set(0.25, 2.02, -0.2);
  root.add(blueLight);

  const bluePoint = new THREE.PointLight(0x3b82f6, 4.0, 15);
  bluePoint.position.set(0.25, 2.05, -0.2);
  root.add(bluePoint);
  sirenLights.push(bluePoint);

  const wPositions = [
    [-1.0, 0.42, 1.35],
    [1.0, 0.42, 1.35],
    [-1.0, 0.42, -1.35],
    [1.0, 0.42, -1.35],
  ];

  wPositions.forEach(([x, y, z]) => {
    const w = new THREE.Mesh(sharedGeos.wheelTire, sharedMats.blackRubber);
    w.position.set(x, y, z);
    w.castShadow = true;
    root.add(w);
    wheels.push(w);
  });

  return {
    root,
    wheels,
    sirenLights,
    vehicleType: 'POLICE_CAR',
    speed: 0,
    steerAngle: 0,
  };
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
  const wallMat = new THREE.MeshStandardMaterial({ map: facadeTex, roughness: 0.85 });

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
  const tank = new THREE.Mesh(sharedGeos.waterTank, sharedMats.blackRubber);
  tank.position.set(width * 0.25, height + 0.9, depth * 0.15);
  tank.castShadow = true;
  building.add(tank);

  return building;
}

// 9. Electric Utility Poles with Crossbars & Sagging Overhead Cables (বিদ্যুতের খুঁটি ও তার)
export function createElectricPoleWithWires(): THREE.Group {
  const poleGroup = new THREE.Group();
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x3f1c04, roughness: 0.8 });

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 9.0, 8), concreteMat);
  pole.position.y = 4.5;
  pole.castShadow = true;
  poleGroup.add(pole);

  const crossbar1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.12), woodMat);
  crossbar1.position.set(0, 7.8, 0);
  poleGroup.add(crossbar1);

  const crossbar2 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.12), woodMat);
  crossbar2.position.set(0, 8.4, 0);
  poleGroup.add(crossbar2);

  const insMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2 });
  [-1.0, -0.4, 0.4, 1.0].forEach((x) => {
    const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.14, 6), insMat);
    ins.position.set(x, 7.9, 0);
    poleGroup.add(ins);
  });

  return poleGroup;
}

// 10. Streetlights (রাস্তার ল্যাম্পপোস্ট)
export function createStreetLight(): THREE.Group {
  const group = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 6.5, 8), metalMat);
  post.position.y = 3.25;
  group.add(post);

  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8), metalMat);
  arm.rotation.z = Math.PI / 3;
  arm.position.set(0.4, 6.3, 0);
  group.add(arm);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.1, 0.25), metalMat);
  head.position.set(0.85, 6.6, 0);
  group.add(head);

  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.2), sharedMats.headlightLens);
  lamp.position.set(0.85, 6.53, 0);
  group.add(lamp);

  return group;
}

// 11. Roadside Palm / Neem Tree (রাস্তার ধারের গাছ)
export function createRoadsideTree(): THREE.Group {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 3.2, 8), sharedMats.wood);
  trunk.position.y = 1.6;
  trunk.castShadow = true;
  tree.add(trunk);

  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
  const f1 = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 8), foliageMat);
  f1.position.y = 3.8;
  f1.castShadow = true;
  tree.add(f1);

  const f2 = new THREE.Mesh(new THREE.SphereGeometry(1.0, 8, 8), foliageMat);
  f2.position.set(0.4, 4.6, 0.2);
  f2.castShadow = true;
  tree.add(f2);

  return tree;
}

// 12. Detailed Dhaka Bazaar Stalls, Shelves & Tong Tea Cafe (দোকানের আলমারি ও টং ক্যাফে)
export function createDetailedMarketStalls(): THREE.Group {
  const market = new THREE.Group();

  // Tong Tea Stall with Bamboo Bench & Tin Awning
  const stall = new THREE.Group();
  stall.position.set(0, 0, 0);

  // Packed Shelves backdrop
  const shelvesTex = createShopShelvesTexture();
  const shelvesMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.8),
    new THREE.MeshStandardMaterial({ map: shelvesTex, roughness: 0.5 })
  );
  shelvesMesh.position.set(0, 1.1, -0.6);
  stall.add(shelvesMesh);

  // Wood counter
  const counter = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 1.1), sharedMats.wood);
  counter.position.set(0, 0.45, 0);
  stall.add(counter);

  // Corrugated Blue Tin Awning
  const tinMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.5, metalness: 0.6 });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 1.8), tinMat);
  roof.rotation.x = 0.25;
  roof.position.set(0, 2.2, 0.3);
  stall.add(roof);

  // Wooden Bamboo Bench (টং বেঞ্চ)
  const bench = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.42, 0.4), sharedMats.wood);
  bench.position.set(0, 0.21, 1.2);
  stall.add(bench);

  // Aluminum Tea Kettle (চা তৈরির কেটলি)
  const kettle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.28, 8), sharedMats.silverRim);
  kettle.position.set(-0.6, 1.05, 0);
  stall.add(kettle);

  // Crates with Fish & Veggies
  const fishTex = createVegFishBoxTexture('FISH');
  const fishCrate = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.35, 0.5),
    new THREE.MeshStandardMaterial({ map: fishTex, roughness: 0.6 })
  );
  fishCrate.position.set(0.6, 1.05, 0);
  stall.add(fishCrate);

  market.add(stall);
  return market;
}

// 13. 3D Mission Waypoint Beam & Pulsing Beacon Pillar (মিশন লোকেশন মার্কার ও আলোর স্তম্ভ)
export function createMissionWaypointMarker(type: string): {
  group: THREE.Group;
  lightPillar: THREE.Mesh;
  groundRing: THREE.Mesh;
  iconMesh: THREE.Mesh;
} {
  const group = new THREE.Group();
  group.name = 'Mission_Waypoint_Marker';

  // Tall Vertical Translucent Light Beam (Pillar of Light)
  const pillarGeo = new THREE.CylinderGeometry(0.45, 0.45, 36, 12, 1, true);
  const pillarMat = new THREE.MeshBasicMaterial({
    color: 0xfacc15,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const lightPillar = new THREE.Mesh(pillarGeo, pillarMat);
  lightPillar.position.y = 18;
  group.add(lightPillar);

  // Holographic Ground Target Ring
  const ringGeo = new THREE.RingGeometry(1.2, 1.8, 24);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xfacc15,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
  });
  const groundRing = new THREE.Mesh(ringGeo, ringMat);
  groundRing.position.y = 0.05;
  group.add(groundRing);

  // Floating 3D Target Badge
  const iconCanvas = document.createElement('canvas');
  iconCanvas.width = 128;
  iconCanvas.height = 128;
  const iCtx = iconCanvas.getContext('2d')!;
  iCtx.fillStyle = '#facc15';
  iCtx.beginPath();
  iCtx.arc(64, 64, 56, 0, Math.PI * 2);
  iCtx.fill();
  iCtx.strokeStyle = '#0f172a';
  iCtx.lineWidth = 6;
  iCtx.stroke();

  let symbol = '🎯';
  if (type === 'STEAL_SWEET') symbol = '🍬';
  else if (type === 'STEAL_TEA') symbol = '🍵';
  else if (type === 'STEAL_FISH') symbol = '🐟';
  else if (type === 'DRIVE_CNG') symbol = '🛺';
  else if (type === 'ESCAPE_POLICE') symbol = '🚩';

  iCtx.font = '54px sans-serif';
  iCtx.textAlign = 'center';
  iCtx.textBaseline = 'middle';
  iCtx.fillText(symbol, 64, 68);

  const iconTex = new THREE.CanvasTexture(iconCanvas);
  const iconMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 1.4),
    new THREE.MeshBasicMaterial({ map: iconTex, transparent: true, side: THREE.DoubleSide })
  );
  iconMesh.position.y = 2.4;
  group.add(iconMesh);

  return { group, lightPillar, groundRing, iconMesh };
}
