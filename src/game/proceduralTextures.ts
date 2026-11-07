import * as THREE from 'three';

/**
 * Procedural High-Fidelity Textures for Amra Chor (Dhaka 3D Open World)
 * All textures generated in code via HTML5 2D Canvas with SRGBColorSpace & anisotropy.
 */

function makeTexture(canvas: HTMLCanvasElement, repeatX = 1, repeatY = 1): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 8;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  return tex;
}

// 1. Detailed Asphalt Road Texture (Cracks, Weathering, Markings)
export function createDetailedRoadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Dark asphalt base
  ctx.fillStyle = '#222428';
  ctx.fillRect(0, 0, 1024, 1024);

  // Surface grit and tarmac grain
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 28;
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));
  }
  ctx.putImageData(imgData, 0, 0);

  // Weathered oil stains & tire tracks
  ctx.fillStyle = 'rgba(15, 15, 18, 0.45)';
  for (let i = 0; i < 8; i++) {
    const x = 160 + i * 90 + Math.random() * 40;
    ctx.fillRect(x, 0, 35, 1024);
  }

  // Asphalt cracks
  ctx.strokeStyle = 'rgba(10, 10, 12, 0.6)';
  ctx.lineWidth = 2;
  for (let c = 0; c < 5; c++) {
    ctx.beginPath();
    let cx = Math.random() * 1024;
    let cy = Math.random() * 1024;
    ctx.moveTo(cx, cy);
    for (let s = 0; s < 6; s++) {
      cx += (Math.random() - 0.5) * 60;
      cy += (Math.random() - 0.5) * 60;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  // Double Yellow Center Divider Lines (Weathered)
  ctx.fillStyle = '#eab308';
  for (let y = 0; y < 1024; y += 4) {
    if (Math.random() > 0.08) {
      ctx.fillRect(502, y, 7, 4);
      ctx.fillRect(515, y, 7, 4);
    }
  }

  // White Outer Road Boundary Markings
  ctx.fillStyle = '#f1f5f9';
  for (let y = 0; y < 1024; y += 4) {
    if (Math.random() > 0.06) {
      ctx.fillRect(60, y, 10, 4);
      ctx.fillRect(954, y, 10, 4);
    }
  }

  // Manhole Cover
  ctx.fillStyle = '#1e2024';
  ctx.beginPath();
  ctx.arc(380, 512, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 4;
  ctx.stroke();

  return makeTexture(canvas, 1, 8);
}

// 2. Interlocking Footpath Pavement Tiles (ফুটপাতের পেভমেন্ট ও ড্রেন)
export function createFootpathTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Concrete reddish/grey paving tile base
  ctx.fillStyle = '#9ca3af';
  ctx.fillRect(0, 0, 512, 512);

  // Diamond / Hex interlocking paving stones
  const tileSize = 64;
  for (let x = 0; x < 512; x += tileSize) {
    for (let y = 0; y < 512; y += tileSize) {
      const isAlt = ((x + y) / tileSize) % 2 === 0;
      ctx.fillStyle = isAlt ? '#cbd5e1' : '#b91c1c25';
      ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
    }
  }

  // Drain grating on one edge
  ctx.fillStyle = '#1e293b';
  for (let y = 8; y < 512; y += 24) {
    ctx.fillRect(490, y, 16, 10);
  }

  return makeTexture(canvas, 4, 16);
}

// 3. High Quality Bengali Shop Signboards
export function createRichShopBanner(
  titleBn: string,
  subBn: string,
  phoneBn: string,
  bgPrimary: string,
  bgSecondary: string,
  badgeIcon: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, 1024, 0);
  grad.addColorStop(0, bgPrimary);
  grad.addColorStop(0.5, bgSecondary);
  grad.addColorStop(1, bgPrimary);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 256);

  // Ornate traditional frame border
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 1004, 236);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, 984, 216);

  // Badge / Icon Circle at left
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(100, 128, 65, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.font = '54px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeIcon, 100, 132);

  // Main Bengali Title with 3D drop shadow
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 72px "Hind Siliguri", "Arial", sans-serif';
  ctx.fillText(titleBn, 196, 104);

  ctx.fillStyle = '#ffffff';
  ctx.fillText(titleBn, 192, 100);

  // Subtitle
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 36px "Hind Siliguri", "Arial", sans-serif';
  ctx.fillText(subBn, 195, 175);

  // Contact / Address pill at right
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.roundRect?.(760, 160, 230, 48, 12) ?? ctx.fillRect(760, 160, 230, 48);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '22px "Hind Siliguri", monospace';
  ctx.fillText(phoneBn, 775, 192);

  return makeTexture(canvas);
}

// 4. Multi-Storey Building Wall Textures (Brick + Weathered Stucco + Windows)
export function createBuildingFacadeTexture(
  wallBaseColor: string,
  accentColor: string,
  brickMode = false
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = wallBaseColor;
  ctx.fillRect(0, 0, 512, 1024);

  // Brick pattern or stucco noise
  if (brickMode) {
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 2;
    for (let y = 0; y < 1024; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
      const offset = (y / 24) % 2 === 0 ? 0 : 25;
      for (let x = offset; x < 512; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 24);
        ctx.stroke();
      }
    }
  } else {
    // Weathered water streaks down building
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * 512;
      const w = 4 + Math.random() * 12;
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(x, Math.random() * 300, w, 400 + Math.random() * 400);
    }
  }

  // Horizontal floor molding trims
  ctx.fillStyle = accentColor;
  for (let f = 1; f <= 4; f++) {
    const y = f * 240;
    ctx.fillRect(0, y, 512, 16);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, y + 16, 512, 6);
    ctx.fillStyle = accentColor;
  }

  // Windows with tinted glass, frames, and interior curtains
  for (let floor = 0; floor < 4; floor++) {
    const fy = floor * 240 + 45;
    for (let wx = 60; wx < 460; wx += 150) {
      // Concrete window border
      ctx.fillStyle = accentColor;
      ctx.fillRect(wx - 6, fy - 6, 92, 132);

      // Glass pane
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(wx, fy, 80, 120);

      // Window reflection gradient
      const rGrad = ctx.createLinearGradient(wx, fy, wx + 80, fy + 120);
      rGrad.addColorStop(0, 'rgba(56, 189, 248, 0.5)');
      rGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.8)');
      rGrad.addColorStop(1, 'rgba(30, 41, 59, 0.9)');
      ctx.fillStyle = rGrad;
      ctx.fillRect(wx, fy, 80, 120);

      // Curtains
      ctx.fillStyle = (floor + wx) % 2 === 0 ? 'rgba(234, 179, 8, 0.7)' : 'rgba(239, 68, 68, 0.7)';
      ctx.fillRect(wx + 2, fy + 2, 24, 70);
      ctx.fillRect(wx + 54, fy + 2, 24, 70);

      // Window cross grille (grill)
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.strokeRect(wx, fy, 80, 120);
      ctx.beginPath();
      ctx.moveTo(wx + 40, fy);
      ctx.lineTo(wx + 40, fy + 120);
      ctx.moveTo(wx, fy + 60);
      ctx.lineTo(wx + 80, fy + 60);
      ctx.stroke();

      // Air Conditioner under some windows
      if ((floor + wx) % 3 === 0) {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(wx + 8, fy + 126, 64, 40);
        ctx.strokeStyle = '#94a3b8';
        ctx.strokeRect(wx + 8, fy + 126, 64, 40);
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(wx + 28, fy + 146, 12, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  return makeTexture(canvas);
}

// 5. Authentic Dhaka Bus Side Texture ("ঢাকা মেট্রো বাস")
export function createBusSideTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Classic red-and-green body
  ctx.fillStyle = '#15803d'; // Green lower half
  ctx.fillRect(0, 0, 1024, 256);

  ctx.fillStyle = '#b91c1c'; // Red top half
  ctx.fillRect(0, 0, 1024, 120);

  // Yellow separation stripe
  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 115, 1024, 16);

  // Row of tinted bus passenger windows
  ctx.fillStyle = '#0f172a';
  for (let x = 60; x < 960; x += 110) {
    ctx.fillRect(x, 24, 90, 75);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, 24, 90, 75);

    // Passenger silhouettes
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(x + 45, 60, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
  }

  // Route banner in Bengali
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 36px "Hind Siliguri", sans-serif';
  ctx.fillText('ঢাকা মেট্রো — মিরপুর ১০ ➔ ফার্মগেট ➔ গুলিস্তান', 512, 185);

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 22px "Hind Siliguri", sans-serif';
  ctx.fillText('সিটিং সার্ভিস • ভলভো সুপার ডিলাক্স', 512, 225);

  return makeTexture(canvas);
}

// 6. Detailed Traditional Bengali Rickshaw Art
export function createRichRickshawArt(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Bright canary yellow background
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 0, 512, 512);

  // Double ornate floral borders
  ctx.lineWidth = 16;
  ctx.strokeStyle = '#dc2626';
  ctx.strokeRect(10, 10, 492, 492);
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#15803d';
  ctx.strokeRect(26, 26, 460, 460);

  // Ornate central sunburst medallion
  ctx.beginPath();
  ctx.arc(256, 230, 170, 0, Math.PI * 2);
  ctx.fillStyle = '#1e3a8a';
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#fef08a';
  ctx.stroke();

  // Majestic Bangladeshi Peacock (ময়ূর)
  // Body
  ctx.fillStyle = '#065f46';
  ctx.beginPath();
  ctx.ellipse(256, 250, 70, 45, 0, 0, Math.PI * 2);
  ctx.fill();

  // Long graceful neck
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.moveTo(215, 240);
  ctx.quadraticCurveTo(200, 170, 230, 150);
  ctx.quadraticCurveTo(245, 175, 235, 240);
  ctx.fill();

  // Head and crown feathers
  ctx.beginPath();
  ctx.arc(230, 145, 22, 0, Math.PI * 2);
  ctx.fill();

  // Crown crest
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 4;
  for (let a = -0.4; a <= 0.4; a += 0.2) {
    ctx.beginPath();
    ctx.moveTo(230, 130);
    ctx.lineTo(230 + a * 40, 100);
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(230 + a * 40, 96, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Beak and eye
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(212, 144);
  ctx.lineTo(185, 152);
  ctx.lineTo(212, 158);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(224, 142, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(222, 142, 3, 0, Math.PI * 2);
  ctx.fill();

  // Colorful Peacock Fan Feathers
  const featherColors = ['#dc2626', '#eab308', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];
  for (let i = 0; i < 11; i++) {
    const angle = -1.2 + (i * 2.4) / 10;
    ctx.save();
    ctx.translate(285, 240);
    ctx.rotate(angle);
    ctx.fillStyle = featherColors[i % featherColors.length];
    ctx.beginPath();
    ctx.ellipse(85, 0, 55, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(115, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.arc(115, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Classic Bengali Rickshaw Bottom Banner
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(35, 415, 442, 70);
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 4;
  ctx.strokeRect(35, 415, 442, 70);

  ctx.fillStyle = '#fef08a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 38px "Hind Siliguri", sans-serif';
  ctx.fillText('ঢাকা মেট্রো — রিকশা', 256, 450);

  return makeTexture(canvas);
}

// 7. Human Face Texture for Stylized Character Heads (Eyes, Eyebrows, Lips)
export function createHumanFaceTexture(skinHex: string, hasMoustache = false, isOld = false): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Skin tone base
  ctx.fillStyle = skinHex;
  ctx.fillRect(0, 0, 512, 512);

  // Soft facial shading
  const grad = ctx.createRadialGradient(256, 256, 60, 256, 256, 240);
  grad.addColorStop(0, 'rgba(255,255,255,0.08)');
  grad.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Eyebrows
  ctx.fillStyle = isOld ? '#64748b' : '#1c1917';
  ctx.beginPath();
  ctx.ellipse(190, 185, 45, 10, -0.15, 0, Math.PI * 2);
  ctx.ellipse(322, 185, 45, 10, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Eyes with pupils
  const drawEye = (x: number, y: number) => {
    // Sclera
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x, y, 28, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Iris (Deep brown)
    ctx.fillStyle = '#3f1c04';
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Specular highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - 3, y - 3, 3.5, 0, Math.PI * 2);
    ctx.fill();
  };

  drawEye(190, 220);
  drawEye(322, 220);

  // Nose shading
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.moveTo(256, 220);
  ctx.lineTo(245, 290);
  ctx.lineTo(267, 290);
  ctx.closePath();
  ctx.fill();

  // Nostrils
  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.arc(244, 292, 4, 0, Math.PI * 2);
  ctx.arc(268, 292, 4, 0, Math.PI * 2);
  ctx.fill();

  // Moustache
  if (hasMoustache) {
    ctx.fillStyle = isOld ? '#94a3b8' : '#1c1917';
    ctx.beginPath();
    ctx.ellipse(256, 325, 65, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Lips
  ctx.fillStyle = '#9f4f4f';
  ctx.beginPath();
  ctx.ellipse(256, hasMoustache ? 355 : 345, 40, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  return makeTexture(canvas);
}

// 8. Raw Market Vegetable & Fish Box Textures
export function createVegFishBoxTexture(type: 'FISH' | 'VEG' | 'FRUIT'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#78350f'; // Wood box base
  ctx.fillRect(0, 0, 256, 256);

  if (type === 'FISH') {
    // Crushed ice base
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(10, 10, 236, 236);

    // Silver Hilsa Fish pattern
    for (let i = 0; i < 6; i++) {
      const y = 30 + i * 36;
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.ellipse(128, y, 75, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(132, y - 3, 65, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'VEG') {
    ctx.fillStyle = '#14532d'; // Dark green basket
    ctx.fillRect(10, 10, 236, 236);
    // Red tomatoes and purple brinjals
    for (let x = 30; x < 230; x += 45) {
      for (let y = 30; y < 230; y += 45) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#dc2626' : '#581c87';
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    // Yellow bananas & mangoes
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(10, 10, 236, 236);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(40 + (i % 4) * 55, 60 + Math.floor(i / 4) * 80, 24, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return makeTexture(canvas);
}
