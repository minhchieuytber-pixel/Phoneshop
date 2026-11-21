import RAPIER from '@dimforge/rapier3d-compat';

export interface BoxCollider {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY?: number;
  maxY?: number;
  enabled: boolean;
}

export class PhysicsWorld {
  private colliders: BoxCollider[] = [];
  private rapierReady = false;
  private world: RAPIER.World | null = null;

  public async initRapier(): Promise<void> {
    try {
      await RAPIER.init();
      this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
      // Register existing box colliders as static Rapier rigidbodies
      for (const c of this.colliders) {
        this.addRapierStaticBox(c);
      }
      this.rapierReady = true;
    } catch {
      this.rapierReady = false;
    }
  }

  public addBoxCollider(
    id: string,
    cx: number,
    cz: number,
    width: number,
    depth: number,
    height = 3,
  ): BoxCollider {
    const col: BoxCollider = {
      id,
      minX: cx - width / 2,
      maxX: cx + width / 2,
      minZ: cz - depth / 2,
      maxZ: cz + depth / 2,
      minY: 0,
      maxY: height,
      enabled: true,
    };
    this.colliders.push(col);
    if (this.rapierReady) {
      this.addRapierStaticBox(col);
    }
    return col;
  }

  public setColliderEnabled(id: string, enabled: boolean): void {
    const col = this.colliders.find((c) => c.id === id);
    if (col) col.enabled = enabled;
  }

  private addRapierStaticBox(c: BoxCollider): void {
    if (!this.world) return;
    const cx = (c.minX + c.maxX) / 2;
    const cz = (c.minZ + c.maxZ) / 2;
    const hx = (c.maxX - c.minX) / 2;
    const hz = (c.maxZ - c.minZ) / 2;
    const hy = ((c.maxY ?? 3) - (c.minY ?? 0)) / 2;
    const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(cx, hy, cz);
    const body = this.world.createRigidBody(bodyDesc);
    const colDesc = RAPIER.ColliderDesc.cuboid(Math.max(0.05, hx), Math.max(0.1, hy), Math.max(0.05, hz));
    this.world.createCollider(colDesc, body);
  }

  public step(dt: number): void {
    if (this.rapierReady && this.world) {
      this.world.timestep = Math.min(dt, 0.05);
      this.world.step();
    }
  }

  /**
   * Resolves horizontal circle-vs-AABB collision cleanly so player glides smoothly along walls & furniture
   */
  public resolvePlayerMovement(
    x: number,
    z: number,
    radius = 0.36,
  ): { x: number; z: number } {
    let px = Math.max(-16.5, Math.min(16.5, x));
    let pz = Math.max(-11.5, Math.min(17.5, z));

    for (let iter = 0; iter < 2; iter++) {
      for (const c of this.colliders) {
        if (!c.enabled) continue;
        const closestX = Math.max(c.minX, Math.min(px, c.maxX));
        const closestZ = Math.max(c.minZ, Math.min(pz, c.maxZ));
        const dx = px - closestX;
        const dz = pz - closestZ;
        const distSq = dx * dx + dz * dz;

        if (distSq < radius * radius) {
          if (distSq > 1e-6) {
            const dist = Math.sqrt(distSq);
            const push = radius - dist;
            px += (dx / dist) * push;
            pz += (dz / dist) * push;
          } else {
            // Center inside AABB: push out shortest axis
            const left = Math.abs(px - c.minX);
            const right = Math.abs(c.maxX - px);
            const top = Math.abs(pz - c.minZ);
            const bottom = Math.abs(c.maxZ - pz);
            const m = Math.min(left, right, top, bottom);
            if (m === left) px = c.minX - radius;
            else if (m === right) px = c.maxX + radius;
            else if (m === top) pz = c.minZ - radius;
            else pz = c.maxZ + radius;
          }
        }
      }
    }

    return { x: px, z: pz };
  }
}
