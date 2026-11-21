import * as THREE from 'three';
import gsap from 'gsap';
import type { PhysicsWorld } from '../world/physicsWorld';

export class PlayerController {
  public camera: THREE.PerspectiveCamera;
  public domElement: HTMLElement;
  private physics: PhysicsWorld;

  public yaw = 0;
  public pitch = -0.04;
  private targetYaw = 0;
  private targetPitch = -0.04;

  public eyeHeight = 1.66;
  public position = new THREE.Vector3(0, 1.66, 6.4);
  private velX = 0;
  private velZ = 0;

  private keys = new Set<string>();
  private activeLookPointerId: number | null = null;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private totalDragDist = 0;
  public pointerLocked = false;
  public enabled = true;

  public isSitting = false;
  private standRestorePos = new THREE.Vector3();

  // Mobile thumbstick vector (-1..1)
  public mobileMove = { x: 0, y: 0 };

  private _forward = new THREE.Vector3();
  private _right = new THREE.Vector3();
  private _euler = new THREE.Euler(0, 0, 0, 'YXZ');

  private onInteractCallback?: () => void;

  constructor(
    camera: THREE.PerspectiveCamera,
    domElement: HTMLElement,
    physics: PhysicsWorld,
    onInteract?: () => void,
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.physics = physics;
    this.onInteractCallback = onInteract;

    this.position.set(0, this.eyeHeight, 6.4);
    this.applyCameraTransform();

    this.bindEvents();
  }

  private bindEvents(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);

    this.domElement.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);
  }

  private handleBlur = (): void => {
    this.keys.clear();
    this.activeLookPointerId = null;
    this.mobileMove.x = 0;
    this.mobileMove.y = 0;
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.enabled) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
    this.keys.add(e.code);

    if (e.code === 'KeyE') {
      this.onInteractCallback?.();
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private handlePointerLockChange = (): void => {
    this.pointerLocked = document.pointerLockElement === this.domElement;
  };

  private handlePointerDown = (e: PointerEvent): void => {
    if (!this.enabled) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    // Isolate a single pointerId for look rotation so multi-touch joystick never interferes
    if (this.activeLookPointerId === null) {
      this.activeLookPointerId = e.pointerId;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      this.totalDragDist = 0;
    }
  };

  private handlePointerMove = (e: PointerEvent): void => {
    if (!this.enabled) return;
    if (this.pointerLocked) {
      this.targetYaw -= e.movementX * 0.0022;
      this.targetPitch = THREE.MathUtils.clamp(this.targetPitch - e.movementY * 0.0022, -1.25, 1.25);
      return;
    }

    if (this.activeLookPointerId === e.pointerId) {
      const dx = e.clientX - this.lastPointerX;
      const dy = e.clientY - this.lastPointerY;
      this.totalDragDist += Math.hypot(dx, dy);
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;

      const sens = e.pointerType === 'touch' ? 0.0046 : 0.0034;
      this.targetYaw -= dx * sens;
      this.targetPitch = THREE.MathUtils.clamp(this.targetPitch - dy * sens, -1.25, 1.25);
    }
  };

  private handlePointerUp = (e: PointerEvent): void => {
    if (this.activeLookPointerId === e.pointerId) {
      this.activeLookPointerId = null;
    }
  };

  public wasDragMovement(): boolean {
    return this.totalDragDist > 6;
  }

  public requestPointerLock(): void {
    try {
      this.domElement.requestPointerLock?.();
    } catch {
      // Drag-look fallback remains active
    }
  }

  public exitPointerLock(): void {
    if (document.pointerLockElement) {
      document.exitPointerLock?.();
    }
  }

  public sitAt(seatPos: THREE.Vector3, lookTarget: THREE.Vector3): void {
    if (this.isSitting) {
      this.standUp();
      return;
    }
    this.standRestorePos.copy(this.position);
    this.isSitting = true;
    const dx = lookTarget.x - seatPos.x;
    const dz = lookTarget.z - seatPos.z;
    const lookYaw = Math.atan2(-dx, -dz);

    gsap.to(this.position, {
      x: seatPos.x,
      y: seatPos.y,
      z: seatPos.z,
      duration: 0.6,
      ease: 'power2.out',
    });
    gsap.to(this, {
      targetYaw: lookYaw,
      targetPitch: -0.05,
      yaw: lookYaw,
      pitch: -0.05,
      duration: 0.6,
      ease: 'power2.out',
    });
  }

  public standUp(): void {
    if (!this.isSitting) return;
    this.isSitting = false;
    gsap.to(this.position, {
      x: this.standRestorePos.x,
      y: this.eyeHeight,
      z: this.standRestorePos.z,
      duration: 0.5,
      ease: 'power2.out',
    });
  }

  public update(dt: number): void {
    if (!this.enabled) return;

    // Exponentially damped camera look for silky-smooth swipe & mouse rotation
    this.yaw = THREE.MathUtils.damp(this.yaw, this.targetYaw, 24, dt);
    this.pitch = THREE.MathUtils.damp(this.pitch, this.targetPitch, 24, dt);

    if (!this.isSitting) {
      let moveForward = 0;
      let moveRight = 0;

      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) moveForward += 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) moveForward -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) moveRight += 1;
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) moveRight -= 1;

      moveForward += -this.mobileMove.y;
      moveRight += this.mobileMove.x;

      let targetVelX = 0;
      let targetVelZ = 0;

      if (Math.abs(moveForward) > 0.01 || Math.abs(moveRight) > 0.01) {
        const sprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? 1.55 : 1.0;
        const speed = 3.7 * sprint;

        this._forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
        this._right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

        const len = Math.hypot(moveForward, moveRight);
        const nf = len > 1 ? moveForward / len : moveForward;
        const nr = len > 1 ? moveRight / len : moveRight;

        targetVelX = (this._forward.x * nf + this._right.x * nr) * speed;
        targetVelZ = (this._forward.z * nf + this._right.z * nr) * speed;
      }

      // Smooth velocity acceleration/deceleration
      this.velX = THREE.MathUtils.damp(this.velX, targetVelX, 14, dt);
      this.velZ = THREE.MathUtils.damp(this.velZ, targetVelZ, 14, dt);

      if (Math.abs(this.velX) > 0.005 || Math.abs(this.velZ) > 0.005) {
        const nextX = this.position.x + this.velX * dt;
        const nextZ = this.position.z + this.velZ * dt;
        const resolved = this.physics.resolvePlayerMovement(nextX, nextZ, 0.34);
        this.position.x = resolved.x;
        this.position.z = resolved.z;
      }

      this.position.y = THREE.MathUtils.damp(this.position.y, this.eyeHeight, 10, dt);
    }

    this.applyCameraTransform();
  }

  private applyCameraTransform(): void {
    this.camera.position.copy(this.position);
    this._euler.set(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(this._euler);
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    this.domElement.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);
  }
}
