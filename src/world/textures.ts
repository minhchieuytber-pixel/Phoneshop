import * as THREE from 'three';

export interface ProceduralTextures {
  terrazzoTile: THREE.CanvasTexture;
  terrazzoRoughness: THREE.CanvasTexture;
  brownWall: THREE.CanvasTexture;
  oakWood: THREE.CanvasTexture;
  walnutWood: THREE.CanvasTexture;
  asphalt: THREE.CanvasTexture;
  sidewalkTile: THREE.CanvasTexture;
  storeSign: THREE.CanvasTexture;
  directorScreen: THREE.CanvasTexture;
  imacBack: THREE.CanvasTexture;
  windowsScreen: THREE.CanvasTexture;
  posScreen: THREE.CanvasTexture;
  phoneScreens: THREE.CanvasTexture[];
  boxLabel: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  maxAnisotropy: number;
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  isColor: boolean,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = Math.min(8, maxAnisotropy);
  tex.needsUpdate = true;
  return tex;
}

export function createLabelSignTexture(
  title: string,
  subtitle: string,
  maxAnisotropy: number,
  accentColor = '#38bdf8',
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = accentColor;
  ctx.fillRect(0, 0, 12, 128);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 508, 124);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 34px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 30, subtitle ? 46 : 64);

  if (subtitle) {
    ctx.fillStyle = accentColor;
    ctx.font = '500 22px sans-serif';
    ctx.fillText(subtitle, 30, 88);
  }

  return finalizeTexture(c, true, maxAnisotropy);
}

export function createProceduralTextures(
  maxAnisotropy: number,
  storeName = 'MINH CHIÊU MOBILE',
): ProceduralTextures {
  // 1. Sleek Black Porcelain / Granite Showroom Floor
  const tileC = document.createElement('canvas');
  tileC.width = 512;
  tileC.height = 512;
  const tctx = tileC.getContext('2d')!;
  tctx.fillStyle = '#12161f';
  tctx.fillRect(0, 0, 512, 512);
  const flecks = ['#1e293b', '#334155', '#475569', '#090d16', '#64748b'];
  for (let i = 0; i < 650; i++) {
    tctx.fillStyle = flecks[i % flecks.length];
    const x = (Math.sin(i * 19.3) * 0.5 + 0.5) * 512;
    const y = (Math.cos(i * 41.7) * 0.5 + 0.5) * 512;
    const r = 1 + (i % 2.5);
    tctx.beginPath();
    tctx.arc(x, y, r, 0, Math.PI * 2);
    tctx.fill();
  }
  tctx.strokeStyle = 'rgba(15, 23, 42, 0.9)';
  tctx.lineWidth = 4;
  tctx.strokeRect(2, 2, 252, 252);
  tctx.strokeRect(256, 2, 254, 252);
  tctx.strokeRect(2, 256, 252, 254);
  tctx.strokeRect(256, 256, 254, 254);

  const roughC = document.createElement('canvas');
  roughC.width = 512;
  roughC.height = 512;
  const rctx = roughC.getContext('2d')!;
  rctx.fillStyle = '#383838'; // glossy black stone tile
  rctx.fillRect(0, 0, 512, 512);
  rctx.strokeStyle = '#c8c8c8'; // matte grout
  rctx.lineWidth = 6;
  rctx.strokeRect(0, 0, 256, 256);
  rctx.strokeRect(256, 0, 256, 256);
  rctx.strokeRect(0, 256, 256, 256);
  rctx.strokeRect(256, 256, 256, 256);

  // 1b. Warm Brown Interior Wall Texture
  const brownC = document.createElement('canvas');
  brownC.width = 256;
  brownC.height = 256;
  const brctx = brownC.getContext('2d')!;
  brctx.fillStyle = '#6f4e37';
  brctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    brctx.fillStyle = i % 2 === 0 ? 'rgba(255,235,215,0.035)' : 'rgba(30,15,5,0.05)';
    brctx.fillRect((i * 53) % 256, (i * 97) % 256, 3, 3);
  }
  brctx.strokeStyle = 'rgba(42, 24, 12, 0.25)';
  brctx.lineWidth = 2;
  for (let x = 0; x < 256; x += 64) {
    brctx.beginPath();
    brctx.moveTo(x, 0);
    brctx.lineTo(x, 256);
    brctx.stroke();
  }

  // 2. Oak Wood (Showroom display tables)
  const oakC = document.createElement('canvas');
  oakC.width = 256;
  oakC.height = 256;
  const octx = oakC.getContext('2d')!;
  octx.fillStyle = '#c89f72';
  octx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 3) {
    octx.fillStyle = y % 6 === 0 ? 'rgba(120, 72, 30, 0.14)' : 'rgba(255, 232, 200, 0.1)';
    octx.fillRect(0, y, 256, 2);
  }

  // 3. Walnut Wood (Director office desk)
  const walC = document.createElement('canvas');
  walC.width = 256;
  walC.height = 256;
  const wctx = walC.getContext('2d')!;
  wctx.fillStyle = '#5c3a24';
  wctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 3) {
    wctx.fillStyle = y % 9 === 0 ? 'rgba(28, 14, 6, 0.28)' : 'rgba(130, 88, 52, 0.15)';
    wctx.fillRect(0, y, 256, 2);
  }

  // 4. Asphalt street with lane markings
  const aspC = document.createElement('canvas');
  aspC.width = 512;
  aspC.height = 512;
  const actx = aspC.getContext('2d')!;
  actx.fillStyle = '#2d3138';
  actx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1600; i++) {
    actx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)';
    actx.fillRect((i * 73) % 512, (i * 137) % 512, 2, 2);
  }
  actx.fillStyle = '#eab308';
  actx.fillRect(248, 20, 16, 180);
  actx.fillRect(248, 280, 16, 180);

  // 5. Vietnamese Con Sau Sidewalk Tiles
  const swC = document.createElement('canvas');
  swC.width = 256;
  swC.height = 256;
  const swctx = swC.getContext('2d')!;
  swctx.fillStyle = '#9ca3af';
  swctx.fillRect(0, 0, 256, 256);
  swctx.strokeStyle = 'rgba(55,65,81,0.35)';
  swctx.lineWidth = 3;
  for (let x = 0; x < 256; x += 64) {
    for (let y = 0; y < 256; y += 64) {
      swctx.fillStyle = (x + y) % 128 === 0 ? '#a1a1aa' : '#94a3b8';
      swctx.fillRect(x + 2, y + 2, 60, 60);
      swctx.strokeRect(x, y, 64, 64);
    }
  }

  // 6. Storefront Illuminated Sign
  const signC = document.createElement('canvas');
  signC.width = 1024;
  signC.height = 256;
  const sctx = signC.getContext('2d')!;
  const grad = sctx.createLinearGradient(0, 0, 1024, 256);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#1e293b');
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 1024, 256);
  sctx.strokeStyle = '#38bdf8';
  sctx.lineWidth = 6;
  sctx.strokeRect(10, 10, 1004, 236);
  sctx.fillStyle = '#f8fafc';
  sctx.font = 'bold 72px sans-serif';
  sctx.textAlign = 'center';
  sctx.textBaseline = 'middle';
  sctx.fillText(storeName.toUpperCase(), 512, 106);
  sctx.fillStyle = '#38bdf8';
  sctx.font = '600 30px sans-serif';
  sctx.fillText('SMARTPHONE · SERVICE · ACCESSORIES', 512, 178);

  // Helper: Draw clean bitten Apple logo via Bezier curves (zero font/glyph dependency)
  const drawAppleLogo = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    scale: number,
    fillStyle: string | CanvasGradient,
  ) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.fillStyle = fillStyle;

    // Apple body with classic right-side bite
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.bezierCurveTo(-12, -22, -26, -18, -28, -2);
    ctx.bezierCurveTo(-30, 14, -18, 30, -8, 30);
    ctx.bezierCurveTo(-3, 30, -1, 27, 2, 27);
    ctx.bezierCurveTo(5, 27, 8, 30, 13, 30);
    ctx.bezierCurveTo(21, 30, 27, 20, 29, 12);
    ctx.bezierCurveTo(18, 8, 17, -7, 27, -12);
    ctx.bezierCurveTo(22, -19, 13, -21, 7, -19);
    ctx.bezierCurveTo(4, -18, 2, -18, 0, -18);
    ctx.closePath();
    ctx.fill();

    // Top-right tilted leaf
    ctx.beginPath();
    ctx.moveTo(2, -22);
    ctx.bezierCurveTo(2, -31, 10, -37, 17, -37);
    ctx.bezierCurveTo(18, -29, 11, -22, 2, -22);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  // 7. Director iMac macOS Screen (Prominent centered Apple logo before clicking)
  const pcC = document.createElement('canvas');
  pcC.width = 512;
  pcC.height = 320;
  const pctx = pcC.getContext('2d')!;
  const macBg = pctx.createLinearGradient(0, 0, 512, 320);
  macBg.addColorStop(0, '#090d16');
  macBg.addColorStop(0.5, '#172554');
  macBg.addColorStop(1, '#0f172a');
  pctx.fillStyle = macBg;
  pctx.fillRect(0, 0, 512, 320);

  // Subtle glow behind Apple logo
  const appleGlow = pctx.createRadialGradient(256, 146, 8, 256, 146, 115);
  appleGlow.addColorStop(0, 'rgba(56, 189, 248, 0.34)');
  appleGlow.addColorStop(0.55, 'rgba(99, 102, 241, 0.12)');
  appleGlow.addColorStop(1, 'rgba(15, 23, 42, 0)');
  pctx.fillStyle = appleGlow;
  pctx.fillRect(0, 0, 512, 320);

  // macOS top menu bar
  pctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  pctx.fillRect(0, 0, 512, 22);
  drawAppleLogo(pctx, 18, 11, 0.22, '#f8fafc');
  pctx.fillStyle = '#e2e8f0';
  pctx.font = 'bold 11px sans-serif';
  pctx.fillText('Minh Chiêu macOS   Finder   ERP   Cửa sổ', 34, 15);
  pctx.fillStyle = '#94a3b8';
  pctx.font = '10px monospace';
  pctx.fillText('iMac Pro', 450, 15);

  // Prominent Apple Logo centered on iMac display
  const logoGrad = pctx.createLinearGradient(256, 82, 256, 204);
  logoGrad.addColorStop(0, '#ffffff');
  logoGrad.addColorStop(1, '#cbd5e1');
  drawAppleLogo(pctx, 256, 146, 1.65, logoGrad);

  pctx.fillStyle = '#e2e8f0';
  pctx.font = '600 14px sans-serif';
  pctx.textAlign = 'center';
  pctx.fillText('MINH CHIÊU MOBILE · iMac Giám Đốc', 256, 228);
  pctx.fillStyle = '#38bdf8';
  pctx.font = '500 11px sans-serif';
  pctx.fillText('Nhấn E để mở hệ thống điều hành macOS', 256, 248);
  pctx.textAlign = 'left';

  // macOS bottom floating dock
  pctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  pctx.fillRect(124, 276, 264, 30);
  ['#38bdf8', '#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#f43f5e', '#14b8a6'].forEach((dc, idx) => {
    pctx.fillStyle = dc;
    pctx.fillRect(138 + idx * 35, 282, 18, 18);
  });

  // 7a. iMac Silver Aluminum Back Shell Texture with glossy Apple logo
  const imacBackC = document.createElement('canvas');
  imacBackC.width = 512;
  imacBackC.height = 320;
  const ib = imacBackC.getContext('2d')!;
  const aluGrad = ib.createLinearGradient(0, 0, 512, 320);
  aluGrad.addColorStop(0, '#e2e8f0');
  aluGrad.addColorStop(0.5, '#cbd5e1');
  aluGrad.addColorStop(1, '#94a3b8');
  ib.fillStyle = aluGrad;
  ib.fillRect(0, 0, 512, 320);
  drawAppleLogo(ib, 256, 152, 1.45, '#1e293b');
  ib.fillStyle = '#475569';
  ib.font = '600 12px sans-serif';
  ib.textAlign = 'center';
  ib.fillText('iMac', 256, 232);
  ib.textAlign = 'left';

  // 7b. Employee Windows 11 PC Screen
  const winC = document.createElement('canvas');
  winC.width = 512;
  winC.height = 320;
  const wn = winC.getContext('2d')!;
  const winBg = wn.createLinearGradient(0, 0, 512, 320);
  winBg.addColorStop(0, '#072448');
  winBg.addColorStop(0.5, '#0c4a8a');
  winBg.addColorStop(1, '#1d4ed8');
  wn.fillStyle = winBg;
  wn.fillRect(0, 0, 512, 320);
  // Subtle Windows 11 Bloom Curve
  wn.fillStyle = 'rgba(56, 189, 248, 0.25)';
  wn.beginPath();
  wn.arc(256, 145, 95, 0, Math.PI * 2);
  wn.fill();
  // Active Windows 11 App Window
  wn.fillStyle = '#f8fafc';
  wn.fillRect(34, 24, 444, 240);
  wn.fillStyle = '#e2e8f0';
  wn.fillRect(34, 24, 444, 28);
  wn.fillStyle = '#0f172a';
  wn.font = 'bold 13px sans-serif';
  wn.fillText('Windows 11 · Minh Chiêu CRM & Kho', 46, 42);
  // Top-right Windows Min / Max / Close controls
  wn.fillStyle = '#475569';
  wn.font = '13px monospace';
  wn.fillText('—   □   ✕', 404, 42);
  // Content panels
  wn.fillStyle = '#eff6ff';
  wn.fillRect(46, 62, 132, 188);
  wn.fillStyle = '#ffffff';
  wn.strokeStyle = '#cbd5e1';
  wn.strokeRect(190, 62, 274, 188);
  wn.fillRect(190, 62, 274, 188);
  wn.fillStyle = '#2563eb';
  wn.fillRect(58, 76, 108, 22);
  wn.fillStyle = '#ffffff';
  wn.font = 'bold 11px sans-serif';
  wn.fillText('TRẠNG THÁI ĐƠN', 66, 91);
  for (let row = 0; row < 4; row++) {
    wn.fillStyle = row % 2 === 0 ? '#f1f5f9' : '#e2e8f0';
    wn.fillRect(204, 78 + row * 40, 246, 28);
    wn.fillStyle = '#0284c7';
    wn.fillRect(204, 78 + row * 40, 6, 28);
  }
  // Windows 11 Bottom Taskbar (full width, centered Start logo)
  wn.fillStyle = 'rgba(15, 23, 42, 0.92)';
  wn.fillRect(0, 286, 512, 34);
  // 4-pane Windows Start Icon
  wn.fillStyle = '#38bdf8';
  wn.fillRect(210, 295, 7, 7);
  wn.fillRect(219, 295, 7, 7);
  wn.fillRect(210, 304, 7, 7);
  wn.fillRect(219, 304, 7, 7);
  // Pinned Windows taskbar icons
  ['#60a5fa', '#34d399', '#fbbf24', '#818cf8'].forEach((c, i) => {
    wn.fillStyle = c;
    wn.fillRect(240 + i * 24, 295, 14, 14);
  });
  wn.fillStyle = '#cbd5e1';
  wn.font = '10px monospace';
  wn.fillText('VI  09:41', 446, 307);

  // 8. Windows POS Screen
  const posC = document.createElement('canvas');
  posC.width = 256;
  posC.height = 192;
  const posctx = posC.getContext('2d')!;
  posctx.fillStyle = '#0f172a';
  posctx.fillRect(0, 0, 256, 192);
  posctx.fillStyle = '#0284c7';
  posctx.fillRect(0, 0, 256, 28);
  posctx.fillStyle = '#ffffff';
  posctx.font = 'bold 12px sans-serif';
  posctx.fillText('POS THU NGÂN · WIN 11', 10, 18);
  posctx.fillStyle = '#e2e8f0';
  posctx.font = '11px monospace';
  posctx.fillText('— □ ✕', 214, 18);
  posctx.fillStyle = '#1e293b';
  posctx.fillRect(12, 38, 232, 118);
  posctx.fillStyle = '#94a3b8';
  posctx.font = '11px monospace';
  posctx.fillText('MINH CHIÊU MOBILE', 22, 62);
  posctx.fillStyle = '#34d399';
  posctx.font = 'bold 14px monospace';
  posctx.fillText('SẴN SÀNG THANH TOÁN', 22, 96);
  // Windows taskbar
  posctx.fillStyle = '#090d16';
  posctx.fillRect(0, 168, 256, 24);
  posctx.fillStyle = '#38bdf8';
  posctx.fillRect(108, 174, 5, 5);
  posctx.fillRect(114, 174, 5, 5);
  posctx.fillRect(108, 180, 5, 5);
  posctx.fillRect(114, 180, 5, 5);

  // 9. Display Phone OLED Wallpapers
  const phoneScreens = [
    ['#0f172a', '#2563eb', '#38bdf8'],
    ['#1e1b4b', '#7c3aed', '#ec4899'],
    ['#064e3b', '#10b981', '#a7f3d0'],
  ].map(([bg, c1, c2]) => {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 128, 256);
    g.addColorStop(0, bg);
    g.addColorStop(0.55, c1);
    g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 256);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('09:41', 64, 62);
    ctx.fillStyle = '#000000';
    ctx.fillRect(42, 10, 44, 10);
    return finalizeTexture(c, true, maxAnisotropy);
  });

  // 10. Warehouse Box Label
  const boxC = document.createElement('canvas');
  boxC.width = 128;
  boxC.height = 128;
  const bctx = boxC.getContext('2d')!;
  bctx.fillStyle = '#e2e8f0';
  bctx.fillRect(0, 0, 128, 128);
  bctx.fillStyle = '#0f172a';
  bctx.fillRect(10, 14, 108, 22);
  bctx.fillStyle = '#ffffff';
  bctx.font = 'bold 12px sans-serif';
  bctx.fillText('FLAGSHIP SEAL', 18, 29);
  bctx.fillStyle = '#334155';
  bctx.fillRect(14, 52, 80, 10);
  bctx.fillRect(14, 70, 56, 8);
  bctx.strokeStyle = '#0f172a';
  bctx.lineWidth = 2;
  bctx.strokeRect(4, 4, 120, 120);

  // 11. Soft radial contact shadow
  const shadC = document.createElement('canvas');
  shadC.width = 128;
  shadC.height = 128;
  const shctx = shadC.getContext('2d')!;
  const sg = shctx.createRadialGradient(64, 64, 6, 64, 64, 62);
  sg.addColorStop(0, 'rgba(0,0,0,0.48)');
  sg.addColorStop(0.6, 'rgba(0,0,0,0.16)');
  sg.addColorStop(1, 'rgba(0,0,0,0)');
  shctx.fillStyle = sg;
  shctx.fillRect(0, 0, 128, 128);

  return {
    terrazzoTile: finalizeTexture(tileC, true, maxAnisotropy, 7, 6),
    terrazzoRoughness: finalizeTexture(roughC, false, maxAnisotropy, 7, 6),
    brownWall: finalizeTexture(brownC, true, maxAnisotropy, 5, 2),
    oakWood: finalizeTexture(oakC, true, maxAnisotropy, 2, 2),
    walnutWood: finalizeTexture(walC, true, maxAnisotropy, 2, 2),
    asphalt: finalizeTexture(aspC, true, maxAnisotropy, 4, 2),
    sidewalkTile: finalizeTexture(swC, true, maxAnisotropy, 12, 4),
    storeSign: finalizeTexture(signC, true, maxAnisotropy),
    directorScreen: finalizeTexture(pcC, true, maxAnisotropy),
    imacBack: finalizeTexture(imacBackC, true, maxAnisotropy),
    windowsScreen: finalizeTexture(winC, true, maxAnisotropy),
    posScreen: finalizeTexture(posC, true, maxAnisotropy),
    phoneScreens,
    boxLabel: finalizeTexture(boxC, true, maxAnisotropy),
    contactShadow: finalizeTexture(shadC, true, maxAnisotropy),
    maxAnisotropy,
  };
}
