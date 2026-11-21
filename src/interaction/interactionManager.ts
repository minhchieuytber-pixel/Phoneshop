import * as THREE from 'three';
import type { InteractableTarget } from '../core/types';

export class InteractionManager {
  private raycaster = new THREE.Raycaster();
  private centerNDC = new THREE.Vector2(0, 0);
  private pointerNDC = new THREE.Vector2();
  private camera: THREE.PerspectiveCamera;
  private interactables: THREE.Object3D[];
  public currentTarget: InteractableTarget | null = null;
  private lastScanTime = 0;

  constructor(camera: THREE.PerspectiveCamera, interactables: THREE.Object3D[]) {
    this.camera = camera;
    this.interactables = interactables;
    this.raycaster.far = 4.6;
  }

  public updateCenterTarget(nowMs: number): InteractableTarget | null {
    if (nowMs - this.lastScanTime < 65) return this.currentTarget; // ~15Hz raycast throttle
    this.lastScanTime = nowMs;

    this.raycaster.setFromCamera(this.centerNDC, this.camera);
    const hits = this.raycaster.intersectObjects(this.interactables, true);
    this.currentTarget = this.extractTarget(hits);
    return this.currentTarget;
  }

  public raycastAtClientPoint(
    clientX: number,
    clientY: number,
    canvas: HTMLCanvasElement,
  ): InteractableTarget | null {
    const rect = canvas.getBoundingClientRect();
    this.pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointerNDC, this.camera);
    const hits = this.raycaster.intersectObjects(this.interactables, true);
    return this.extractTarget(hits);
  }

  private extractTarget(hits: THREE.Intersection[]): InteractableTarget | null {
    for (const hit of hits) {
      let cur: THREE.Object3D | null = hit.object;
      while (cur) {
        if (cur.userData?.interactable) {
          return cur.userData.interactable as InteractableTarget;
        }
        cur = cur.parent;
      }
    }
    return null;
  }
}
