import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { NPCManager } from '../characters/npcManager';
import { eventBus } from '../core/eventBus';
import type { SimulationEngine } from '../core/simulationEngine';
import { formatGameTime } from '../core/timeManager';
import type { InteractableTarget } from '../core/types';
import { InteractionManager } from '../interaction/interactionManager';
import { PlayerController } from '../player/playerController';
import { PhysicsWorld } from './physicsWorld';
import { buildStoreScene, type StoreSceneHandles } from './storeBuilder';
import { buildVietnameseStreet, type StreetHandles } from './streetBuilder';
import { createProceduralTextures, type ProceduralTextures } from './textures';
import { WeatherAndSkySystem } from './weatherSystem';

export type GameMode = 'title' | 'playing' | 'paused';

export class GameWorld {
  public container: HTMLElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public isSoftwareGl: boolean;

  private sim: SimulationEngine;
  private textures: ProceduralTextures;
  private physics: PhysicsWorld;
  private store: StoreSceneHandles;
  private street: StreetHandles;
  private weather: WeatherAndSkySystem;
  private npcManager: NPCManager;
  public player: PlayerController;
  public interaction: InteractionManager;

  private mode: GameMode = 'title';
  private frameId = 0;
  private clock = new THREE.Clock();
  private disposed = false;
  private titlePanAngle = 0;

  // CCTV offscreen render target (updated on demand when Camera app is open)
  private cctvTarget: THREE.WebGLRenderTarget | null = null;
  private cctvPixelBuffer: Uint8Array | null = null;
  private cctvCanvas: HTMLCanvasElement | null = null;

  private onTargetChanged: (target: InteractableTarget | null) => void;
  private onInteractTriggered: (target: InteractableTarget) => void;
  private lastReportedTargetId: string | null = null;

  constructor(
    container: HTMLElement,
    sim: SimulationEngine,
    callbacks: {
      onTargetChanged: (target: InteractableTarget | null) => void;
      onInteractTriggered: (target: InteractableTarget) => void;
    },
  ) {
    this.container = container;
    this.sim = sim;
    this.onTargetChanged = callbacks.onTargetChanged;
    this.onInteractTriggered = callbacks.onInteractTriggered;

    // Detect software WebGL (SwiftShader / llvmpipe / WARP) cleanly
    this.isSoftwareGl = (() => {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2('#bae6fd', 0.011);

    const aspect = (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(64, aspect, 0.1, 140);

    // Studio RoomEnvironment reflection map
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Warm Key Sunlight + Cool Sky Hemisphere Fill
    const hemiLight = new THREE.HemisphereLight('#bae6fd', '#78716c', 1.0);
    this.scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight('#fffbeb', 1.85);
    sunLight.position.set(14, 22, 18);
    sunLight.castShadow = !this.isSoftwareGl;
    sunLight.shadow.mapSize.set(1024, 1024);
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 60;
    sunLight.shadow.camera.left = -22;
    sunLight.shadow.camera.right = 22;
    sunLight.shadow.camera.top = 22;
    sunLight.shadow.camera.bottom = -22;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    this.scene.add(sunLight);

    // Build Procedural Textures, Physics, Store, Street, Weather, NPCs
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createProceduralTextures(maxAniso, sim.state.storeName);
    this.physics = new PhysicsWorld();
    void this.physics.initRapier();

    this.store = buildStoreScene(this.textures, this.physics, this.isSoftwareGl);
    this.scene.add(this.store.root);

    this.street = buildVietnameseStreet(this.textures, this.physics, this.store.interactables);
    this.scene.add(this.street.root);

    this.weather = new WeatherAndSkySystem(
      this.scene,
      sunLight,
      hemiLight,
      this.street.streetLamps,
      this.street.asphaltMat,
    );

    this.npcManager = new NPCManager(
      this.scene,
      this.store.interactables,
      this.textures.contactShadow,
    );

    this.interaction = new InteractionManager(this.camera, this.store.interactables);

    this.player = new PlayerController(
      this.camera,
      this.renderer.domElement,
      this.physics,
      () => this.triggerCenterInteract(),
    );
    this.player.enabled = false;

    // Apply initial store light/door/weather states
    this.store.setLightsState(this.sim.state.lightsOn);
    this.store.setDoorState(this.sim.state.doorOpen);
    this.store.setDirectorDoorState(this.sim.state.directorDoorOpen ?? false);
    this.weather.setWeather(this.sim.state.weather);

    // Subscribe to world events
    eventBus.on<boolean>('world:lights', (on) => this.store.setLightsState(on));
    eventBus.on<boolean>('world:door', (open) => this.store.setDoorState(open));
    eventBus.on<boolean>('world:director_door', (open) => this.store.setDirectorDoorState(open));
    eventBus.on('world:weather', (w) => this.weather.setWeather(w as 'clear' | 'rain'));

    // Click / Tap on canvas to interact directly with 3D objects
    this.renderer.domElement.addEventListener('pointerup', this.handleCanvasPointerUp);
    window.addEventListener('resize', this.handleResize);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.clock.start();
    this.startLoop();
  }

  public setMode(mode: GameMode): void {
    this.mode = mode;
    this.player.enabled = mode === 'playing';
    if (mode !== 'playing') {
      this.player.exitPointerLock();
    }
  }

  public setControlsActive(active: boolean): void {
    this.player.enabled = active && this.mode === 'playing';
    if (!active) this.player.exitPointerLock();
  }

  public toggleSitDirectorChair(): void {
    this.player.sitAt(this.store.directorChairSeatPos, this.store.directorChairLookTarget);
  }

  public toggleSitVipChair(): void {
    this.player.sitAt(this.store.vipChairSeatPos, this.store.vipChairLookTarget);
  }

  public toggleSitCafe(): void {
    this.player.sitAt(this.store.cafeSeatPos, this.store.cafeLookTarget);
    this.sim.takeCoffeeBreak();
  }

  public triggerCenterInteract(): void {
    if (this.mode !== 'playing' || !this.player.enabled) return;
    const target = this.interaction.currentTarget;
    if (target) {
      this.onInteractTriggered(target);
    }
  }

  private handleCanvasPointerUp = (e: PointerEvent): void => {
    if (this.mode !== 'playing' || !this.player.enabled) return;
    if (this.player.wasDragMovement()) return;

    // In pointer lock, click interacts with center crosshair; otherwise raycast exact pointer coords!
    const target = this.player.pointerLocked
      ? this.interaction.currentTarget
      : this.interaction.raycastAtClientPoint(e.clientX, e.clientY, this.renderer.domElement);

    if (target) {
      this.onInteractTriggered(target);
    }
  };

  private handleResize = (): void => {
    if (this.disposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  /**
   * Captures a live 3D CCTV snapshot from any of the 5 security cameras into a DataURL
   */
  public captureCCTVFrame(camKey: 'showroom' | 'cashier' | 'tech' | 'warehouse' | 'entrance'): string | null {
    const cam = this.store.cctvCameras[camKey];
    if (!cam) return null;

    const w = 320;
    const h = 180;
    if (!this.cctvTarget) {
      this.cctvTarget = new THREE.WebGLRenderTarget(w, h);
      this.cctvPixelBuffer = new Uint8Array(w * h * 4);
      this.cctvCanvas = document.createElement('canvas');
      this.cctvCanvas.width = w;
      this.cctvCanvas.height = h;
    }

    const prevTarget = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(this.cctvTarget);
    this.renderer.render(this.scene, cam);
    this.renderer.readRenderTargetPixels(this.cctvTarget, 0, 0, w, h, this.cctvPixelBuffer!);
    this.renderer.setRenderTarget(prevTarget);

    const ctx = this.cctvCanvas!.getContext('2d')!;
    const imgData = ctx.createImageData(w, h);
    // Flip Y from WebGL bottom-up coordinates
    for (let y = 0; y < h; y++) {
      const srcRow = (h - 1 - y) * w * 4;
      const dstRow = y * w * 4;
      for (let x = 0; x < w * 4; x++) {
        imgData.data[dstRow + x] = this.cctvPixelBuffer![srcRow + x];
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return this.cctvCanvas!.toDataURL('image/jpeg', 0.78);
  }

  private startLoop(): void {
    const afterDraw = (cb: () => void) => {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (this.disposed) return;
      const dt = Math.min(this.clock.getDelta(), 0.05);

      if (this.mode === 'title') {
        // Atmospheric slow live camera pan looking through storefront & showroom
        this.titlePanAngle += dt * 0.14;
        const cx = Math.sin(this.titlePanAngle) * 5.2;
        const cz = 14.2 + Math.cos(this.titlePanAngle * 0.6) * 1.4;
        this.camera.position.set(cx, 2.35, cz);
        this.camera.lookAt(0, 1.45, 2.5);
      } else if (this.mode === 'playing') {
        this.sim.tick(dt);
        this.physics.step(dt);
        this.player.update(dt);

        if (this.player.enabled) {
          const target = this.interaction.updateCenterTarget(performance.now());
          const tid = target?.id ?? null;
          if (tid !== this.lastReportedTargetId) {
            this.lastReportedTargetId = tid;
            this.onTargetChanged(target);
          }
        } else if (this.lastReportedTargetId !== null) {
          this.lastReportedTargetId = null;
          this.onTargetChanged(null);
        }
      }

      // Always animate street traffic, NPCs, weather & day/night
      const curTime = formatGameTime(this.sim.state.totalMinutes);
      this.weather.update(dt, curTime.hour + curTime.minute / 60);
      this.street.updateTraffic(dt);
      this.npcManager.update(dt, this.sim);

      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.handleResize);
    this.renderer.domElement.removeEventListener('pointerup', this.handleCanvasPointerUp);
    this.player.dispose();
    this.cctvTarget?.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
