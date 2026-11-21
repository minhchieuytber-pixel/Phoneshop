import * as THREE from 'three';
import type { HairStyle, OutfitStyle } from '../core/types';

export type CharacterAnimState =
  | 'idle'
  | 'walk'
  | 'work'
  | 'sit'
  | 'sit_work'
  | 'pc_sit'
  | 'pc_stand'
  | 'talk_customer'
  | 'listen_customer';

export interface ArticulatedCharacter {
  group: THREE.Group;
  mixer: THREE.AnimationMixer;
  actions: Record<CharacterAnimState, THREE.AnimationAction>;
  currentAction: CharacterAnimState;
  carriedParcel: THREE.Group;
  heldDevice: THREE.Group;
  setAnimation: (name: CharacterAnimState) => void;
}

export interface CharacterStyle {
  shirtColor: string;
  pantsColor?: string;
  skinColor: string;
  hairColor: string;
  hairStyle?: HairStyle;
  outfitStyle?: OutfitStyle;
  hasGlasses?: boolean;
  heightScale?: number;
  isAssistant?: boolean;
  isFormal?: boolean;
  hasBadge?: boolean;
  contactShadowTex?: THREE.Texture;
}

function buildHairMesh(style: HairStyle, hairMat: THREE.Material): THREE.Group {
  const hair = new THREE.Group();
  const baseCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.132, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.56),
    hairMat,
  );
  baseCap.position.set(0, 0.125, -0.01);
  baseCap.rotation.x = -0.15;
  hair.add(baseCap);

  if (style === 'side_part') {
    const quiff = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.12), hairMat);
    quiff.position.set(0.02, 0.22, 0.05);
    quiff.rotation.z = -0.18;
    hair.add(quiff);
  } else if (style === 'long') {
    const backCascade = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.34, 0.12), hairMat);
    backCascade.position.set(0, 0.01, -0.09);
    const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.26, 0.08), hairMat);
    sideL.position.set(-0.115, 0.04, 0.01);
    const sideR = sideL.clone();
    sideR.position.x = 0.115;
    hair.add(backCascade, sideL, sideR);
  } else if (style === 'ponytail') {
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), hairMat);
    bun.position.set(0, 0.14, -0.14);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 10), hairMat);
    tail.position.set(0, 0.03, -0.16);
    tail.rotation.x = Math.PI + 0.2;
    hair.add(bun, tail);
  } else if (style === 'bob') {
    const bobBack = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.145, 0.18, 12, 1, false, Math.PI * 0.65, Math.PI * 1.7), hairMat);
    bobBack.position.set(0, 0.08, -0.02);
    hair.add(bobBack);
  } else if (style === 'curly') {
    for (let i = 0; i < 6; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), hairMat);
      const ang = (i / 6) * Math.PI * 2;
      puff.position.set(Math.cos(ang) * 0.08, 0.2 + (i % 2) * 0.03, Math.sin(ang) * 0.07 - 0.01);
      hair.add(puff);
    }
  }
  return hair;
}

export function buildArticulatedCharacter(style: CharacterStyle): ArticulatedCharacter {
  const root = new THREE.Group();
  const hScale = style.heightScale ?? 1.0;
  root.scale.set(hScale, hScale, hScale);

  if (style.contactShadowTex) {
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.9),
      new THREE.MeshBasicMaterial({
        map: style.contactShadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.45,
      }),
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.015;
    root.add(shadowPlane);
  }

  const outfit: OutfitStyle = style.isFormal ? 'formal' : style.outfitStyle ?? 'tshirt';
  const skinMat = new THREE.MeshStandardMaterial({ color: style.skinColor, roughness: 0.65 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: style.shirtColor, roughness: 0.72 });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: style.pantsColor ?? '#1e293b',
    roughness: 0.8,
  });
  const shoeMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.5, metalness: 0.1 });
  const hairMat = new THREE.MeshStandardMaterial({ color: style.hairColor, roughness: 0.75 });

  // Hip / Pelvis root
  const hips = new THREE.Group();
  hips.name = 'Hips';
  hips.position.y = 0.86;
  root.add(hips);

  const pelvisMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.2), pantsMat);
  pelvisMesh.castShadow = true;
  hips.add(pelvisMesh);

  // Left & Right Jointed Legs (Thigh + Knee Pivot -> Calf + Shoe) for natural bent-knee sitting
  const thighGeo = new THREE.CapsuleGeometry(0.068, 0.25, 4, 10);
  const calfGeo = new THREE.CapsuleGeometry(0.058, 0.24, 4, 10);
  const shoeGeo = new THREE.BoxGeometry(0.11, 0.08, 0.22);

  const buildJointedLeg = (side: 'Left' | 'Right', offsetX: number) => {
    const leg = new THREE.Group();
    leg.name = `${side}Leg`;
    leg.position.set(offsetX, -0.05, 0);
    hips.add(leg);

    const thighMesh = new THREE.Mesh(thighGeo, pantsMat);
    thighMesh.position.y = -0.18;
    thighMesh.castShadow = true;
    leg.add(thighMesh);

    const knee = new THREE.Group();
    knee.name = `${side}Knee`;
    knee.position.set(0, -0.36, 0);
    leg.add(knee);

    const calfMesh = new THREE.Mesh(calfGeo, pantsMat);
    calfMesh.position.y = -0.18;
    calfMesh.castShadow = true;

    const shoe = new THREE.Mesh(shoeGeo, shoeMat);
    shoe.position.set(0, -0.4, 0.04);
    shoe.castShadow = true;
    knee.add(calfMesh, shoe);
  };

  buildJointedLeg('Left', -0.09);
  buildJointedLeg('Right', 0.09);

  // Torso
  const torso = new THREE.Group();
  torso.name = 'Torso';
  torso.position.y = 0.08;
  hips.add(torso);

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.46, 0.22), shirtMat);
  chest.position.y = 0.24;
  chest.castShadow = true;
  torso.add(chest);

  // Outfit Variations
  if (outfit === 'jacket') {
    const jacketMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.65 });
    const panelL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.46, 0.245), jacketMat);
    panelL.position.set(-0.135, 0.24, 0);
    const panelR = panelL.clone();
    panelR.position.x = 0.135;
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.24), jacketMat);
    collar.position.set(0, 0.46, -0.02);
    torso.add(panelL, panelR, collar);
  } else if (outfit === 'hoodie') {
    const hood = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.14), shirtMat);
    hood.position.set(0, 0.46, -0.09);
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.14, 0.03), shirtMat);
    pocket.position.set(0, 0.11, 0.12);
    torso.add(hood, pocket);
  } else if (outfit === 'polo') {
    const collar = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.05, 0.18),
      new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.6 }),
    );
    collar.position.set(0, 0.46, 0.02);
    torso.add(collar);
  }

  if (style.isAssistant || outfit === 'formal') {
    const tie = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.26, 0.02),
      new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.4 }),
    );
    tie.position.set(0, 0.26, 0.115);
    torso.add(tie);
  }

  if (style.hasBadge) {
    const badge = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.04, 0.015),
      new THREE.MeshStandardMaterial({ color: '#f8fafc', metalness: 0.4, roughness: 0.3 }),
    );
    badge.position.set(0.1, 0.34, 0.115);
    torso.add(badge);
  }

  // Head
  const headGroup = new THREE.Group();
  headGroup.name = 'Head';
  headGroup.position.y = 0.54;
  torso.add(headGroup);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.08, 10), skinMat);
  neck.position.y = -0.02;
  headGroup.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 14), skinMat);
  head.position.y = 0.11;
  head.scale.set(0.92, 1.05, 0.96);
  head.castShadow = true;
  headGroup.add(head);

  // Varied Hairstyle
  const hairMesh = buildHairMesh(style.hairStyle ?? 'short', hairMat);
  headGroup.add(hairMesh);

  // Eyes
  const eyeMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.2 });
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), eyeMat);
  leftEye.position.set(-0.042, 0.12, 0.11);
  const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), eyeMat);
  rightEye.position.set(0.042, 0.12, 0.11);
  headGroup.add(leftEye, rightEye);

  // Optional Glasses
  if (style.hasGlasses) {
    const frameMat = new THREE.MeshStandardMaterial({ color: '#18181b', metalness: 0.8, roughness: 0.2 });
    const gL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.032, 0.01), frameMat);
    gL.position.set(-0.042, 0.125, 0.124);
    const gR = gL.clone();
    gR.position.x = 0.042;
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.008, 0.01), frameMat);
    bridge.position.set(0, 0.128, 0.124);
    headGroup.add(gL, gR, bridge);
  }

  // Arms
  const sleeveMat = outfit === 'jacket' ? new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.65 }) : shirtMat;
  const armGeo = new THREE.CapsuleGeometry(0.05, 0.38, 4, 8);
  const handGeo = new THREE.SphereGeometry(0.045, 8, 8);

  const leftArm = new THREE.Group();
  leftArm.name = 'LeftArm';
  leftArm.position.set(-0.24, 0.43, 0);
  torso.add(leftArm);
  const leftArmMesh = new THREE.Mesh(armGeo, sleeveMat);
  leftArmMesh.position.y = -0.22;
  leftArmMesh.castShadow = true;
  const leftHand = new THREE.Mesh(handGeo, skinMat);
  leftHand.position.y = -0.46;
  leftArm.add(leftArmMesh, leftHand);

  const rightArm = new THREE.Group();
  rightArm.name = 'RightArm';
  rightArm.position.set(0.24, 0.43, 0);
  torso.add(rightArm);
  const rightArmMesh = new THREE.Mesh(armGeo, sleeveMat);
  rightArmMesh.position.y = -0.22;
  rightArmMesh.castShadow = true;
  const rightHand = new THREE.Mesh(handGeo, skinMat);
  rightHand.position.y = -0.46;
  rightArm.add(rightArmMesh, rightHand);

  // Held Smartphone Prop (visible during customer sales consultation / trade-in inspection)
  const heldDevice = new THREE.Group();
  heldDevice.name = 'HeldDevice';
  heldDevice.position.set(0, -0.49, 0.055);
  heldDevice.rotation.set(-0.35, 0, 0);
  const devBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.068, 0.012, 0.135),
    new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.75, roughness: 0.25 }),
  );
  const devScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.06, 0.125),
    new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#0284c7', emissiveIntensity: 0.55 }),
  );
  devScreen.position.y = 0.007;
  devScreen.rotation.x = -Math.PI / 2;
  heldDevice.add(devBody, devScreen);
  heldDevice.visible = false;
  rightArm.add(heldDevice);

  // Composite Carried Parcel Box (shown when Shipping Staff is delivering online orders)
  const carriedParcel = new THREE.Group();
  carriedParcel.name = 'CarriedParcel';
  carriedParcel.position.set(0, 0.14, 0.28);
  const parcelBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.22, 0.26),
    new THREE.MeshStandardMaterial({ color: '#c28c53', roughness: 0.78 }),
  );
  parcelBox.castShadow = true;
  const parcelTape = new THREE.Mesh(
    new THREE.BoxGeometry(0.325, 0.04, 0.06),
    new THREE.MeshStandardMaterial({ color: '#fde68a', roughness: 0.45 }),
  );
  parcelTape.position.y = 0.095;
  const parcelLabel = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.09, 0.01),
    new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4 }),
  );
  parcelLabel.position.set(0.04, 0.02, 0.132);
  carriedParcel.add(parcelBox, parcelTape, parcelLabel);
  carriedParcel.visible = false;
  torso.add(carriedParcel);

  // AnimationClips
  const mixer = new THREE.AnimationMixer(root);

  const idleClip = new THREE.AnimationClip('Idle', 2.4, [
    new THREE.NumberKeyframeTrack('Hips/Torso.position[y]', [0, 1.2, 2.4], [0.08, 0.095, 0.08]),
    new THREE.NumberKeyframeTrack('Hips/Torso/LeftArm.rotation[x]', [0, 1.2, 2.4], [0.04, -0.03, 0.04]),
    new THREE.NumberKeyframeTrack('Hips/Torso/RightArm.rotation[x]', [0, 1.2, 2.4], [-0.03, 0.04, -0.03]),
    new THREE.NumberKeyframeTrack('Hips/Torso/Head.rotation[y]', [0, 1.2, 2.4], [-0.06, 0.06, -0.06]),
  ]);

  const walkClip = new THREE.AnimationClip('Walk', 0.9, [
    new THREE.NumberKeyframeTrack('Hips.position[y]', [0, 0.225, 0.45, 0.675, 0.9], [0.86, 0.89, 0.86, 0.89, 0.86]),
    new THREE.NumberKeyframeTrack('Hips/LeftLeg.rotation[x]', [0, 0.225, 0.45, 0.675, 0.9], [0.42, 0, -0.42, 0, 0.42]),
    new THREE.NumberKeyframeTrack('Hips/LeftLeg/LeftKnee.rotation[x]', [0, 0.225, 0.45, 0.675, 0.9], [0.08, 0.36, 0.06, 0.14, 0.08]),
    new THREE.NumberKeyframeTrack('Hips/RightLeg.rotation[x]', [0, 0.225, 0.45, 0.675, 0.9], [-0.42, 0, 0.42, 0, -0.42]),
    new THREE.NumberKeyframeTrack('Hips/RightLeg/RightKnee.rotation[x]', [0, 0.225, 0.45, 0.675, 0.9], [0.06, 0.14, 0.08, 0.36, 0.06]),
    new THREE.NumberKeyframeTrack('Hips/Torso/LeftArm.rotation[x]', [0, 0.225, 0.45, 0.675, 0.9], [-0.35, 0, 0.35, 0, -0.35]),
    new THREE.NumberKeyframeTrack('Hips/Torso/RightArm.rotation[x]', [0, 0.225, 0.45, 0.675, 0.9], [0.35, 0, -0.35, 0, 0.35]),
  ]);

  const workClip = new THREE.AnimationClip('Work', 1.4, [
    new THREE.NumberKeyframeTrack('Hips/Torso/LeftArm.rotation[x]', [0, 0.7, 1.4], [-0.75, -0.95, -0.75]),
    new THREE.NumberKeyframeTrack('Hips/Torso/RightArm.rotation[x]', [0, 0.7, 1.4], [-0.95, -0.7, -0.95]),
    new THREE.NumberKeyframeTrack('Hips/Torso/Head.rotation[x]', [0, 0.7, 1.4], [0.12, 0.2, 0.12]),
  ]);

  const sitClip = new THREE.AnimationClip('Sit', 1.8, [
    new THREE.NumberKeyframeTrack('Hips.position[y]', [0, 1.8], [0.51, 0.51]),
    new THREE.NumberKeyframeTrack('Hips/LeftLeg.rotation[x]', [0, 1.8], [-1.5, -1.5]),
    new THREE.NumberKeyframeTrack('Hips/LeftLeg/LeftKnee.rotation[x]', [0, 1.8], [1.5, 1.5]),
    new THREE.NumberKeyframeTrack('Hips/RightLeg.rotation[x]', [0, 1.8], [-1.5, -1.5]),
    new THREE.NumberKeyframeTrack('Hips/RightLeg/RightKnee.rotation[x]', [0, 1.8], [1.5, 1.5]),
    new THREE.NumberKeyframeTrack('Hips/Torso/LeftArm.rotation[x]', [0, 0.9, 1.8], [-0.4, -0.48, -0.4]),
    new THREE.NumberKeyframeTrack('Hips/Torso/RightArm.rotation[x]', [0, 0.9, 1.8], [-0.46, -0.38, -0.46]),
    new THREE.NumberKeyframeTrack('Hips/Torso/Head.rotation[y]', [0, 0.9, 1.8], [-0.08, 0.08, -0.08]),
  ]);

  const sitWorkClip = new THREE.AnimationClip('SitWork', 1.4, [
    new THREE.NumberKeyframeTrack('Hips.position[y]', [0, 1.4], [0.51, 0.51]),
    new THREE.NumberKeyframeTrack('Hips/LeftLeg.rotation[x]', [0, 1.4], [-1.5, -1.5]),
    new THREE.NumberKeyframeTrack('Hips/LeftLeg/LeftKnee.rotation[x]', [0, 1.4], [1.5, 1.5]),
    new THREE.NumberKeyframeTrack('Hips/RightLeg.rotation[x]', [0, 1.4], [-1.5, -1.5]),
    new THREE.NumberKeyframeTrack('Hips/RightLeg/RightKnee.rotation[x]', [0, 1.4], [1.5, 1.5]),
    new THREE.NumberKeyframeTrack('Hips/Torso/LeftArm.rotation[x]', [0, 0.7, 1.4], [-0.72, -0.92, -0.72]),
    new THREE.NumberKeyframeTrack('Hips/Torso/RightArm.rotation[x]', [0, 0.7, 1.4], [-0.92, -0.68, -0.92]),
    new THREE.NumberKeyframeTrack('Hips/Torso/Head.rotation[x]', [0, 0.7, 1.4], [0.14, 0.24, 0.14]),
  ]);

  // Seated Windows PC interaction: leaning toward monitor, typing with left & right hands + mouse sweep
  const pcSitClip = new THREE.AnimationClip('SitPC', 1.6, [
    new THREE.NumberKeyframeTrack('Hips.position[y]', [0, 1.6], [0.51, 0.51]),
    new THREE.NumberKeyframeTrack('Hips/LeftLeg.rotation[x]', [0, 1.6], [-1.5, -1.5]),
    new THREE.NumberKeyframeTrack('Hips/LeftLeg/LeftKnee.rotation[x]', [0, 1.6], [1.5, 1.5]),
    new THREE.NumberKeyframeTrack('Hips/RightLeg.rotation[x]', [0, 1.6], [-1.5, -1.5]),
    new THREE.NumberKeyframeTrack('Hips/RightLeg/RightKnee.rotation[x]', [0, 1.6], [1.5, 1.5]),
    new THREE.NumberKeyframeTrack('Hips/Torso.rotation[x]', [0, 0.8, 1.6], [0.06, 0.09, 0.06]),
    new THREE.NumberKeyframeTrack('Hips/Torso/LeftArm.rotation[x]', [0, 0.35, 0.7, 1.1, 1.6], [-1.08, -1.24, -1.1, -1.22, -1.08]),
    new THREE.NumberKeyframeTrack('Hips/Torso/LeftArm.rotation[z]', [0, 0.8, 1.6], [0.14, 0.18, 0.14]),
    new THREE.NumberKeyframeTrack('Hips/Torso/RightArm.rotation[x]', [0, 0.4, 0.8, 1.2, 1.6], [-1.18, -1.04, -1.16, -1.06, -1.18]),
    new THREE.NumberKeyframeTrack('Hips/Torso/RightArm.rotation[y]', [0, 0.8, 1.6], [0.05, -0.14, 0.05]),
    new THREE.NumberKeyframeTrack('Hips/Torso/Head.rotation[x]', [0, 0.8, 1.6], [0.08, 0.14, 0.08]),
    new THREE.NumberKeyframeTrack('Hips/Torso/Head.rotation[y]', [0, 0.8, 1.6], [-0.07, 0.07, -0.07]),
  ]);

  // Standing Windows POS / Desktop PC interaction
  const pcStandClip = new THREE.AnimationClip('StandPC', 1.8, [
    new THREE.NumberKeyframeTrack('Hips/Torso.rotation[x]', [0, 0.9, 1.8], [0.04, 0.07, 0.04]),
    new THREE.NumberKeyframeTrack('Hips/Torso/LeftArm.rotation[x]', [0, 0.45, 0.9, 1.35, 1.8], [-0.92, -1.1, -0.95, -1.08, -0.92]),
    new THREE.NumberKeyframeTrack('Hips/Torso/RightArm.rotation[x]', [0, 0.45, 0.9, 1.35, 1.8], [-1.08, -0.92, -1.14, -0.96, -1.08]),
    new THREE.NumberKeyframeTrack('Hips/Torso/RightArm.rotation[y]', [0, 0.9, 1.8], [0.04, -0.12, 0.04]),
    new THREE.NumberKeyframeTrack('Hips/Torso/Head.rotation[x]', [0, 0.9, 1.8], [0.12, 0.19, 0.12]),
    new THREE.NumberKeyframeTrack('Hips/Torso/Head.rotation[y]', [0, 0.9, 1.8], [-0.05, 0.06, -0.05]),
  ]);

  // Employee actively conversing, gesturing & exchanging with customer
  const talkCustomerClip = new THREE.AnimationClip('TalkCustomer', 2.2, [
    new THREE.NumberKeyframeTrack('Hips/Torso.rotation[y]', [0, 1.1, 2.2], [-0.07, 0.08, -0.07]),
    new THREE.NumberKeyframeTrack('Hips/Torso/LeftArm.rotation[x]', [0, 0.55, 1.1, 1.65, 2.2], [-0.36, -0.82, -0.48, -0.78, -0.36]),
    new THREE.NumberKeyframeTrack('Hips/Torso/LeftArm.rotation[z]', [0, 1.1, 2.2], [-0.14, -0.28, -0.14]),
    new THREE.NumberKeyframeTrack('Hips/Torso/RightArm.rotation[x]', [0, 0.6, 1.2, 1.75, 2.2], [-0.68, -1.02, -0.72, -0.96, -0.68]),
    new THREE.NumberKeyframeTrack('Hips/Torso/RightArm.rotation[z]', [0, 1.1, 2.2], [0.1, 0.22, 0.1]),
    new THREE.NumberKeyframeTrack('Hips/Torso/Head.rotation[x]', [0, 0.55, 1.1, 1.65, 2.2], [0.02, 0.12, 0.03, 0.11, 0.02]),
    new THREE.NumberKeyframeTrack('Hips/Torso/Head.rotation[y]', [0, 1.1, 2.2], [-0.08, 0.09, -0.08]),
  ]);

  // Customer listening, nodding & reacting during consultation / checkout
  const listenCustomerClip = new THREE.AnimationClip('ListenCustomer', 2.4, [
    new THREE.NumberKeyframeTrack('Hips/Torso.rotation[y]', [0, 1.2, 2.4], [0.04, -0.05, 0.04]),
    new THREE.NumberKeyframeTrack('Hips/Torso/LeftArm.rotation[x]', [0, 1.2, 2.4], [-0.12, -0.34, -0.12]),
    new THREE.NumberKeyframeTrack('Hips/Torso/RightArm.rotation[x]', [0, 0.8, 1.6, 2.4], [-0.22, -0.64, -0.38, -0.22]),
    new THREE.NumberKeyframeTrack('Hips/Torso/Head.rotation[x]', [0, 0.6, 1.2, 1.8, 2.4], [0.01, 0.11, 0.02, 0.12, 0.01]),
    new THREE.NumberKeyframeTrack('Hips/Torso/Head.rotation[y]', [0, 1.2, 2.4], [0.06, -0.07, 0.06]),
  ]);

  const actions: Record<CharacterAnimState, THREE.AnimationAction> = {
    idle: mixer.clipAction(idleClip),
    walk: mixer.clipAction(walkClip),
    work: mixer.clipAction(workClip),
    sit: mixer.clipAction(sitClip),
    sit_work: mixer.clipAction(sitWorkClip),
    pc_sit: mixer.clipAction(pcSitClip),
    pc_stand: mixer.clipAction(pcStandClip),
    talk_customer: mixer.clipAction(talkCustomerClip),
    listen_customer: mixer.clipAction(listenCustomerClip),
  };

  actions.idle.play();
  let currentAction: CharacterAnimState = 'idle';

  const setAnimation = (name: CharacterAnimState) => {
    if (name === currentAction) return;
    const prev = actions[currentAction];
    const next = actions[name];
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
    prev.crossFadeTo(next, 0.22, true);
    currentAction = name;
  };

  return { group: root, mixer, actions, currentAction, carriedParcel, heldDevice, setAnimation };
}
