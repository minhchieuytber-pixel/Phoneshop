/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { audioManager } from './audio/audioManager';
import { DeviceMonitorModal } from './components/DeviceMonitorModal';
import { HUD } from './components/HUD';
import { PauseModal } from './components/PauseModal';
import { TitleScreen } from './components/TitleScreen';
import { VirtualSmartphone } from './components/VirtualSmartphone';
import { eventBus } from './core/eventBus';
import { clearSavedGame, loadGameState, saveGameState } from './core/saveManager';
import { createInitialGameState, SimulationEngine } from './core/simulationEngine';
import { formatGameTime, formatShortVND } from './core/timeManager';
import type { GameState, InteractableTarget, SimSpeed } from './core/types';
import { GameWorld, type GameMode } from './world/gameWorld';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const simRef = useRef<SimulationEngine>(new SimulationEngine());
  const worldRef = useRef<GameWorld | null>(null);

  const [mode, setMode] = useState<GameMode>('title');
  const [gameState, setGameState] = useState<GameState>(() => simRef.current.state);
  const [hasSave, setHasSave] = useState(false);
  const [savedSummary, setSavedSummary] = useState<string | undefined>(undefined);
  const [saveLoadedState, setSaveLoadedState] = useState<GameState | null>(null);

  const [aimTarget, setAimTarget] = useState<InteractableTarget | null>(null);
  const [activeDeviceTarget, setActiveDeviceTarget] = useState<InteractableTarget | null>(null);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [isSitting, setIsSitting] = useState(false);
  const [pointerLocked, setPointerLocked] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [webglError, setWebglError] = useState(false);

  // Keep refs for callbacks inside GameWorld
  const handleWorldInteract = useCallback((target: InteractableTarget) => {
    const sim = simRef.current;
    const world = worldRef.current;
    if (!world) return;

    if (target.type === 'door') {
      eventBus.emit('audio:switch');
      sim.toggleDoor();
      return;
    }
    if (target.type === 'director_door') {
      eventBus.emit('audio:switch');
      sim.toggleDirectorDoor();
      return;
    }
    if (target.type === 'light_switch') {
      eventBus.emit('audio:switch');
      sim.toggleLights();
      return;
    }
    if (target.type === 'director_chair') {
      eventBus.emit('audio:click');
      world.toggleSitDirectorChair();
      setIsSitting(world.player.isSitting);
      return;
    }
    if (target.type === 'vip_seat') {
      eventBus.emit('audio:click');
      world.toggleSitVipChair();
      setIsSitting(world.player.isSitting);
      return;
    }
    if (target.type === 'cafe_table') {
      eventBus.emit('audio:click');
      world.toggleSitCafe();
      setIsSitting(world.player.isSitting);
      return;
    }

    // Open in-world device screen or NPC interaction card
    eventBus.emit('audio:click');
    setActiveDeviceTarget(target);
    world.setControlsActive(false);
  }, []);

  // Initialize Three.js GameWorld ONCE in isolated container
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    try {
      const world = new GameWorld(mount, simRef.current, {
        onTargetChanged: (t) => setAimTarget(t),
        onInteractTriggered: (t) => handleWorldInteract(t),
      });
      worldRef.current = world;
      world.setMode('title');
    } catch {
      setWebglError(true);
    }

    const onLockChange = () => {
      setPointerLocked(Boolean(document.pointerLockElement));
    };
    document.addEventListener('pointerlockchange', onLockChange);

    const unsubSim = eventBus.on<GameState>('sim:updated', (next) => {
      setGameState({ ...next });
    });

    // Check IndexedDB save on startup
    void loadGameState().then((loaded) => {
      if (loaded?.state) {
        setHasSave(true);
        setSaveLoadedState(loaded.state);
        const t = formatGameTime(loaded.state.totalMinutes);
        setSavedSummary(`Ngày ${t.day} · ${t.timeStr} · Quỹ ${formatShortVND(loaded.state.businessBalance)}`);
      }
    });

    return () => {
      unsubSim();
      document.removeEventListener('pointerlockchange', onLockChange);
      worldRef.current?.dispose();
      worldRef.current = null;
    };
  }, [handleWorldInteract]);

  // Sync mode & controls with open overlays
  useEffect(() => {
    const world = worldRef.current;
    if (!world) return;
    world.setMode(mode);
    const controlsFree = mode === 'playing' && !activeDeviceTarget && !phoneOpen;
    world.setControlsActive(controlsFree);
  }, [mode, activeDeviceTarget, phoneOpen]);

  // Keyboard shortcuts (Tab / P for Virtual Smartphone, Esc for closing overlays / Pause)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (mode === 'title') return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        if (e.key === 'Escape') (e.target as HTMLElement).blur();
        return;
      }

      if (e.key === 'Tab' || e.code === 'KeyP') {
        e.preventDefault();
        if (mode === 'playing' && !activeDeviceTarget) {
          eventBus.emit('audio:click');
          setPhoneOpen((prev) => !prev);
        }
      } else if (e.key === 'Escape') {
        if (activeDeviceTarget) {
          setActiveDeviceTarget(null);
        } else if (phoneOpen) {
          setPhoneOpen(false);
        } else {
          setMode((prev) => (prev === 'playing' ? 'paused' : 'playing'));
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mode, activeDeviceTarget, phoneOpen]);

  // Periodic Auto-Save to IndexedDB while playing
  useEffect(() => {
    if (mode !== 'playing') return;
    const interval = window.setInterval(() => {
      void saveGameState(simRef.current.state);
    }, 25000);
    const onUnload = () => {
      void saveGameState(simRef.current.state);
    };
    window.addEventListener('beforeunload', onUnload);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [mode]);

  const startNewGame = async () => {
    await clearSavedGame();
    const fresh = createInitialGameState();
    simRef.current.replaceState(fresh);
    setGameState({ ...fresh });
    audioManager.startAmbient();
    audioManager.setSettings(fresh.settings.musicVolume, fresh.settings.sfxVolume, fresh.settings.muted);
    setMode('playing');
  };

  const continueSavedGame = () => {
    if (saveLoadedState) {
      const freshState = createInitialGameState();
      const existingEmployees = (saveLoadedState.employees ?? []).map((e) =>
        (e.department === 'tech' || e.department === 'cs' || e.department === 'shipping') &&
        (e.state === 'working' || e.state === 'online_cs' || e.state === 'packing' || e.state === 'shipping') &&
        !e.currentTaskId
          ? { ...e, state: 'idle' as const }
          : e,
      );
      const freshTechs = freshState.employees.filter((e) => e.department === 'tech');
      for (const ft of freshTechs) {
        if (existingEmployees.filter((e) => e.department === 'tech').length < 3) {
          if (!existingEmployees.some((e) => e.id === ft.id)) {
            existingEmployees.push(ft);
          }
        }
      }
      // Ensure Online CSKH & Shipping staff exist on older saves
      const freshCs = freshState.employees.find((e) => e.department === 'cs');
      if (freshCs && !existingEmployees.some((e) => e.department === 'cs')) {
        existingEmployees.push(freshCs);
      }
      const freshShipping = freshState.employees.find((e) => e.department === 'shipping');
      if (freshShipping && !existingEmployees.some((e) => e.department === 'shipping')) {
        existingEmployees.push(freshShipping);
      }

      const existingCandidates = [...(saveLoadedState.candidates ?? [])];
      for (const fc of freshState.candidates) {
        if (!existingCandidates.some((c) => c.id === fc.id)) {
          existingCandidates.push(fc);
        }
      }

      const migrated: GameState = {
        ...saveLoadedState,
        storeName:
          saveLoadedState.storeName === 'Minh Phát Mobile' ? 'Minh Chiêu Mobile' : saveLoadedState.storeName,
        directorDoorOpen: saveLoadedState.directorDoorOpen ?? false,
        attendanceLogs: saveLoadedState.attendanceLogs ?? [],
        lastClockOutDay: saveLoadedState.lastClockOutDay ?? 0,
        onlineOrders: saveLoadedState.onlineOrders ?? freshState.onlineOrders,
        employees: existingEmployees,
        candidates: existingCandidates,
        customers: (saveLoadedState.customers ?? []).map((c) => ({
          ...c,
          hairStyle: c.hairStyle ?? 'short',
          outfitStyle: c.outfitStyle ?? 'tshirt',
          pantsColor: c.pantsColor ?? '#1e293b',
          hasGlasses: c.hasGlasses ?? false,
          heightScale: c.heightScale ?? 1,
          exitedWorld: c.exitedWorld ?? false,
        })),
      };
      simRef.current.replaceState(migrated);
      setGameState({ ...migrated });
      eventBus.emit('world:lights', migrated.lightsOn);
      eventBus.emit('world:door', migrated.doorOpen);
      eventBus.emit('world:director_door', migrated.directorDoorOpen);
      eventBus.emit('world:weather', migrated.weather);
      audioManager.setSettings(
        migrated.settings.musicVolume,
        migrated.settings.sfxVolume,
        migrated.settings.muted,
      );
    }
    audioManager.startAmbient();
    setMode('playing');
  };

  const handleSetSpeed = (s: SimSpeed) => {
    simRef.current.setSpeed(s);
  };

  const handleUpdateAudio = (music: number, sfx: number, muted: boolean) => {
    simRef.current.state.settings.musicVolume = music;
    simRef.current.state.settings.sfxVolume = sfx;
    simRef.current.state.settings.muted = muted;
    audioManager.setSettings(music, sfx, muted);
    setGameState({ ...simRef.current.state });
  };

  const handleManualSave = async () => {
    const ok = await saveGameState(simRef.current.state);
    setSaveStatus(ok ? 'Đã lưu tiến trình vào IndexedDB!' : 'Không thể lưu lúc này.');
    window.setTimeout(() => setSaveStatus(null), 2500);
  };

  const captureCCTV = useCallback(
    (cam: 'showroom' | 'cashier' | 'tech' | 'warehouse' | 'entrance') => {
      return worldRef.current?.captureCCTVFrame(cam) ?? null;
    },
    [],
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#090d16]">
      {/* Isolated Full-Viewport WebGL Mount */}
      <div ref={canvasMountRef} className="w-full h-full" />

      {webglError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-6 text-center">
          <div className="max-w-md space-y-2">
            <h1 className="font-display text-xl font-bold text-white">Không thể khởi tạo WebGL 3D</h1>
            <p className="text-sm text-slate-400">
              Vui lòng bật tăng tốc phần cứng hoặc mở trên trình duyệt hỗ trợ WebGL2 (Chrome, Safari, Edge).
            </p>
          </div>
        </div>
      )}

      {mode === 'title' && (
        <TitleScreen
          hasSave={hasSave}
          savedSummary={savedSummary}
          onStartNew={startNewGame}
          onContinue={continueSavedGame}
        />
      )}

      {mode === 'playing' && (
        <>
          <HUD
            state={gameState}
            target={activeDeviceTarget || phoneOpen ? null : aimTarget}
            isSitting={isSitting}
            pointerLocked={pointerLocked}
            onSetSpeed={handleSetSpeed}
            onToggleWeather={() => simRef.current.toggleWeather()}
            onStandUp={() => {
              worldRef.current?.player.standUp();
              setIsSitting(false);
            }}
            onPause={() => setMode('paused')}
            onEngageLock={() => worldRef.current?.player.requestPointerLock()}
            onMobileMove={(x, y) => {
              if (worldRef.current) {
                worldRef.current.player.mobileMove = { x, y };
              }
            }}
            onTriggerInteract={() => worldRef.current?.triggerCenterInteract()}
          />

          {!activeDeviceTarget && (
            <VirtualSmartphone
              isOpen={phoneOpen}
              state={gameState}
              sim={simRef.current}
              onToggle={() => setPhoneOpen((p) => !p)}
              captureCCTV={captureCCTV}
              onUpdateAudio={handleUpdateAudio}
            />
          )}

          {activeDeviceTarget && (
            <DeviceMonitorModal
              target={activeDeviceTarget}
              state={gameState}
              sim={simRef.current}
              captureCCTV={captureCCTV}
              onClose={() => setActiveDeviceTarget(null)}
            />
          )}
        </>
      )}

      {mode === 'paused' && (
        <PauseModal
          speed={gameState.speed}
          settings={gameState.settings}
          saveStatus={saveStatus}
          onResume={() => setMode('playing')}
          onSave={handleManualSave}
          onSetSpeed={handleSetSpeed}
          onUpdateAudio={handleUpdateAudio}
          onResetGame={startNewGame}
        />
      )}
    </div>
  );
}
