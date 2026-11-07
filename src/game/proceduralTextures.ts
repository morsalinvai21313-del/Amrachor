import * as THREE from 'three';

/**
 * Amra Chor - High-Fidelity Cached Procedural Textures
 * Instant generation without blocking CPU loops.
 * All textures set to SRGBColorSpace with mipmaps and max anisotropy.
 */

const textureCache = new Map<string, THREE.CanvasTexture>();

function makeTexture(
  cacheKey: string,
  canvas: HTMLCanvasElement,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }

  textureCache.set(cacheKey, tex);
  return tex;
}

// 1. Detailed Dhaka Asphalt Road Texture (with Zebra Crossings, Road Markings, Hazard Curbs)
export function createDetailedRoadTexture(): THREE.CanvasTexture {
  const key = 'road_asphalt_dhaka';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Dark asphalt base with subtle tone gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 512, 0);
  bgGrad.addColorStop(0, '#1c1e22');
  bgGrad.addColorStop(0.5, '#262930');
  bgGrad.addColorStop(1, '#1c1e22');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 512, 1024);

  // Road grit and tire tracks
  ctx.fillStyle = 'rgba(10, 12, 15, 0.4)';
  for (let i = 0; i < 14; i++) {
    const x = 40 + i * 32;
    ctx.fillRect(x, 0, 16, 1024);
  }

  // Double Yellow Center Divider Line (Bengali Highway Standard)
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(250, 0, 5, 1024);
  ctx.fillRect(257, 0, 5, 1024);

  // White Outer Lane Boundary Lines
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(35, 0, 8, 1024);
  ctx.fillRect(469, 0, 8, 1024);

  // Dashed lane lines
  ctx.fillStyle = '#cbd5e1';
  for (let y = 30; y < 1024; y += 90) {
    ctx.fillRect(142, y, 6, 45);
    ctx.fillRect(364, y, 6, 45);
  }

  // Pedestrian Zebra Crossings (জেব্রা ক্রসিং)
  ctx.fillStyle = '#ffffff';
  for (let x = 45; x < 465; x += 36) {
    ctx.fillRect(x, 120, 24, 75);
    ctx.fillRect(x, 820, 24, 75);
  }

  // Stop lines before zebra crossings
  ctx.fillRect(40, 95, 432, 12);
  ctx.fillRect(40, 795, 432, 12);

  // Directional Lane Arrows
  const drawArrow = (ax: number, ay: number) => {
    ctx.beginPath();
    ctx.moveTo(ax, ay - 24);
    ctx.lineTo(ax - 12, ay);
    ctx.lineTo(ax - 5, ay);
    ctx.lineTo(ax - 5, ay + 24);
    ctx.lineTo(ax + 5, ay + 24);
    ctx.lineTo(ax + 5, ay);
    ctx.lineTo(ax + 12, ay);
    ctx.closePath();
    ctx.fill();
  };
  drawArrow(145, 340);
  drawArrow(367, 680);

  // Cast Iron Sewer / Manhole Cover
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(200, 512, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3;
  ctx.stroke();

  return makeTexture(key, canvas, 1, 8);
}

// 2. Interlocking Footpath Pavement & Drainage
export function createFootpathTexture(): THREE.CanvasTexture {
  const key = 'footpath_tiles';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#a1a1aa';
  ctx.fillRect(0, 0, 256, 256);

  const tileSize = 32;
  for (let x = 0; x < 256; x += tileSize) {
    for (let y = 0; y < 256; y += tileSize) {
      const isAlt = ((x + y) / tileSize) % 2 === 0;
      ctx.fillStyle = isAlt ? '#d4d4d8' : '#e4e4e7';
      ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
      ctx.strokeStyle = '#71717a';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, tileSize, tileSize);
    }
  }

  // Curb edge with yellow/black hazard striping
  for (let y = 0; y < 256; y += 32) {
    ctx.fillStyle = (y / 32) % 2 === 0 ? '#facc15' : '#0f172a';
    ctx.fillRect(0, y, 14, 32);
  }

  return makeTexture(key, canvas, 4, 16);
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
  const key = `banner_${titleBn}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, bgPrimary);
  grad.addColorStop(0.5, bgSecondary);
  grad.addColorStop(1, bgPrimary);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 128);

  // Border frame
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 504, 120);

  // Icon Circle
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(52, 64, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.font = '28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeIcon, 52, 66);

  // Title
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 36px "Hind Siliguri", sans-serif';
  ctx.fillText(titleBn, 102, 52);

  ctx.fillStyle = '#ffffff';
  ctx.fillText(titleBn, 100, 50);

  // Subtitle
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 18px "Hind Siliguri", sans-serif';
  ctx.fillText(subBn, 102, 88);

  // Phone Pill
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(370, 84, 130, 26);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(phoneBn, 376, 101);

  return makeTexture(key, canvas);
}

// 4. Multi-Storey Building Wall & Window Facade Texture
export function createBuildingFacadeTexture(
  wallBaseColor: string,
  accentColor: string,
  brickMode = false
): THREE.CanvasTexture {
  const key = `facade_${wallBaseColor}_${accentColor}_${brickMode}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = wallBaseColor;
  ctx.fillRect(0, 0, 256, 512);

  // Brick lines
  if (brickMode) {
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    for (let y = 0; y < 512; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
      const offset = (y / 16) % 2 === 0 ? 0 : 16;
      for (let x = offset; x < 256; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 16);
        ctx.stroke();
      }
    }
  }

  // Multi-Storey Glass Windows with Frames & Balconies
  for (let floor = 1; floor <= 4; floor++) {
    const fy = floor * 110 - 20;

    // Floor ledge trim
    ctx.fillStyle = accentColor;
    ctx.fillRect(0, fy + 75, 256, 8);

    // 3 Windows per floor
    for (let w = 0; w < 3; w++) {
      const wx = 22 + w * 78;
      const wy = fy;

      // Window Concrete Frame
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(wx - 2, wy - 2, 54, 70);

      // Glass tint with sky reflection
      const glassGrad = ctx.createLinearGradient(wx, wy, wx + 50, wy + 66);
      glassGrad.addColorStop(0, '#0284c7');
      glassGrad.addColorStop(0.5, '#38bdf8');
      glassGrad.addColorStop(1, '#0369a1');
      ctx.fillStyle = glassGrad;
      ctx.fillRect(wx, wy, 50, 66);

      // Window cross dividers
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(wx + 23, wy, 4, 66);
      ctx.fillRect(wx, wy + 31, 50, 4);

      // AC Outdoor Unit under some windows
      if ((floor + w) % 2 === 0) {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(wx + 4, wy + 72, 38, 22);
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(wx + 23, wy + 83, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  return makeTexture(key, canvas, 1, 1);
}

// 5. Authentic Dhaka Bus Livery Texture ("মুড়ির টিন" / লোকাল বাস)
export function createBusSideTexture(): THREE.CanvasTexture {
  const key = 'bus_livery_dhaka';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Green & Yellow Dhaka Bus dual tone
  ctx.fillStyle = '#15803d';
  ctx.fillRect(0, 0, 512, 128);

  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 50, 512, 30);

  // Red accent stripe
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(0, 80, 512, 8);

  // Bengali Typography & Dhaka Metro Route
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px "Hind Siliguri", sans-serif';
  ctx.fillText('ঢাকা পরিবহন • সিটিং সার্ভিস', 30, 40);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px "Hind Siliguri", sans-serif';
  ctx.fillText('গুলিস্তান — ফার্মগেট — মিরপুর — সাভার', 40, 72);

  // Registration Plate
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(400, 95, 100, 24);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('ঢাকা মেট্রো-ব ১১-২১২১', 404, 112);

  return makeTexture(key, canvas);
}

// 6. Traditional Colorful Rickshaw Art (রিকশা আর্ট)
export function createRichRickshawArt(): THREE.CanvasTexture {
  const key = 'rickshaw_art_traditional';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Ornate red background
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 0, 256, 256);

  // Gold floral border
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 244, 244);

  // Decorative peacock & floral motifs (stylized)
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(128, 128, 70, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(128, 128, 55, 0, Math.PI * 2);
  ctx.fill();

  // Peacock blue body
  ctx.fillStyle = '#0369a1';
  ctx.beginPath();
  ctx.arc(128, 128, 38, 0, Math.PI * 2);
  ctx.fill();

  // Bengali Art script
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('মায়ের দোয়া', 128, 60);
  ctx.fillText('রিকশা আর্ট', 128, 205);

  return makeTexture(key, canvas);
}

// 7. Green CNG Auto-Rickshaw Registration Plate & Markings
export function createCNGDetailsTexture(): THREE.CanvasTexture {
  const key = 'cng_plate_markings';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#15803d';
  ctx.fillRect(0, 0, 256, 128);

  // License plate (Dhaka Metro TH)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(20, 20, 160, 48);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, 160, 48);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px "Hind Siliguri", monospace';
  ctx.fillText('ঢাকা মেট্রো-থ', 35, 42);
  ctx.font = 'bold 18px monospace';
  ctx.fillText('১১-৪২০২', 48, 62);

  // Safety Warning
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 13px "Hind Siliguri", sans-serif';
  ctx.fillText('ধূমপান স্বাস্থ্যের জন্য ক্ষতিকর', 20, 95);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px "Hind Siliguri", sans-serif';
  ctx.fillText('ভাড়া মিটারে চলুন • ৪ জন যাত্রী', 20, 115);

  return makeTexture(key, canvas);
}

// 8. Bangladesh Police Livery & Badge Texture
export function createPoliceLiveryTexture(): THREE.CanvasTexture {
  const key = 'police_car_livery';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Silver / White patrol base
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 128);

  // Deep Navy Police Band
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(0, 40, 512, 48);

  // Yellow reflector stripe
  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 88, 512, 6);

  // Police Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'black 32px "Hind Siliguri", sans-serif';
  ctx.fillText('বাংলাদেশ পুলিশ', 30, 75);

  ctx.font = '900 24px sans-serif';
  ctx.fillText('POLICE • 999', 310, 75);

  // Dhaka Metro Registration
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(400, 98, 100, 24);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('ঢাকা মেট্রো-প ৯৯', 405, 115);

  return makeTexture(key, canvas);
}

// 9. Detailed Stylized Human Face Texture
export function createHumanFaceTexture(
  skinHex: string,
  hasMustache = false,
  isPolice = false
): THREE.CanvasTexture {
  const key = `face_${skinHex}_${hasMustache}_${isPolice}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Smooth warm skin base with subtle lighting gradient
  const skinGrad = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
  skinGrad.addColorStop(0, '#e59a72');
  skinGrad.addColorStop(1, skinHex);
  ctx.fillStyle = skinGrad;
  ctx.fillRect(0, 0, 256, 256);

  // Natural Eyes with eyelids, dark iris, pupil & white specular highlights
  const drawEye = (x: number) => {
    // Sclera
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x, 92, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iris (Rich dark brown)
    ctx.fillStyle = '#26170d';
    ctx.beginPath();
    ctx.arc(x, 92, 10, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(x, 92, 5, 0, Math.PI * 2);
    ctx.fill();

    // Specular corneal reflection
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - 3, 89, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Upper Eyelash line
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, 88, 19, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    // Eyebrows
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x, 74, 20, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  };

  drawEye(84);
  drawEye(172);

  // Nose Bridge & Nostril shading
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.moveTo(128, 92);
  ctx.lineTo(116, 138);
  ctx.lineTo(140, 138);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.arc(118, 136, 4, 0, Math.PI * 2);
  ctx.arc(138, 136, 4, 0, Math.PI * 2);
  ctx.fill();

  // Expressive Lips
  ctx.fillStyle = '#9f1239';
  ctx.beginPath();
  ctx.ellipse(128, 175, 24, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bengali Mustache (গোঁফ)
  if (hasMustache || isPolice) {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(108, 156, 26, 9, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(148, 156, 26, 9, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  return makeTexture(key, canvas);
}

// 10. Plaid / Checked Trousers Fabric Texture (লুঙ্গি বা প্যান্টের চেক প্যাটার্ন)
export function createPlaidTrousersTexture(): THREE.CanvasTexture {
  const key = 'trousers_plaid_check';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e3a8a'; // Deep Navy
  ctx.fillRect(0, 0, 128, 128);

  // Cyan / Teal checks
  ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
  for (let x = 0; x < 128; x += 16) ctx.fillRect(x, 0, 8, 128);
  for (let y = 0; y < 128; y += 16) ctx.fillRect(0, y, 128, 8);

  // Fine Red accent lines
  ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
  for (let x = 8; x < 128; x += 32) ctx.fillRect(x, 0, 2, 128);
  for (let y = 8; y < 128; y += 32) ctx.fillRect(0, y, 128, 2);

  return makeTexture(key, canvas, 2, 4);
}

// 11. Crisp Black-and-White Striped T-Shirt Texture
export function createTShirtStripesTexture(): THREE.CanvasTexture {
  const key = 'tshirt_stripes_bw';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 128, 128);

  ctx.fillStyle = '#0f172a';
  for (let y = 0; y < 128; y += 32) {
    ctx.fillRect(0, y, 128, 16);
  }

  return makeTexture(key, canvas, 1, 4);
}

// 12. Packed Dhaka Grocery & Tea Stall Shelves Texture (দোকানের আলমারি ও প্যাকেট)
export function createShopShelvesTexture(): THREE.CanvasTexture {
  const key = 'shop_shelves_dhaka';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark wood shelf frame
  ctx.fillStyle = '#451a03';
  ctx.fillRect(0, 0, 512, 512);

  // 4 Shelves packed with colorful Dhaka goods
  for (let s = 0; s < 4; s++) {
    const sy = s * 128;
    // Shelf wood plank
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, sy + 112, 512, 16);

    // Packets of Chanachur, Chips, Biscuits, Tea boxes
    const colors = ['#ef4444', '#facc15', '#10b981', '#3b82f6', '#f97316', '#8b5cf6'];
    for (let i = 0; i < 12; i++) {
      const px = 15 + i * 40;
      const c = colors[(s * 3 + i) % colors.length];
      ctx.fillStyle = c;
      ctx.fillRect(px, sy + 25, 32, 85);

      // Packet label
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 4, sy + 45, 24, 25);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('PRAN', px + 6, sy + 60);
    }
  }

  return makeTexture(key, canvas);
}

// 13. Comic Starburst Hit Spark Texture ("মারামারি চলছে!")
export function createHitEffectTexture(): THREE.CanvasTexture {
  const key = 'comic_hit_starburst';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 128, 128);

  // Outer orange starburst
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  const spikes = 12;
  const rot = (Math.PI / 2) * 3;
  let x = 64;
  let y = 64;
  const step = Math.PI / spikes;

  ctx.moveTo(64, 64 - 58);
  for (let i = 0; i < spikes; i++) {
    x = 64 + Math.cos(rot + i * step * 2) * 58;
    y = 64 + Math.sin(rot + i * step * 2) * 58;
    ctx.lineTo(x, y);
    x = 64 + Math.cos(rot + (i * step * 2 + step)) * 26;
    y = 64 + Math.sin(rot + (i * step * 2 + step)) * 26;
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Inner bright yellow starburst
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(64, 64, 24, 0, Math.PI * 2);
  ctx.fill();

  return makeTexture(key, canvas);
}

// 14. Colorful Vegetable / Fish Crate Texture
export function createVegFishBoxTexture(type: 'FISH' | 'VEG' | 'SWEET'): THREE.CanvasTexture {
  const key = `crate_${type}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  if (type === 'FISH') {
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#e2e8f0';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(32 + i * 22, 64, 28, 8, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'SWEET') {
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(0, 0, 128, 128);
    for (let x = 20; x < 120; x += 30) {
      for (let y = 20; y < 120; y += 30) {
        ctx.fillStyle = (x + y) % 60 === 0 ? '#ffffff' : '#f97316';
        ctx.beginPath();
        ctx.arc(x, y, 11, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#ef4444';
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(20 + (i % 3) * 38, 20 + Math.floor(i / 3) * 38, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return makeTexture(key, canvas);
}
