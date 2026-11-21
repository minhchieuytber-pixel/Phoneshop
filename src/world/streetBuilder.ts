import * as THREE from 'three';
import type { InteractableTarget } from '../core/types';
import type { PhysicsWorld } from './physicsWorld';
import type { ProceduralTextures } from './textures';

export interface StreetVehicle {
  mesh: THREE.Group;
  speed: number;
  laneZ: number;
  dir: 1 | -1;
}

export interface StreetHandles {
  root: THREE.Group;
  vehicles: StreetVehicle[];
  streetLamps: THREE.PointLight[];
  asphaltMat: THREE.MeshStandardMaterial;
  updateTraffic: (dt: number) => void;
}

function buildCompositeMotorbike(color: string): THREE.Group {
  const bike = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.28, metalness: 0.55 });
  const darkMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.65 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: '#e4e4e7', metalness: 0.9, roughness: 0.15 });

  // Wheels
  const wheelGeo = new THREE.TorusGeometry(0.24, 0.065, 8, 18);
  const fWheel = new THREE.Mesh(wheelGeo, darkMat);
  fWheel.position.set(0.58, 0.3, 0);
  const rWheel = new THREE.Mesh(wheelGeo, darkMat);
  rWheel.position.set(-0.56, 0.3, 0);

  // Chassis + Fairing
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.32, 0.34), bodyMat);
  chassis.position.set(0, 0.52, 0);
  chassis.castShadow = true;
  const frontShield = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.62, 0.38), bodyMat);
  frontShield.position.set(0.46, 0.72, 0);
  frontShield.rotation.z = 0.25;

  // Seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.1, 0.3), darkMat);
  seat.position.set(-0.18, 0.72, 0);

  // Handlebar & Headlight
  const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.58, 8), chromeMat);
  handlebar.rotation.x = Math.PI / 2;
  handlebar.position.set(0.42, 1.02, 0);

  const headlight = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 10, 10),
    new THREE.MeshStandardMaterial({ color: '#fef9c3', emissive: '#fef08a', emissiveIntensity: 0.75 }),
  );
  headlight.position.set(0.58, 0.86, 0);

  bike.add(fWheel, rWheel, chassis, frontShield, seat, handlebar, headlight);
  return bike;
}

function buildCompositeCar(color: string): THREE.Group {
  const car = new THREE.Group();
  const paintMat = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.22,
    metalness: 0.6,
    clearcoat: 0.9,
  });
  const darkMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.6 });
  const glassMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.1, metalness: 0.5 });

  const lower = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.72, 1.65), paintMat);
  lower.position.y = 0.58;
  lower.castShadow = true;

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.6, 1.44), glassMat);
  cabin.position.set(-0.15, 1.18, 0);

  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16);
  wheelGeo.rotateX(Math.PI / 2);
  [
    [1.15, 0.32, 0.82],
    [1.15, 0.32, -0.82],
    [-1.15, 0.32, 0.82],
    [-1.15, 0.32, -0.82],
  ].forEach(([wx, wy, wz]) => {
    const w = new THREE.Mesh(wheelGeo, darkMat);
    w.position.set(wx, wy, wz);
    car.add(w);
  });

  const headL = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.14, 0.28),
    new THREE.MeshStandardMaterial({ color: '#fffbeb', emissive: '#fef3c7', emissiveIntensity: 0.9 }),
  );
  headL.position.set(1.9, 0.65, 0.56);
  const headR = headL.clone();
  headR.position.z = -0.56;

  car.add(lower, cabin, headL, headR);
  return car;
}

function buildTree(x: number, z: number, seed: number): THREE.Group {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.2, 2.4, 10),
    new THREE.MeshStandardMaterial({ color: '#5c4033', roughness: 0.92 }),
  );
  trunk.position.y = 1.2;
  trunk.castShadow = true;
  tree.add(trunk);

  const leafColors = ['#15803d', '#166534', '#22c55e'];
  for (let i = 0; i < 4; i++) {
    const puff = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.85 + (i % 2) * 0.2, 1),
      new THREE.MeshStandardMaterial({
        color: leafColors[(seed + i) % leafColors.length],
        roughness: 0.85,
      }),
    );
    puff.position.set(Math.sin(i * 1.7 + seed) * 0.55, 2.7 + (i % 2) * 0.45, Math.cos(i * 1.9 + seed) * 0.55);
    puff.castShadow = true;
    tree.add(puff);
  }
  return tree;
}

export function buildVietnameseStreet(
  textures: ProceduralTextures,
  physics: PhysicsWorld,
  interactables: THREE.Object3D[],
): StreetHandles {
  const root = new THREE.Group();
  const streetLamps: THREE.PointLight[] = [];
  const vehicles: StreetVehicle[] = [];

  // Ground horizon base extending well beyond playable bounds
  const groundBase = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 160),
    new THREE.MeshStandardMaterial({ color: '#374151', roughness: 0.95 }),
  );
  groundBase.rotation.x = -Math.PI / 2;
  groundBase.position.y = -0.02;
  groundBase.receiveShadow = true;
  root.add(groundBase);

  // Vietnamese Sidewalk (vỉa hè) Z: [8, 12.2]
  const sidewalk = new THREE.Mesh(
    new THREE.BoxGeometry(64, 0.12, 4.4),
    new THREE.MeshStandardMaterial({ map: textures.sidewalkTile, roughness: 0.82 }),
  );
  sidewalk.position.set(0, -0.05, 10.2);
  sidewalk.receiveShadow = true;
  root.add(sidewalk);

  // Asphalt Road Z: [12.4, 21.4]
  const asphaltMat = new THREE.MeshStandardMaterial({
    map: textures.asphalt,
    roughness: 0.78,
    metalness: 0.05,
  });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(80, 9.2), asphaltMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.0, 16.9);
  road.receiveShadow = true;
  root.add(road);

  // Far sidewalk across street Z: [21.5, 26]
  const farSidewalk = new THREE.Mesh(
    new THREE.BoxGeometry(80, 0.14, 5),
    new THREE.MeshStandardMaterial({ map: textures.sidewalkTile, roughness: 0.85 }),
  );
  farSidewalk.position.set(0, -0.04, 24);
  root.add(farSidewalk);

  // Neighboring Shopfronts left & right of our store + across the street
  const shopColors = ['#cbd5e1', '#e2d5c3', '#d1fae5', '#e0f2fe', '#fef3c7'];
  const buildNeighbor = (x: number, z: number, w: number, h: number, d: number, colIdx: number) => {
    const b = new THREE.Group();
    b.position.set(x, 0, z);
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color: shopColors[colIdx % shopColors.length], roughness: 0.8 }),
    );
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.9, 0.25, 1.1),
      new THREE.MeshStandardMaterial({ color: colIdx % 2 === 0 ? '#0f766e' : '#b45309', roughness: 0.7 }),
    );
    awning.position.set(0, 2.8, d / 2 + 0.5);
    awning.rotation.x = 0.18;
    b.add(body, awning);
    root.add(b);
  };

  buildNeighbor(-15.5, -1, 10.5, 7.5, 18, 0);
  buildNeighbor(15.5, -1, 10.5, 8.2, 18, 1);
  // Across the street buildings
  [-18, -6, 6, 18].forEach((bx, idx) => {
    const b = new THREE.Mesh(
      new THREE.BoxGeometry(10.8, 7 + (idx % 3) * 2.5, 8),
      new THREE.MeshStandardMaterial({ color: shopColors[(idx + 2) % shopColors.length], roughness: 0.85 }),
    );
    b.position.set(bx, (7 + (idx % 3) * 2.5) / 2, 29);
    root.add(b);
  });

  // Outdoor Sidewalk Café Table (Interactable: Drink coffee & relax!)
  const cafeGroup = new THREE.Group();
  cafeGroup.position.set(-6.4, 0, 10.1);
  const cTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, 0.04, 18),
    new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.5 }),
  );
  cTop.position.y = 0.72;
  const cLeg = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.22, 0.72, 12),
    new THREE.MeshStandardMaterial({ color: '#1f2937', metalness: 0.7, roughness: 0.3 }),
  );
  cLeg.position.y = 0.36;
  // Vietnamese Iced Coffee glass (Cà phê sữa đá)
  const coffeeGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.036, 0.13, 12),
    new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.2 }),
  );
  coffeeGlass.position.set(0.1, 0.8, 0.05);
  const straw = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.005, 0.16, 6),
    new THREE.MeshStandardMaterial({ color: '#f8fafc' }),
  );
  straw.position.set(0.11, 0.85, 0.05);
  straw.rotation.z = 0.2;
  // Small café chairs
  const chair1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.44, 0.4),
    new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.7 }),
  );
  chair1.position.set(0, 0.22, 0.65);
  cafeGroup.add(cTop, cLeg, coffeeGlass, straw, chair1);
  root.add(cafeGroup);
  tagInteractableObj(cafeGroup, {
    id: 'cafe_table',
    type: 'cafe_table',
    label: 'Bàn cà phê vỉa hè',
    sublabel: 'Ngồi uống cà phê & quan sát phố',
  });
  interactables.push(cafeGroup);
  physics.addBoxCollider('cafe_table', -6.4, 10.1, 1.0, 1.0, 1);

  // Parked Customer Motorbikes on sidewalk
  const parkedColors = ['#dc2626', '#1d4ed8', '#f8fafc', '#0f766e'];
  [-3.8, -2.6, 3.8, 5.1].forEach((mx, i) => {
    const bike = buildCompositeMotorbike(parkedColors[i % parkedColors.length]);
    bike.position.set(mx, 0, 11.1);
    bike.rotation.y = Math.PI * 0.42;
    root.add(bike);
    physics.addBoxCollider(`parked_bike_${i}`, mx, 11.1, 0.9, 1.5, 1.2);
  });

  // Tropical Street Trees & Street Lamps
  [-12, -8.5, 8.5, 13].forEach((tx, idx) => {
    root.add(buildTree(tx, 11.5, idx));
  });

  [-9, 0, 9].forEach((lx) => {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.09, 4.6, 10),
      new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.7, roughness: 0.35 }),
    );
    pole.position.set(lx, 2.3, 12.1);
    const bulb = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.1, 0.24),
      new THREE.MeshStandardMaterial({ color: '#fef3c7', emissive: '#fde68a', emissiveIntensity: 0.8 }),
    );
    bulb.position.set(lx, 4.55, 12.35);
    const pt = new THREE.PointLight('#fde68a', 0.2, 16, 1.5);
    pt.position.set(lx, 4.3, 12.6);
    streetLamps.push(pt);
    root.add(pole, bulb, pt);
  });

  // Dynamic Traffic (Motorbikes & Cars driving smoothly on road)
  const bikeColors = ['#ef4444', '#2563eb', '#10b981', '#f59e0b', '#e2e8f0'];
  for (let i = 0; i < 6; i++) {
    const isCar = i % 3 === 0;
    const dir: 1 | -1 = i % 2 === 0 ? 1 : -1;
    const mesh = isCar
      ? buildCompositeCar(i === 0 ? '#e2e8f0' : '#1e293b')
      : buildCompositeMotorbike(bikeColors[i % bikeColors.length]);
    const laneZ = dir === 1 ? 14.6 : 19.0;
    mesh.position.set(-28 + i * 11, 0, laneZ);
    mesh.rotation.y = dir === 1 ? 0 : Math.PI;
    root.add(mesh);
    vehicles.push({
      mesh,
      speed: (isCar ? 7.5 : 6.2) + (i % 3) * 1.1,
      laneZ,
      dir,
    });
  }

  const updateTraffic = (dt: number) => {
    for (const v of vehicles) {
      v.mesh.position.x += v.dir * v.speed * dt;
      if (v.dir === 1 && v.mesh.position.x > 34) v.mesh.position.x = -34;
      if (v.dir === -1 && v.mesh.position.x < -34) v.mesh.position.x = 34;
    }
  };

  return { root, vehicles, streetLamps, asphaltMat, updateTraffic };
}

function tagInteractableObj(obj: THREE.Object3D, data: InteractableTarget): void {
  obj.traverse((child) => {
    child.userData.interactable = data;
  });
}
