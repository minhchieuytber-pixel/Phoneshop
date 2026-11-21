import * as THREE from 'three';
import gsap from 'gsap';
import type { InteractableTarget } from '../core/types';
import type { PhysicsWorld } from './physicsWorld';
import { createLabelSignTexture, type ProceduralTextures } from './textures';

export interface StoreSceneHandles {
  root: THREE.Group;
  interactables: THREE.Object3D[];
  interiorLights: THREE.PointLight[];
  emissivePanels: THREE.MeshStandardMaterial[];
  doorLeft: THREE.Group;
  doorRight: THREE.Group;
  directorDoor: THREE.Group;
  directorChairSeatPos: THREE.Vector3;
  directorChairLookTarget: THREE.Vector3;
  vipChairSeatPos: THREE.Vector3;
  vipChairLookTarget: THREE.Vector3;
  cafeSeatPos: THREE.Vector3;
  cafeLookTarget: THREE.Vector3;
  setDoorState: (open: boolean) => void;
  setDirectorDoorState: (open: boolean) => void;
  setLightsState: (on: boolean) => void;
  cctvCameras: Record<'showroom' | 'cashier' | 'tech' | 'warehouse' | 'entrance', THREE.PerspectiveCamera>;
}

function tagInteractable(obj: THREE.Object3D, data: InteractableTarget): void {
  obj.traverse((child) => {
    child.userData.interactable = data;
  });
}

function buildCompositeChair(seatColor: string, metalMat: THREE.Material, hasBack = true): THREE.Group {
  const chair = new THREE.Group();
  const cushionMat = new THREE.MeshStandardMaterial({ color: seatColor, roughness: 0.65 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.04, 5), metalMat);
  base.position.y = 0.04;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 10), metalMat);
  stem.position.y = 0.24;
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 0.44), cushionMat);
  seat.position.y = 0.46;
  seat.castShadow = true;
  chair.add(base, stem, seat);
  if (hasBack) {
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.48, 0.08), cushionMat);
    back.position.set(0, 0.72, -0.19);
    back.castShadow = true;
    chair.add(back);
  }
  return chair;
}

function buildRoomSignPlaque(
  title: string,
  subtitle: string,
  textures: ProceduralTextures,
  width = 1.6,
  height = 0.4,
  accent = '#38bdf8',
): THREE.Group {
  const g = new THREE.Group();
  const tex = createLabelSignTexture(title, subtitle, textures.maxAnisotropy, accent);
  const backing = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.04, height + 0.04, 0.03),
    new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.7, roughness: 0.3 }),
  );
  const faceMat = new THREE.MeshStandardMaterial({
    map: tex,
    emissiveMap: tex,
    emissive: new THREE.Color('#ffffff'),
    emissiveIntensity: 0.42,
    roughness: 0.25,
  });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(width, height), faceMat);
  front.position.z = 0.017;
  const back = front.clone();
  back.rotation.y = Math.PI;
  back.position.z = -0.017;
  g.add(backing, front, back);
  return g;
}

function buildCompositeSmartphone(
  frameColor: string,
  screenTex: THREE.Texture,
  scale = 1,
): THREE.Group {
  const phone = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.082 * scale, 0.165 * scale, 0.011 * scale),
    new THREE.MeshStandardMaterial({ color: frameColor, metalness: 0.88, roughness: 0.22 }),
  );
  body.castShadow = true;
  phone.add(body);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.075 * scale, 0.156 * scale),
    new THREE.MeshStandardMaterial({
      map: screenTex,
      emissiveMap: screenTex,
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0.48,
      roughness: 0.12,
      metalness: 0.05,
    }),
  );
  screen.position.z = 0.006 * scale;
  phone.add(screen);

  const camIsland = new THREE.Mesh(
    new THREE.BoxGeometry(0.032 * scale, 0.034 * scale, 0.004 * scale),
    new THREE.MeshStandardMaterial({ color: frameColor, metalness: 0.75, roughness: 0.25 }),
  );
  camIsland.position.set(-0.018 * scale, 0.055 * scale, -0.007 * scale);
  phone.add(camIsland);

  const standBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038 * scale, 0.044 * scale, 0.012 * scale, 16),
    new THREE.MeshStandardMaterial({ color: '#d4d4d8', metalness: 0.85, roughness: 0.2 }),
  );
  standBase.position.set(0, -0.095 * scale, -0.02 * scale);
  phone.add(standBase);

  const standNeck = new THREE.Mesh(
    new THREE.BoxGeometry(0.014 * scale, 0.06 * scale, 0.012 * scale),
    new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.85, roughness: 0.25 }),
  );
  standNeck.position.set(0, -0.055 * scale, -0.018 * scale);
  standNeck.rotation.x = 0.35;
  phone.add(standNeck);

  return phone;
}

function buildDisplayTable(
  x: number,
  z: number,
  tableLabel: string,
  tableSublabel: string,
  oakMat: THREE.Material,
  metalMat: THREE.Material,
  textures: ProceduralTextures,
  physics: PhysicsWorld,
  interactables: THREE.Object3D[],
  tableId: string,
): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, z);

  const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.05), oakMat);
  top.position.y = 0.88;
  top.castShadow = true;
  top.receiveShadow = true;
  g.add(top);

  const trim = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.025, 1.07), metalMat);
  trim.position.y = 0.84;
  g.add(trim);

  const legGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.84, 12);
  [
    [-1.05, -0.4],
    [1.05, -0.4],
    [-1.05, 0.4],
    [1.05, 0.4],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeo, metalMat);
    leg.position.set(lx, 0.42, lz);
    leg.castShadow = true;
    g.add(leg);
  });

  const frameColors = ['#b8b2a6', '#1e293b', '#3b82f6', '#d4d4d8'];
  for (let i = 0; i < 4; i++) {
    const phone = buildCompositeSmartphone(
      frameColors[i],
      textures.phoneScreens[i % textures.phoneScreens.length],
      1.15,
    );
    phone.position.set(-0.78 + i * 0.52, 1.02, i % 2 === 0 ? 0.18 : -0.18);
    phone.rotation.y = i % 2 === 0 ? 0 : Math.PI;
    phone.rotation.x = -0.35;
    g.add(phone);
  }

  // Table Nameplate Stand on corner of display table
  const plaque = buildRoomSignPlaque(tableLabel, tableSublabel, textures, 0.62, 0.16, '#38bdf8');
  plaque.position.set(0.82, 1.01, 0.36);
  plaque.rotation.x = -0.32;
  g.add(plaque);

  tagInteractable(g, {
    id: tableId,
    type: 'display_phone',
    label: tableLabel,
    sublabel: 'Xem thông số & giá thị trường',
  });
  interactables.push(g);
  physics.addBoxCollider(tableId, x, z, 2.45, 1.1, 1.2);

  return g;
}

function buildGlassCabinet(
  x: number,
  z: number,
  rotY: number,
  glassMat: THREE.Material,
  metalMat: THREE.Material,
  textures: ProceduralTextures,
  physics: PhysicsWorld,
  id: string,
): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.72, 0.52), metalMat);
  base.position.y = 0.36;
  base.castShadow = true;
  base.receiveShadow = true;
  g.add(base);

  const glassBox = new THREE.Mesh(new THREE.BoxGeometry(1.46, 1.15, 0.48), glassMat);
  glassBox.position.y = 1.3;
  glassBox.renderOrder = 3;
  g.add(glassBox);

  const cap = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.52), metalMat);
  cap.position.y = 1.91;
  g.add(cap);

  const boxMat = new THREE.MeshStandardMaterial({ map: textures.boxLabel, roughness: 0.4 });
  for (let s = 0; s < 2; s++) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.02, 0.42), glassMat);
    shelf.position.y = 1.05 + s * 0.42;
    g.add(shelf);
    for (let b = 0; b < 4; b++) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.045, 0.22), boxMat);
      box.position.set(-0.48 + b * 0.32, 1.09 + s * 0.42, 0);
      g.add(box);
    }
  }

  physics.addBoxCollider(id, x, z, rotY === 0 ? 1.55 : 0.6, rotY === 0 ? 0.6 : 1.55, 2);
  return g;
}

function buildMicroscope(): THREE.Group {
  const m = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.35, metalness: 0.4 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.25, metalness: 0.8 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.28), baseMat);
  base.position.y = 0.015;
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.34, 12), darkMetal);
  pillar.position.set(0, 0.18, -0.09);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.16), baseMat);
  arm.position.set(0, 0.27, -0.02);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.13, 14), darkMetal);
  head.position.set(0, 0.24, 0.04);
  const eyeL = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.08, 10), darkMetal);
  eyeL.position.set(-0.022, 0.32, 0.06);
  eyeL.rotation.x = 0.45;
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.022;

  m.add(base, pillar, arm, head, eyeL, eyeR);
  return m;
}

function buildWindowsDesktopPC(
  screenTex: THREE.Texture,
  darkMetalMat: THREE.Material,
  metalMat: THREE.Material,
  withTower = true,
): THREE.Group {
  const g = new THREE.Group();

  // Monitor matte black foot & neck stand
  const basePlate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.015, 0.16), darkMetalMat);
  basePlate.position.set(0, 0.008, 0);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 0.04), darkMetalMat);
  neck.position.set(0, 0.09, 0.03);
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.34, 0.03), darkMetalMat);
  bezel.position.set(0, 0.25, 0);
  bezel.castShadow = true;

  // Screen faces -Z (toward operator)
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.52, 0.3),
    new THREE.MeshStandardMaterial({
      map: screenTex,
      emissiveMap: screenTex,
      emissive: '#ffffff',
      emissiveIntensity: 0.48,
      roughness: 0.16,
    }),
  );
  screen.position.set(0, 0.25, -0.017);
  screen.rotation.y = Math.PI;

  // Windows keyboard & mouse in front (-Z)
  const kb = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.015, 0.13), darkMetalMat);
  kb.position.set(-0.04, 0.008, -0.22);
  const mousePad = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.004, 0.16),
    new THREE.MeshStandardMaterial({ color: '#090d16', roughness: 0.9 }),
  );
  mousePad.position.set(0.24, 0.002, -0.22);
  const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.02, 0.09), darkMetalMat);
  mouse.position.set(0.24, 0.012, -0.22);

  g.add(basePlate, neck, bezel, screen, kb, mousePad, mouse);

  if (withTower) {
    // Classic Windows Desktop PC Tower beside monitor
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.34, 0.32), darkMetalMat);
    tower.position.set(0.4, 0.17, -0.02);
    tower.castShadow = true;
    const frontAccent = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.3, 0.012), metalMat);
    frontAccent.position.set(0.4, 0.17, -0.182);
    const powerLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.012, 0.015),
      new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#38bdf8', emissiveIntensity: 1.1 }),
    );
    powerLed.position.set(0.4, 0.29, -0.185);
    g.add(tower, frontAccent, powerLed);
  }

  return g;
}

export function buildStoreScene(
  textures: ProceduralTextures,
  physics: PhysicsWorld,
  isSoftwareGl: boolean,
): StoreSceneHandles {
  const root = new THREE.Group();
  const interactables: THREE.Object3D[] = [];
  const interiorLights: THREE.PointLight[] = [];
  const emissivePanels: THREE.MeshStandardMaterial[] = [];

  // Shared PBR Materials: BLACK FLOOR & BROWN WALLS
  const floorMat = new THREE.MeshStandardMaterial({
    map: textures.terrazzoTile,
    roughnessMap: textures.terrazzoRoughness,
    roughness: 0.28,
    metalness: 0.12,
  });
  const wallMat = new THREE.MeshStandardMaterial({
    map: textures.brownWall,
    color: '#8c6248',
    roughness: 0.78,
  });
  const accentWallMat = new THREE.MeshStandardMaterial({ color: '#2b1e16', roughness: 0.65 });
  const oakMat = new THREE.MeshStandardMaterial({ map: textures.oakWood, roughness: 0.55 });
  const walnutMat = new THREE.MeshStandardMaterial({ map: textures.walnutWood, roughness: 0.42 });
  const metalMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.85, roughness: 0.24 });
  const darkMetalMat = new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.78, roughness: 0.3 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#dbeafe',
    roughness: 0.08,
    metalness: 0.05,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    side: THREE.DoubleSide,
    transmission: isSoftwareGl ? 0 : 0.65,
    ior: 1.5,
  });

  // 1. Store Black Floor & Ceiling
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 18), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.02, -1);
  floor.receiveShadow = true;
  root.add(floor);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 18),
    new THREE.MeshStandardMaterial({ color: '#e7dfd8', roughness: 0.9 }),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 3.8, -1);
  root.add(ceiling);

  const addWall = (
    id: string,
    cx: number,
    cz: number,
    w: number,
    d: number,
    h = 3.8,
    mat: THREE.Material = wallMat,
    collide = true,
  ) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(cx, h / 2, cz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    if (collide) physics.addBoxCollider(id, cx, cz, w, d, h);
    return mesh;
  };

  // Perimeter Exterior Brown Walls
  addWall('wall_back', 0, -10, 20.2, 0.25);
  addWall('wall_left', -10, -1, 0.25, 18.2);
  addWall('wall_right', 10, -1, 0.25, 18.2);

  // Front Glass Curtain Wall at Z = +8 (opening at X: [-1.2, 1.2])
  addWall('front_wall_l', -5.6, 8, 8.8, 0.12, 3.8, glassMat, true);
  addWall('front_wall_r', 5.6, 8, 8.8, 0.12, 3.8, glassMat, true);
  addWall('front_transom', 0, 8, 20.2, 0.22, 0.95, darkMetalMat, false).position.y = 3.35;
  addWall('front_plinth_l', -5.6, 8, 8.8, 0.2, 0.35, darkMetalMat, false).position.y = 0.18;
  addWall('front_plinth_r', 5.6, 8, 8.8, 0.2, 0.35, darkMetalMat, false).position.y = 0.18;

  // Storefront Signboard (MINH CHIÊU MOBILE)
  const signFrame = new THREE.Mesh(new THREE.BoxGeometry(8.6, 1.25, 0.25), darkMetalMat);
  signFrame.position.set(0, 4.45, 8.15);
  const signFaceMat = new THREE.MeshStandardMaterial({
    map: textures.storeSign,
    emissiveMap: textures.storeSign,
    emissive: new THREE.Color('#ffffff'),
    emissiveIntensity: 0.65,
    roughness: 0.3,
  });
  emissivePanels.push(signFaceMat);
  const signFace = new THREE.Mesh(new THREE.PlaneGeometry(8.3, 1.12), signFaceMat);
  signFace.position.set(0, 4.45, 8.29);
  root.add(signFrame, signFace);

  // Interactive Double Entrance Glass Doors
  const doorLeft = new THREE.Group();
  doorLeft.position.set(-0.6, 0, 8);
  const doorLeftGlass = new THREE.Mesh(new THREE.BoxGeometry(1.16, 2.75, 0.05), glassMat);
  doorLeftGlass.position.y = 1.4;
  const doorLeftHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.75, 10), metalMat);
  doorLeftHandle.position.set(0.45, 1.25, 0.05);
  doorLeft.add(doorLeftGlass, doorLeftHandle);

  const doorRight = new THREE.Group();
  doorRight.position.set(0.6, 0, 8);
  const doorRightGlass = doorLeftGlass.clone();
  const doorRightHandle = doorLeftHandle.clone();
  doorRightHandle.position.set(-0.45, 1.25, 0.05);
  doorRight.add(doorRightGlass, doorRightHandle);

  root.add(doorLeft, doorRight);
  physics.addBoxCollider('entrance_door', 0, 8, 2.4, 0.2, 3);

  tagInteractable(doorLeft, {
    id: 'entrance_door',
    type: 'door',
    label: 'Cửa kính chính',
    sublabel: 'Đóng / Mở cửa hàng',
  });
  tagInteractable(doorRight, {
    id: 'entrance_door',
    type: 'door',
    label: 'Cửa kính chính',
    sublabel: 'Đóng / Mở cửa hàng',
  });
  interactables.push(doorLeft, doorRight);

  // Light Switch next to entrance pillar
  const switchGroup = new THREE.Group();
  switchGroup.position.set(1.65, 1.35, 7.82);
  const switchPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.2, 0.04),
    new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.3 }),
  );
  const switchToggle = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.07, 0.03),
    new THREE.MeshStandardMaterial({ color: '#0284c7', emissive: '#0284c7', emissiveIntensity: 0.4 }),
  );
  switchToggle.position.z = -0.02;
  switchGroup.add(switchPlate, switchToggle);
  root.add(switchGroup);
  tagInteractable(switchGroup, {
    id: 'light_switch',
    type: 'light_switch',
    label: 'Công tắc đèn showroom',
    sublabel: 'Bật / Tắt hệ thống chiếu sáng',
  });
  interactables.push(switchGroup);

  // --- INTERIOR BROWN PARTITIONS & DIRECTOR SLIDING DOOR ---
  // Partition Z = -2.5 separating Director's Office (X: -10..-2.5)
  addWall('part_dir_window_wall', -7.2, -2.5, 5.6, 0.14, 0.95, wallMat, true);
  const dirGlass = new THREE.Mesh(new THREE.BoxGeometry(5.5, 2.85, 0.06), glassMat);
  dirGlass.position.set(-7.2, 2.38, -2.5);
  root.add(dirGlass);

  // Transom above Director sliding door (X: [-4.4, -2.5])
  addWall('dir_door_transom', -3.45, -2.5, 1.9, 0.16, 1.0, wallMat, false).position.y = 3.3;

  // SLIDING DOOR FOR DIRECTOR'S OFFICE (Phòng Sếp có cửa trượt ra vào!)
  const slidingRail = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.09, 0.14), darkMetalMat);
  slidingRail.position.set(-4.4, 2.82, -2.4);
  root.add(slidingRail);

  const directorDoor = new THREE.Group();
  directorDoor.position.set(-3.45, 0, -2.42);
  const dDoorFrameL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.76, 0.07), darkMetalMat);
  dDoorFrameL.position.set(-0.92, 1.38, 0);
  const dDoorFrameR = dDoorFrameL.clone();
  dDoorFrameR.position.x = 0.92;
  const dDoorFrameTop = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.09, 0.07), darkMetalMat);
  dDoorFrameTop.position.set(0, 2.74, 0);
  const dDoorFrameBot = dDoorFrameTop.clone();
  dDoorFrameBot.position.y = 0.05;
  const dDoorGlass = new THREE.Mesh(new THREE.BoxGeometry(1.78, 2.62, 0.04), glassMat);
  dDoorGlass.position.set(0, 1.4, 0);
  const dDoorHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.65, 10), metalMat);
  dDoorHandle.position.set(0.75, 1.25, 0.06);
  const dDoorHandleBack = dDoorHandle.clone();
  dDoorHandleBack.position.z = -0.06;
  directorDoor.add(dDoorFrameL, dDoorFrameR, dDoorFrameTop, dDoorFrameBot, dDoorGlass, dDoorHandle, dDoorHandleBack);
  root.add(directorDoor);
  physics.addBoxCollider('director_door', -3.45, -2.5, 1.92, 0.2, 2.8);

  tagInteractable(directorDoor, {
    id: 'director_door',
    type: 'director_door',
    label: 'Cửa trượt Phòng Giám Đốc',
    sublabel: 'Trượt mở / đóng cửa phòng sếp',
  });
  interactables.push(directorDoor);

  // Warehouse & Back Partitions (Brown Walls)
  addWall('part_wh_left', -2.5, -6.25, 0.18, 7.5, 3.8, wallMat, true);
  addWall('part_wh_front_l', -1.0, -2.5, 3.0, 0.18, 3.8, wallMat, true);
  addWall('part_wh_front_r', 3.4, -2.5, 2.2, 0.18, 3.8, wallMat, true);

  // Tech Lab Partition
  addWall('part_tech_back', 4.5, -5.6, 0.16, 8.8, 3.8, wallMat, true);
  const techGlass = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.0, 4.2), glassMat);
  techGlass.position.set(4.5, 2.0, -3.5);
  root.add(techGlass);
  addWall('part_tech_front', 4.5, 1.2, 0.16, 1.2, 3.8, wallMat, true);
  addWall('part_tech_corner', 7.25, 1.8, 5.5, 0.16, 0.95, wallMat, true);

  // --- ROOM & ZONE SIGN PLAQUES (Biển phòng & Khu vực) ---
  const dirSign = buildRoomSignPlaque('PHÒNG GIÁM ĐỐC', 'DIRECTOR OFFICE', textures, 1.75, 0.42, '#f59e0b');
  dirSign.position.set(-3.45, 3.16, -2.38);
  root.add(dirSign);

  const whSign = buildRoomSignPlaque('KHO HÀNG', 'WAREHOUSE & KIỂM KÊ', textures, 1.55, 0.4, '#eab308');
  whSign.position.set(1.4, 3.16, -2.38);
  root.add(whSign);

  const techSign = buildRoomSignPlaque('PHÒNG KỸ THUẬT & CSKH', 'SỬA CHỮA · BẢO HÀNH · CSKH', textures, 1.95, 0.42, '#10b981');
  techSign.position.set(4.4, 3.16, -0.3);
  techSign.rotation.y = -Math.PI / 2;
  root.add(techSign);

  const cashSign = buildRoomSignPlaque('QUẦY THU NGÂN', 'THANH TOÁN & POS', textures, 1.8, 0.42, '#38bdf8');
  cashSign.position.set(7.2, 2.85, 4.4);
  root.add(cashSign);

  const showroomSign = buildRoomSignPlaque('KHU TRƯNG BÀY', 'SHOWROOM TRẢI NGHIỆM', textures, 2.1, 0.44, '#38bdf8');
  showroomSign.position.set(-2.5, 3.18, 5.8);
  root.add(showroomSign);

  // --- ZONE 1: SHOWROOM ---
  root.add(buildDisplayTable(-4.8, 5.2, 'BÀN FLAGSHIP', 'APPLE · SAMSUNG', oakMat, metalMat, textures, physics, interactables, 'table_1'));
  root.add(buildDisplayTable(-0.2, 3.6, 'BÀN TRẢI NGHIỆM', 'XIAOMI · GOOGLE', oakMat, metalMat, textures, physics, interactables, 'table_2'));
  root.add(buildDisplayTable(-4.8, 2.45, 'BÀN TẦM TRUNG', 'OPPO · VIVO · PHỤ KIỆN', oakMat, metalMat, textures, physics, interactables, 'table_3'));

  // Consultation Desk + 2 Chairs in Showroom
  const consultDesk = new THREE.Group();
  consultDesk.position.set(2.4, 0, 2.5);
  const cdTop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.72), oakMat);
  cdTop.position.y = 0.76;
  const cdBase = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.72, 0.62), accentWallMat);
  cdBase.position.y = 0.36;
  const cdSign = buildRoomSignPlaque('BÀN TƯ VẤN', 'TƯ VẤN MUA MÁY & PHỤ KIỆN', textures, 0.78, 0.18, '#38bdf8');
  cdSign.position.set(0, 0.9, 0.25);
  consultDesk.add(cdTop, cdBase, cdSign);
  root.add(consultDesk);
  physics.addBoxCollider('consult_desk', 2.4, 2.5, 1.45, 0.76, 1.0);

  const cChair1 = buildCompositeChair('#1e293b', metalMat);
  cChair1.position.set(2.05, 0, 3.25);
  cChair1.rotation.y = Math.PI;
  const cChair2 = buildCompositeChair('#1e293b', metalMat);
  cChair2.position.set(2.75, 0, 3.25);
  cChair2.rotation.y = Math.PI;
  const cStaffChair = buildCompositeChair('#0f766e', metalMat);
  cStaffChair.position.set(2.4, 0, 1.8);
  root.add(cChair1, cChair2, cStaffChair);

  // Glass Display Cabinets along showroom walls (clear of VIP Reception Room)
  root.add(buildGlassCabinet(-9.4, 5.5, Math.PI / 2, glassMat, darkMetalMat, textures, physics, 'cab_1'));
  root.add(buildGlassCabinet(-9.4, 2.8, Math.PI / 2, glassMat, darkMetalMat, textures, physics, 'cab_2'));
  root.add(buildGlassCabinet(9.4, 6.4, -Math.PI / 2, glassMat, darkMetalMat, textures, physics, 'cab_3'));

  // Waiting Sofa + Extra Lounge Chairs
  const sofaMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.85 });
  const waitingSofa = new THREE.Group();
  waitingSofa.position.set(3.2, 0, 6.2);
  const wSeat = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.42, 0.8), sofaMat);
  wSeat.position.y = 0.25;
  const wBack = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.55, 0.18), sofaMat);
  wBack.position.set(0, 0.62, 0.31);
  waitingSofa.add(wSeat, wBack);
  root.add(waitingSofa);
  physics.addBoxCollider('waiting_sofa', 3.2, 6.2, 2.15, 0.85, 1);

  const waitChairL1 = buildCompositeChair('#334155', metalMat);
  waitChairL1.position.set(-7.6, 0, 6.5);
  waitChairL1.rotation.y = Math.PI * 0.75;
  const waitChairL2 = buildCompositeChair('#334155', metalMat);
  waitChairL2.position.set(-6.4, 0, 6.8);
  waitChairL2.rotation.y = Math.PI;
  root.add(waitChairL1, waitChairL2);

  // Dedicated Waiting Chairs for Repair Customers (outside Tech Lab, in Showroom)
  const repairWaitSign = buildRoomSignPlaque(
    'GHẾ CHỜ SỬA CHỮA',
    'KHÁCH NGỒI ĐỢI TẠI ĐÂY',
    textures,
    1.55,
    0.34,
    '#10b981',
  );
  repairWaitSign.position.set(2.35, 1.55, -2.38);
  root.add(repairWaitSign);

  [1.6, 2.35, 3.1].forEach((wx) => {
    const rChair = buildCompositeChair('#1e293b', metalMat);
    rChair.position.set(wx, 0, -1.85);
    rChair.rotation.y = 0; // Facing +Z out into showroom
    root.add(rChair);
  });

  // --- ZONE 2: CASHIER COUNTER ---
  const cashierGroup = new THREE.Group();
  cashierGroup.position.set(7.2, 0, 4.4);
  const counterBase = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.02, 0.85), accentWallMat);
  counterBase.position.y = 0.51;
  counterBase.castShadow = true;
  counterBase.receiveShadow = true;
  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.06, 0.95), oakMat);
  counterTop.position.y = 1.05;
  cashierGroup.add(counterBase, counterTop);

  const posGroup = buildWindowsDesktopPC(textures.posScreen, darkMetalMat, metalMat, true);
  posGroup.position.set(-0.6, 1.08, -0.05);
  posGroup.rotation.y = Math.PI; // Faces +Z directly toward Cashier employee!
  cashierGroup.add(posGroup);
  tagInteractable(posGroup, {
    id: 'pos_terminal',
    type: 'pos_terminal',
    label: 'Máy tính Windows Thu Ngân (POS)',
    sublabel: 'Kiểm tra giao dịch & hóa đơn thực tế',
  });
  interactables.push(posGroup);

  const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.1, 0.42), darkMetalMat);
  drawer.position.set(0.55, 1.13, 0);
  const printer = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.22), darkMetalMat);
  printer.position.set(1.05, 1.15, 0.05);
  cashierGroup.add(drawer, printer);
  root.add(cashierGroup);
  physics.addBoxCollider('cashier_counter', 7.2, 4.4, 3.55, 1.0, 1.3);

  // Cashier Chair
  const cashierChair = buildCompositeChair('#0f172a', metalMat);
  cashierChair.position.set(6.7, 0, 5.35);
  cashierChair.rotation.y = Math.PI;
  root.add(cashierChair);

  // --- ZONE 3: TECHNICAL REPAIR LAB ---
  const repairBench = new THREE.Group();
  repairBench.position.set(7.6, 0, -4.5);
  const benchTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 0.95), oakMat);
  benchTop.position.y = 0.85;
  const benchFrame = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.82, 0.85), darkMetalMat);
  benchFrame.position.y = 0.41;
  const antiStaticMat = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.012, 0.42),
    new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.7 }),
  );
  antiStaticMat.position.set(0, 0.886, 0.12);
  const microscope = buildMicroscope();
  microscope.position.set(-0.65, 0.88, -0.05);
  const phoneUnderRepair = buildCompositeSmartphone('#475569', textures.phoneScreens[0], 1.1);
  phoneUnderRepair.position.set(0, 0.895, 0.12);
  phoneUnderRepair.rotation.x = -Math.PI / 2;
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.03, 12), darkMetalMat);
  lampBase.position.set(0.85, 0.89, -0.2);
  const lampArm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.42, 0.03), metalMat);
  lampArm.position.set(0.85, 1.1, -0.15);
  lampArm.rotation.x = 0.35;
  const lampHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.03, 0.08),
    new THREE.MeshStandardMaterial({ color: '#f8fafc', emissive: '#fef3c7', emissiveIntensity: 0.7 }),
  );
  lampHead.position.set(0.75, 1.28, 0.0);
  const repairSign = buildRoomSignPlaque('BÀN KỸ THUẬT', 'SỬA CHỮA PHẦN CỨNG', textures, 0.75, 0.18, '#10b981');
  repairSign.position.set(0.85, 0.99, 0.32);
  repairBench.add(benchTop, benchFrame, antiStaticMat, microscope, phoneUnderRepair, lampBase, lampArm, lampHead, repairSign);
  root.add(repairBench);
  tagInteractable(repairBench, {
    id: 'repair_bench',
    type: 'repair_bench',
    label: 'Bàn kỹ thuật sửa chữa',
    sublabel: 'Giám sát tiến độ sửa chữa & linh kiện',
  });
  interactables.push(repairBench);
  physics.addBoxCollider('repair_bench', 7.6, -4.5, 2.65, 1.0, 1.4);

  // Technician Stool 1
  const techChair = buildCompositeChair('#0f766e', metalMat, true);
  techChair.position.set(7.6, 0, -5.45);
  root.add(techChair);

  // Tech Station 2 (East wall north — Hardware & IC Repair)
  const repairBench2 = new THREE.Group();
  repairBench2.position.set(9.2, 0, -7.2);
  const b2Top = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.06, 2.0), oakMat);
  b2Top.position.y = 0.85;
  const b2Frame = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.82, 1.9), darkMetalMat);
  b2Frame.position.y = 0.41;
  const b2Mat = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.012, 0.65),
    new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.7 }),
  );
  b2Mat.position.set(-0.08, 0.886, 0);
  const b2Scope = buildMicroscope();
  b2Scope.position.set(0.05, 0.88, -0.45);
  const b2Phone = buildCompositeSmartphone('#1f2937', textures.phoneScreens[1], 1.1);
  b2Phone.position.set(-0.08, 0.895, 0);
  b2Phone.rotation.x = -Math.PI / 2;
  const b2Sign = buildRoomSignPlaque('BÀN KỸ THUẬT 2', 'HÀN MẠCH & PIN', textures, 0.72, 0.17, '#10b981');
  b2Sign.position.set(-0.28, 0.99, 0.65);
  b2Sign.rotation.y = -Math.PI / 2;
  repairBench2.add(b2Top, b2Frame, b2Mat, b2Scope, b2Phone, b2Sign);
  root.add(repairBench2);
  tagInteractable(repairBench2, {
    id: 'repair_bench_2',
    type: 'repair_bench',
    label: 'Bàn kỹ thuật 2 (Phần cứng)',
    sublabel: 'Giám sát tiến độ sửa chữa phần cứng',
  });
  interactables.push(repairBench2);
  physics.addBoxCollider('repair_bench_2', 9.2, -7.2, 0.9, 2.05, 1.4);

  const techChair2 = buildCompositeChair('#0f766e', metalMat, true);
  techChair2.position.set(8.25, 0, -7.2);
  techChair2.rotation.y = Math.PI / 2;
  root.add(techChair2);

  // Tech Station 3 (East wall south — Software & Screen Laminating)
  const repairBench3 = new THREE.Group();
  repairBench3.position.set(9.2, 0, -1.7);
  const b3Top = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.06, 2.0), oakMat);
  b3Top.position.y = 0.85;
  const b3Frame = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.82, 1.9), darkMetalMat);
  b3Frame.position.y = 0.41;
  const b3Pc = buildWindowsDesktopPC(textures.windowsScreen, darkMetalMat, metalMat, true);
  b3Pc.position.set(0.12, 0.88, 0.22);
  b3Pc.rotation.y = Math.PI / 2; // Faces -X directly toward Technician #3!
  const b3Phone = buildCompositeSmartphone('#64748b', textures.phoneScreens[2], 1.1);
  b3Phone.position.set(-0.08, 0.895, -0.45);
  b3Phone.rotation.x = -Math.PI / 2;
  const b3Sign = buildRoomSignPlaque('BÀN KỸ THUẬT 3', 'ÉP KÍNH & PHẦN MỀM', textures, 0.72, 0.17, '#10b981');
  b3Sign.position.set(-0.28, 0.99, -0.75);
  b3Sign.rotation.y = -Math.PI / 2;
  repairBench3.add(b3Top, b3Frame, b3Pc, b3Phone, b3Sign);
  root.add(repairBench3);
  tagInteractable(repairBench3, {
    id: 'repair_bench_3',
    type: 'repair_bench',
    label: 'Bàn kỹ thuật 3 (Ép kính & PM)',
    sublabel: 'Giám sát ép kính & chạy phần mềm',
  });
  tagInteractable(b3Pc, {
    id: 'tech_pc',
    type: 'tech_pc',
    label: 'Máy tính Windows Kỹ thuật',
    sublabel: 'Mở màn hình Windows chẩn đoán & sửa máy',
  });
  interactables.push(repairBench3, b3Pc);
  physics.addBoxCollider('repair_bench_3', 9.2, -1.7, 0.9, 2.05, 1.4);

  const techChair3 = buildCompositeChair('#0f766e', metalMat, true);
  techChair3.position.set(8.25, 0, -1.7);
  techChair3.rotation.y = Math.PI / 2;
  root.add(techChair3);

  const partsCab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.1, 0.55), darkMetalMat);
  partsCab.position.set(7.6, 1.05, -9.2);
  root.add(partsCab);
  physics.addBoxCollider('parts_cab', 7.6, -9.2, 2.25, 0.6, 2.2);

  // --- ZONE 4: WAREHOUSE ---
  const buildRack = (rx: number, rz: number, id: string) => {
    const rack = new THREE.Group();
    rack.position.set(rx, 0, rz);
    const postGeo = new THREE.BoxGeometry(0.06, 2.2, 0.06);
    [
      [-1.05, -0.35],
      [1.05, -0.35],
      [-1.05, 0.35],
      [1.05, 0.35],
    ].forEach(([px, pz]) => {
      const p = new THREE.Mesh(postGeo, darkMetalMat);
      p.position.set(px, 1.1, pz);
      rack.add(p);
    });
    const boxMat = new THREE.MeshStandardMaterial({ map: textures.boxLabel, roughness: 0.45 });
    for (let level = 0; level < 3; level++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.04, 0.76), metalMat);
      plank.position.y = 0.45 + level * 0.72;
      rack.add(plank);
      for (let b = 0; b < 5; b++) {
        const carton = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 0.42), boxMat);
        carton.position.set(-0.78 + b * 0.39, 0.59 + level * 0.72, 0);
        carton.castShadow = true;
        rack.add(carton);
      }
    }
    root.add(rack);
    tagInteractable(rack, {
      id,
      type: 'warehouse_shelf',
      label: 'Kệ kho hàng điện thoại',
      sublabel: 'Xem tồn kho & yêu cầu kiểm kê',
    });
    interactables.push(rack);
    physics.addBoxCollider(id, rx, rz, 2.2, 0.82, 2.3);
  };

  buildRack(0.0, -8.8, 'wh_rack_1');
  buildRack(2.8, -8.8, 'wh_rack_2');
  buildRack(0.0, -6.2, 'wh_rack_3');

  // --- ZONE 4B: WAREHOUSE PACKING & SHIPPING STATION (KHU ĐÓNG GÓI & VẬN CHUYỂN) ---
  const packingBench = new THREE.Group();
  packingBench.position.set(2.95, 0, -5.6);
  const pbTop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.9), oakMat);
  pbTop.position.y = 0.85;
  pbTop.castShadow = true;
  pbTop.receiveShadow = true;
  const pbFrame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.82, 0.8), darkMetalMat);
  pbFrame.position.y = 0.41;

  const parcelMat = new THREE.MeshStandardMaterial({ color: '#c28c53', roughness: 0.78 });
  const tapeMat = new THREE.MeshStandardMaterial({ color: '#fde68a', roughness: 0.4 });
  const parcel1 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.26), parcelMat);
  parcel1.position.set(-0.38, 0.99, 0.05);
  parcel1.castShadow = true;
  const parcel2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.22), parcelMat);
  parcel2.position.set(-0.02, 0.97, -0.12);
  parcel2.rotation.y = 0.22;
  const tapeRoll = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.02, 8, 16), tapeMat);
  tapeRoll.rotation.x = Math.PI / 2;
  tapeRoll.position.set(0.32, 0.91, 0.18);
  const labelPrinter = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.22), darkMetalMat);
  labelPrinter.position.set(0.55, 0.95, -0.15);

  const pbSign = buildRoomSignPlaque('ĐÓNG GÓI & VẬN CHUYỂN', 'SHIP HÀNG ONLINE', textures, 1.35, 0.24, '#f97316');
  pbSign.position.set(0, 1.32, -0.35);
  packingBench.add(pbTop, pbFrame, parcel1, parcel2, tapeRoll, labelPrinter, pbSign);
  root.add(packingBench);
  tagInteractable(packingBench, {
    id: 'packing_bench',
    type: 'packing_bench',
    label: 'Bàn Đóng gói & Vận chuyển',
    sublabel: 'Theo dõi đóng gói & giao đơn hàng online từ kho',
  });
  interactables.push(packingBench);
  physics.addBoxCollider('packing_bench', 2.95, -5.6, 1.65, 0.95, 1.2);

  // --- ZONE 5: DIRECTOR'S OFFICE ---
  const dirDesk = new THREE.Group();
  dirDesk.position.set(-6.5, 0, -6.4);
  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.1), walnutMat);
  deskTop.position.y = 0.76;
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  const deskModesty = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.72, 0.9), walnutMat);
  deskModesty.position.y = 0.36;
  const dirDeskSign = buildRoomSignPlaque('BÀN GIÁM ĐỐC', 'MINH CHIÊU MOBILE', textures, 0.76, 0.18, '#f59e0b');
  dirDeskSign.position.set(0.7, 0.89, 0.42);
  dirDesk.add(deskTop, deskModesty, dirDeskSign);

  // Composite Apple iMac on Director's Desk (Silver Aluminum + Apple Logo Screen & Back)
  const silverAluMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.88, roughness: 0.18 });
  const imacChinMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.85, roughness: 0.22 });
  const pcGroup = new THREE.Group();
  pcGroup.position.set(0, 0.8, 0.12);

  // Anodized Aluminum L-Stand
  const imacFoot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.014, 0.18), silverAluMat);
  imacFoot.position.set(0, 0.007, 0.02);
  const imacNeck = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.026), silverAluMat);
  imacNeck.position.set(0, 0.12, 0.06);
  imacNeck.rotation.x = 0.14;

  // Sleek Unibody Aluminum Chassis
  const imacBody = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.58, 0.028), silverAluMat);
  imacBody.position.set(0, 0.41, 0);
  imacBody.castShadow = true;

  // Signature Aluminum Chin (front -Z) + Glossy Black Glass Display Bezel
  const imacChin = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.088, 0.01), imacChinMat);
  imacChin.position.set(0, 0.165, -0.015);
  const chinAppleMark = new THREE.Mesh(
    new THREE.CircleGeometry(0.016, 16),
    new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.7, roughness: 0.2 }),
  );
  chinAppleMark.position.set(0, 0.165, -0.021);
  chinAppleMark.rotation.y = Math.PI;

  const glassBezel = new THREE.Mesh(
    new THREE.BoxGeometry(0.94, 0.475, 0.008),
    new THREE.MeshStandardMaterial({ color: '#090d16', roughness: 0.12, metalness: 0.25 }),
  );
  glassBezel.position.set(0, 0.445, -0.014);

  // Front Screen (-Z facing Director) featuring prominent centered Apple Logo
  const monitorScreenMat = new THREE.MeshStandardMaterial({
    map: textures.directorScreen,
    emissiveMap: textures.directorScreen,
    emissive: '#ffffff',
    emissiveIntensity: 0.62,
    roughness: 0.12,
  });
  const monitorScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.89, 0.435), monitorScreenMat);
  monitorScreen.position.set(0, 0.445, -0.02);
  monitorScreen.rotation.y = Math.PI;

  // Back Aluminum Shell (+Z facing room/doorway) featuring Apple Logo on brushed silver!
  const imacBackFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.93, 0.55),
    new THREE.MeshStandardMaterial({
      map: textures.imacBack,
      roughness: 0.28,
      metalness: 0.72,
    }),
  );
  imacBackFace.position.set(0, 0.41, 0.016);

  // Silver Apple Magic Keyboard & Magic Mouse
  const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.012, 0.125), silverAluMat);
  keyboard.position.set(-0.04, 0.008, -0.26);
  const magicMouse = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.016, 0.105), silverAluMat);
  magicMouse.position.set(0.24, 0.009, -0.26);

  pcGroup.add(
    imacFoot,
    imacNeck,
    imacBody,
    imacChin,
    chinAppleMark,
    glassBezel,
    monitorScreen,
    imacBackFace,
    keyboard,
    magicMouse,
  );
  dirDesk.add(pcGroup);
  tagInteractable(pcGroup, {
    id: 'director_pc',
    type: 'director_pc',
    label: 'iMac Giám Đốc (Apple macOS)',
    sublabel: 'Mở hệ thống quản lý Minh Chiêu macOS',
  });
  interactables.push(pcGroup);

  const deskPhone = new THREE.Group();
  deskPhone.position.set(-0.78, 0.8, -0.18);
  const phoneBase = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.24), darkMetalMat);
  phoneBase.position.y = 0.025;
  const handset = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.22), darkMetalMat);
  handset.position.set(-0.06, 0.06, 0);
  const phoneScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.09, 0.06),
    new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#0284c7', emissiveIntensity: 0.6 }),
  );
  phoneScreen.position.set(0.04, 0.052, 0.02);
  phoneScreen.rotation.x = -Math.PI / 2;
  deskPhone.add(phoneBase, handset, phoneScreen);
  dirDesk.add(deskPhone);
  tagInteractable(deskPhone, {
    id: 'desk_phone',
    type: 'desk_phone',
    label: 'Điện thoại bàn Giám đốc',
    sublabel: 'Gọi trợ lý, nhân viên & nhà cung cấp',
  });
  interactables.push(deskPhone);

  root.add(dirDesk);
  physics.addBoxCollider('director_desk', -6.5, -6.4, 2.45, 1.15, 1.2);

  // Director Luxury Leather Executive Chair (Ghế bọc da Giám đốc)
  const dirChair = new THREE.Group();
  dirChair.position.set(-6.5, 0, -7.55);
  const leatherMat = new THREE.MeshStandardMaterial({ color: '#3b2114', roughness: 0.32, metalness: 0.08 });
  const leatherTrimMat = new THREE.MeshStandardMaterial({ color: '#5c3420', roughness: 0.38, metalness: 0.06 });
  const cBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 5), metalMat);
  cBase.position.y = 0.06;
  const cStem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.4, 10), metalMat);
  cStem.position.y = 0.26;
  const cSeat = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.12, 0.56), leatherMat);
  cSeat.position.y = 0.48;
  cSeat.castShadow = true;
  const cBack = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.68, 0.12), leatherMat);
  cBack.position.set(0, 0.86, -0.24);
  cBack.castShadow = true;
  const cHeadrest = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.2, 0.11), leatherTrimMat);
  cHeadrest.position.set(0, 1.24, -0.23);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.42), leatherTrimMat);
  armL.position.set(-0.3, 0.68, -0.02);
  const armR = armL.clone();
  armR.position.x = 0.3;
  const armPostL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.06), metalMat);
  armPostL.position.set(-0.3, 0.57, -0.05);
  const armPostR = armPostL.clone();
  armPostR.position.x = 0.3;
  dirChair.add(cBase, cStem, cSeat, cBack, cHeadrest, armL, armR, armPostL, armPostR);
  root.add(dirChair);
  tagInteractable(dirChair, {
    id: 'director_chair',
    type: 'director_chair',
    label: 'Ghế bọc da Giám đốc',
    sublabel: 'Ngồi làm việc / Đứng dậy',
  });
  interactables.push(dirChair);

  // Filing Cabinet
  const cabinet = new THREE.Group();
  cabinet.position.set(-9.1, 0, -8.8);
  const cabBody = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.55, 0.58), darkMetalMat);
  cabBody.position.y = 0.775;
  cabBody.castShadow = true;
  cabinet.add(cabBody);
  for (let d = 0; d < 3; d++) {
    const drawerFace = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.42, 0.03), metalMat);
    drawerFace.position.set(0, 0.32 + d * 0.48, 0.295);
    cabinet.add(drawerFace);
  }
  root.add(cabinet);
  tagInteractable(cabinet, {
    id: 'filing_cabinet',
    type: 'filing_cabinet',
    label: 'Tủ hồ sơ & Hợp đồng',
    sublabel: 'Xem hợp đồng đối tác & báo cáo lưu trữ',
  });
  interactables.push(cabinet);
  physics.addBoxCollider('filing_cabinet', -9.1, -8.8, 0.9, 0.65, 1.6);

  // Corner Leather Sofa + Table in front of Sofa inside Director's Office (Only Director leather chair + Corner sofa + Table!)
  const guestSofa = new THREE.Group();
  guestSofa.position.set(-8.35, 0, -3.35);
  guestSofa.rotation.y = Math.PI; // Facing -Z into Director's office
  const gsSeat = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.38, 0.78), leatherMat);
  gsSeat.position.y = 0.24;
  gsSeat.castShadow = true;
  const gsBack = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.54, 0.18), leatherMat);
  gsBack.position.set(0, 0.56, -0.3);
  const gsArmL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.34, 0.78), leatherTrimMat);
  gsArmL.position.set(-0.92, 0.4, 0);
  const gsArmR = gsArmL.clone();
  gsArmR.position.x = 0.92;
  guestSofa.add(gsSeat, gsBack, gsArmL, gsArmR);
  root.add(guestSofa);
  physics.addBoxCollider('dir_guest_sofa', -8.35, -3.35, 2.02, 0.85, 1);

  // Coffee Table directly in front of Director's Corner Sofa
  const dirSofaTable = new THREE.Group();
  dirSofaTable.position.set(-8.35, 0, -4.5);
  const dstTop = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.62), walnutMat);
  dstTop.position.y = 0.45;
  dstTop.castShadow = true;
  [
    [-0.55, -0.22],
    [0.55, -0.22],
    [-0.55, 0.22],
    [0.55, 0.22],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.43, 8), darkMetalMat);
    leg.position.set(lx, 0.215, lz);
    dirSofaTable.add(leg);
  });
  const dstTray = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.02, 0.24), oakMat);
  dstTray.position.set(0, 0.485, 0);
  const porcelainMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.2 });
  const coffeeLiquidMat = new THREE.MeshStandardMaterial({ color: '#2b160b', roughness: 0.15 });
  const dstCup = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.028, 0.06, 12), porcelainMat);
  dstCup.position.set(-0.07, 0.525, 0);
  const dstCoffee = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.005, 12), coffeeLiquidMat);
  dstCoffee.position.set(-0.07, 0.554, 0);
  const dstCup2 = dstCup.clone();
  dstCup2.position.x = 0.07;
  const dstCoffee2 = dstCoffee.clone();
  dstCoffee2.position.x = 0.07;
  dirSofaTable.add(dstTop, dstTray, dstCup, dstCoffee, dstCup2, dstCoffee2);
  root.add(dirSofaTable);
  physics.addBoxCollider('dir_sofa_table', -8.35, -4.5, 1.35, 0.66, 0.55);

  // --- ZONE 5B: FORMAL VIP RECEPTION ROOM NEXT TO DIRECTOR'S OFFICE (PHÒNG TIẾP KHÁCH) ---
  addWall('vip_wall_south_base', -7.4, 0.9, 5.2, 0.14, 0.95, wallMat, true);
  const vipGlassSouth = new THREE.Mesh(new THREE.BoxGeometry(5.1, 2.85, 0.06), glassMat);
  vipGlassSouth.position.set(-7.4, 2.38, 0.9);
  root.add(vipGlassSouth);

  // East wall with formal entrance doorway gap Z: [-2.15, -0.2]
  addWall('vip_wall_east_stub', -4.8, 0.35, 0.14, 1.1, 3.8, wallMat, true);
  addWall('vip_door_transom', -4.8, -1.17, 0.16, 1.95, 1.0, wallMat, false).position.y = 3.3;

  const vipSign = buildRoomSignPlaque('PHÒNG TIẾP KHÁCH', 'VIP RECEPTION LOUNGE', textures, 1.7, 0.42, '#f59e0b');
  vipSign.position.set(-4.72, 3.16, -1.17);
  vipSign.rotation.y = Math.PI / 2;
  root.add(vipSign);

  // Formal woven carpet inside VIP Reception Room
  const vipRug = new THREE.Mesh(
    new THREE.BoxGeometry(4.1, 0.015, 2.45),
    new THREE.MeshStandardMaterial({ color: '#451a1a', roughness: 0.92 }),
  );
  vipRug.position.set(-7.35, 0.026, -0.8);
  vipRug.receiveShadow = true;
  root.add(vipRug);

  // Formal framed artwork on left wall of VIP room
  const vipArtFrame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.95, 1.45), walnutMat);
  vipArtFrame.position.set(-9.84, 1.9, -0.8);
  const vipArtCanvas = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 0.8),
    new THREE.MeshStandardMaterial({ color: '#d97706', emissive: '#78350f', emissiveIntensity: 0.25, roughness: 0.6 }),
  );
  vipArtCanvas.position.set(-9.81, 1.9, -0.8);
  vipArtCanvas.rotation.y = Math.PI / 2;
  root.add(vipArtFrame, vipArtCanvas);

  // Indoor decorative potted plant in corner of VIP Room
  const plantPot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.15, 0.36, 12),
    new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.6 }),
  );
  plantPot.position.set(-9.35, 0.18, 0.38);
  const plantFoliage = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.32, 1),
    new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.75 }),
  );
  plantFoliage.position.set(-9.35, 0.64, 0.38);
  root.add(plantPot, plantFoliage);

  // Helper for formal leather armchair (Ghế đơn bọc da)
  const buildLeatherArmchair = (x: number, z: number, rotY: number) => {
    const chair = new THREE.Group();
    chair.position.set(x, 0, z);
    chair.rotation.y = rotY;
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.34, 0.74), leatherMat);
    base.position.y = 0.22;
    base.castShadow = true;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.52, 0.16), leatherMat);
    back.position.set(0, 0.56, -0.29);
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.74), leatherTrimMat);
    armL.position.set(-0.34, 0.38, 0);
    const armR = armL.clone();
    armR.position.x = 0.34;
    chair.add(base, back, armL, armR);
    return chair;
  };

  // Leather 3-seater Sofa + 2 Leather Armchairs inside VIP Reception Room
  const vipSofa = new THREE.Group();
  vipSofa.position.set(-7.35, 0, 0.28);
  vipSofa.rotation.y = Math.PI;
  const vsSeat = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.38, 0.78), leatherMat);
  vsSeat.position.y = 0.24;
  vsSeat.castShadow = true;
  const vsBack = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.54, 0.18), leatherMat);
  vsBack.position.set(0, 0.56, -0.3);
  const vsArmL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.34, 0.78), leatherTrimMat);
  vsArmL.position.set(-0.96, 0.4, 0);
  const vsArmR = vsArmL.clone();
  vsArmR.position.x = 0.96;
  vipSofa.add(vsSeat, vsBack, vsArmL, vsArmR);
  root.add(vipSofa);
  physics.addBoxCollider('vip_sofa', -7.35, 0.28, 2.1, 0.85, 1.0);

  const vipArmchairL = buildLeatherArmchair(-9.05, -1.12, Math.PI / 2);
  root.add(vipArmchairL);
  tagInteractable(vipArmchairL, {
    id: 'vip_seat',
    type: 'vip_seat',
    label: 'Ghế bọc da Phòng Tiếp Khách',
    sublabel: 'Ngồi tiếp đối tác & ký hợp đồng',
  });
  interactables.push(vipArmchairL);
  physics.addBoxCollider('vip_armchair_l', -9.05, -1.12, 0.82, 0.82, 0.9);

  root.add(buildLeatherArmchair(-5.65, -1.12, -Math.PI / 2));
  physics.addBoxCollider('vip_armchair_r', -5.65, -1.12, 0.82, 0.82, 0.9);

  // Formal VIP Coffee Table with Porcelain Coffee Cups & Contract Signing Folio (Tách cà phê & Hồ sơ ký HĐ)
  const vipTable = new THREE.Group();
  vipTable.position.set(-7.35, 0, -1.12);
  const vtTop = new THREE.Mesh(
    new THREE.BoxGeometry(1.45, 0.06, 0.76),
    new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.2, metalness: 0.08 }),
  );
  vtTop.position.y = 0.46;
  vtTop.castShadow = true;
  const vtRim = new THREE.Mesh(new THREE.BoxGeometry(1.49, 0.04, 0.8), walnutMat);
  vtRim.position.y = 0.43;
  [
    [-0.62, -0.28],
    [0.62, -0.28],
    [-0.62, 0.28],
    [0.62, 0.28],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.022, 0.42, 8), walnutMat);
    leg.position.set(lx, 0.21, lz);
    vipTable.add(leg);
  });

  // Serving Tray + Coffee Pot + 3 Coffee Cups on Saucers
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.02, 0.34), walnutMat);
  tray.position.set(0.24, 0.5, -0.02);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.14, 12), porcelainMat);
  pot.position.set(0.08, 0.58, -0.02);
  vipTable.add(vtTop, vtRim, tray, pot);

  [
    [0.25, -0.08],
    [0.41, -0.04],
    [0.31, 0.08],
  ].forEach(([cx, cz]) => {
    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.042, 0.01, 12), porcelainMat);
    saucer.position.set(cx, 0.515, cz);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.026, 0.055, 12), porcelainMat);
    cup.position.set(cx, 0.545, cz);
    const brew = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.005, 12), coffeeLiquidMat);
    brew.position.set(cx, 0.57, cz);
    vipTable.add(saucer, cup, brew);
  });

  // Formal Contract Folder + Contract Pages + Gold Signing Pen on Left Side of Table
  const contractFolder = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.014, 0.36),
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.45 }),
  );
  contractFolder.position.set(-0.32, 0.497, 0.02);
  contractFolder.rotation.y = 0.08;
  const contractPaper = new THREE.Mesh(
    new THREE.BoxGeometry(0.23, 0.006, 0.31),
    new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.8 }),
  );
  contractPaper.position.set(-0.31, 0.507, 0.02);
  contractPaper.rotation.y = 0.04;
  const goldPen = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.005, 0.15, 8),
    new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.85, roughness: 0.2 }),
  );
  goldPen.rotation.z = Math.PI / 2;
  goldPen.rotation.y = 0.45;
  goldPen.position.set(-0.24, 0.515, 0.12);
  vipTable.add(contractFolder, contractPaper, goldPen);

  const vipTableSign = buildRoomSignPlaque('BÀN TIẾP KHÁCH VIP', 'KÝ HỢP ĐỒNG & CÀ PHÊ', textures, 0.66, 0.14, '#f59e0b');
  vipTableSign.position.set(-0.42, 0.56, -0.24);
  vipTableSign.rotation.y = 0.22;
  vipTable.add(vipTableSign);
  root.add(vipTable);
  tagInteractable(vipTable, {
    id: 'vip_table',
    type: 'vip_table',
    label: 'Bàn Tiếp Khách & Hợp Đồng',
    sublabel: 'Tiếp đón đối tác, mời cà phê & ký hợp đồng',
  });
  interactables.push(vipTable);
  physics.addBoxCollider('vip_coffee_table', -7.35, -1.12, 1.5, 0.8, 0.6);

  // --- ZONE 6: ASSISTANT OFFICE WORKSTATION (Windows 11 PC facing INWARD toward Assistant!) ---
  const astDesk = new THREE.Group();
  astDesk.position.set(-1.1, 0, -0.9);
  const astTop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.78), oakMat);
  astTop.position.y = 0.75;
  const astBase = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.72, 0.68), accentWallMat);
  astBase.position.y = 0.36;

  // Assistant sits at Z = -1.75 looking +Z toward desk -> Windows PC sits at local +Z facing -Z!
  const astPc = buildWindowsDesktopPC(textures.windowsScreen, darkMetalMat, metalMat, true);
  astPc.position.set(-0.08, 0.78, 0.15);

  const astSign = buildRoomSignPlaque('BÀN TRỢ LÝ', 'ĐIỀU PHỐI & ĐÓN ĐỐI TÁC', textures, 0.72, 0.18, '#38bdf8');
  astSign.position.set(0.45, 0.88, 0.28);
  astDesk.add(astTop, astBase, astPc, astSign);
  root.add(astDesk);
  tagInteractable(astPc, {
    id: 'assistant_pc',
    type: 'assistant_pc',
    label: 'Máy tính Windows Trợ lý',
    sublabel: 'Mở Windows điều phối & báo cáo kho',
  });
  interactables.push(astPc);
  physics.addBoxCollider('assistant_desk', -1.1, -0.9, 1.65, 0.82, 1.1);

  const astChair = buildCompositeChair('#1e293b', metalMat);
  astChair.position.set(-1.1, 0, -1.75);
  root.add(astChair);

  // --- ZONE 6B: ONLINE CUSTOMER CARE WORKSTATION INSIDE TECH LAB (BÀN CSKH CHUYỂN VÀO PHÒNG KỸ THUẬT) ---
  const onlineCsDesk = new THREE.Group();
  onlineCsDesk.position.set(6.35, 0, 1.15);
  const ocsTop = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.06, 0.68), oakMat);
  ocsTop.position.y = 0.75;
  ocsTop.castShadow = true;
  const ocsBase = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.72, 0.58), accentWallMat);
  ocsBase.position.y = 0.36;

  // CSKH Online sits at (6.35, 0, 0.32) looking +Z toward desk -> Windows PC faces -Z!
  const ocsPc = buildWindowsDesktopPC(textures.windowsScreen, darkMetalMat, metalMat, true);
  ocsPc.position.set(-0.1, 0.78, 0.14);

  const ocsSign = buildRoomSignPlaque('BÀN CSKH ONLINE', 'DUYỆT ĐƠN · CHUYỂN KHO ĐÓNG GÓI', textures, 0.78, 0.17, '#818cf8');
  ocsSign.position.set(0.28, 0.88, 0.25);
  onlineCsDesk.add(ocsTop, ocsBase, ocsPc, ocsSign);
  root.add(onlineCsDesk);
  tagInteractable(onlineCsDesk, {
    id: 'online_cs_desk',
    type: 'online_cs_desk',
    label: 'Máy tính Windows CSKH Online',
    sublabel: 'Duyệt đơn online & chuyển bộ phận kho đóng gói',
  });
  interactables.push(onlineCsDesk);
  physics.addBoxCollider('online_cs_desk', 6.35, 1.15, 1.35, 0.72, 1.1);

  const onlineCsChair = buildCompositeChair('#4338ca', metalMat);
  onlineCsChair.position.set(6.35, 0, 0.32);
  root.add(onlineCsChair);

  // Ceiling LED panels + PointLights
  const lightPositions: [number, number][] = [
    [-4.5, 3.2],
    [3.5, 3.2],
    [-6.2, -6.2],
    [-7.35, -0.8],
    [6.8, -5.0],
  ];
  lightPositions.forEach(([lx, lz]) => {
    const fixture = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.06, 0.6),
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        emissive: '#fffbeb',
        emissiveIntensity: 0.9,
      }),
    );
    fixture.position.set(lx, 3.74, lz);
    emissivePanels.push(fixture.material);
    root.add(fixture);

    const pt = new THREE.PointLight('#fff7ed', 3.8, 16, 1.35);
    pt.position.set(lx, 3.45, lz);
    interiorLights.push(pt);
    root.add(pt);
  });

  // CCTV Security Cameras
  const makeCam = (pos: [number, number, number], target: [number, number, number]) => {
    const cam = new THREE.PerspectiveCamera(62, 16 / 9, 0.1, 60);
    cam.position.set(...pos);
    cam.lookAt(...target);
    return cam;
  };
  const cctvCameras = {
    showroom: makeCam([-9.2, 3.3, 7.2], [0, 1.0, 2.0]),
    cashier: makeCam([9.2, 3.2, 7.2], [6.8, 1.0, 4.0]),
    tech: makeCam([9.2, 3.2, -0.5], [7.2, 1.0, -4.8]),
    warehouse: makeCam([3.8, 3.3, -3.2], [0.5, 1.0, -8.2]),
    entrance: makeCam([3.5, 3.3, 7.4], [0, 1.2, 9.5]),
  };

  const setDoorState = (open: boolean) => {
    physics.setColliderEnabled('entrance_door', !open);
    gsap.to(doorLeft.position, { x: open ? -1.72 : -0.6, duration: 0.55, ease: 'power2.out' });
    gsap.to(doorRight.position, { x: open ? 1.72 : 0.6, duration: 0.55, ease: 'power2.out' });
  };

  const setDirectorDoorState = (open: boolean) => {
    physics.setColliderEnabled('director_door', !open);
    gsap.to(directorDoor.position, { x: open ? -5.28 : -3.45, duration: 0.55, ease: 'power2.out' });
  };

  const setLightsState = (on: boolean) => {
    interiorLights.forEach((l) => {
      l.intensity = on ? 3.8 : 0.35;
    });
    emissivePanels.forEach((m) => {
      m.emissiveIntensity = on ? 0.9 : 0.08;
    });
  };

  return {
    root,
    interactables,
    interiorLights,
    emissivePanels,
    doorLeft,
    doorRight,
    directorDoor,
    directorChairSeatPos: new THREE.Vector3(-6.5, 1.38, -7.45),
    directorChairLookTarget: new THREE.Vector3(-6.5, 1.25, -4.5),
    vipChairSeatPos: new THREE.Vector3(-8.92, 1.24, -1.12),
    vipChairLookTarget: new THREE.Vector3(-7.35, 1.15, -0.35),
    cafeSeatPos: new THREE.Vector3(-6.4, 1.28, 10.6),
    cafeLookTarget: new THREE.Vector3(-6.4, 1.05, 14.5),
    setDoorState,
    setDirectorDoorState,
    setLightsState,
    cctvCameras,
  };
}
