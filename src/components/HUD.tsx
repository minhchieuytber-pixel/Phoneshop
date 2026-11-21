import React, { useRef, useState } from 'react';
import { CloudRain, Pause, Sun } from 'lucide-react';
import { formatGameTime, formatShortVND } from '../core/timeManager';
import type { GameState, InteractableTarget, SimSpeed } from '../core/types';

interface HUDProps {
  state: GameState;
  target: InteractableTarget | null;
  isSitting: boolean;
  pointerLocked: boolean;
  onSetSpeed: (s: SimSpeed) => void;
  onToggleWeather: () => void;
  onStandUp: () => void;
  onPause: () => void;
  onEngageLock: () => void;
  onMobileMove: (x: number, y: number) => void;
  onTriggerInteract: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  state,
  target,
  isSitting,
  pointerLocked,
  onSetSpeed,
  onToggleWeather,
  onStandUp,
  onPause,
  onEngageLock,
  onMobileMove,
  onTriggerInteract,
}) => {
  const timeInfo = formatGameTime(state.totalMinutes);
  const openComplaints = state.complaints.filter((c) => c.status === 'open').length;
  const activeTasks = state.tasks.filter((t) => t.status === 'active').length;

  // Touch virtual joystick state
  const joyRef = useRef<HTMLDivElement | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [joyActive, setJoyActive] = useState(false);

  const handleJoyMove = (clientX: number, clientY: number) => {
    const el = joyRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width / 2 - 14;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setKnob({ x: dx, y: dy });
    onMobileMove(dx / maxR, dy / maxR);
  };

  return (
    <div className="fixed inset-0 z-10 pointer-events-none select-none">
      {/* Top-Left Compact Status Strip (Solid dark rgba, zero backdrop-filter over WebGL) */}
      <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-3 px-3.5 py-2 rounded-lg bg-[#0b1120]/88 border border-slate-700/70 text-slate-100 text-xs">
          <span className="font-display font-semibold text-sm text-sky-400 whitespace-nowrap">
            {state.storeName}
          </span>
          <span className="text-slate-500">·</span>
          <span className="font-mono-num whitespace-nowrap">
            {timeInfo.timeStr} · Ngày {timeInfo.day}
          </span>
          <span className="hidden sm:inline text-slate-400 whitespace-nowrap">
            {timeInfo.periodLabel}
          </span>
          <span className="text-slate-500">·</span>
          <span className="font-mono-num font-semibold text-emerald-400 whitespace-nowrap">
            {formatShortVND(state.businessBalance)}
          </span>
          {openComplaints > 0 && (
            <>
              <span className="text-slate-500">·</span>
              <span className="text-amber-400 font-medium whitespace-nowrap">
                {openComplaints} khiếu nại
              </span>
            </>
          )}
          {activeTasks > 0 && (
            <>
              <span className="hidden md:inline text-slate-500">·</span>
              <span className="hidden md:inline text-slate-300 font-mono-num whitespace-nowrap">
                {activeTasks} việc đang chạy
              </span>
            </>
          )}
        </div>

        {/* Speed + Weather + Pause controls */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0b1120]/88 border border-slate-700/70">
          {(['paused', 'slow', 'normal', 'fast'] as SimSpeed[]).map((s) => (
            <button
              key={s}
              onClick={() => onSetSpeed(s)}
              className={`px-2 py-1 text-[11px] font-medium rounded cursor-pointer whitespace-nowrap ${
                state.speed === s
                  ? 'bg-sky-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {s === 'paused' ? 'Dừng' : s === 'slow' ? '1x' : s === 'normal' ? '3x' : '10x'}
            </button>
          ))}
          <button
            onClick={onToggleWeather}
            title="Chuyển thời tiết Nắng / Mưa"
            className="p-1.5 rounded text-slate-300 hover:bg-slate-800 cursor-pointer"
          >
            {state.weather === 'rain' ? <CloudRain className="w-3.5 h-3.5 text-sky-400" /> : <Sun className="w-3.5 h-3.5 text-amber-300" />}
          </button>
          <button
            onClick={onPause}
            title="Tạm dừng (Esc)"
            className="p-1.5 rounded text-slate-300 hover:bg-slate-800 cursor-pointer"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subtle top-right PC look hint (only when not locked) */}
      <div className="hidden md:flex absolute top-4 right-4 items-center gap-2 pointer-events-auto">
        {!pointerLocked && (
          <button
            onClick={onEngageLock}
            className="px-3 py-1.5 rounded-lg bg-[#0b1120]/85 border border-slate-700/70 text-[11px] text-slate-300 hover:text-white cursor-pointer"
          >
            Khóa chuột FPS (Esc để thoát)
          </button>
        )}
      </div>

      {/* Minimal Center Reticle */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <div
          className={`rounded-full transition-all duration-100 ${
            target ? 'w-2.5 h-2.5 bg-sky-400 ring-4 ring-sky-400/25' : 'w-1.5 h-1.5 bg-white/75'
          }`}
        />
      </div>

      {/* Bottom-center Raycast Interact Prompt (Only appears when aiming at 3D object!) */}
      {target && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
          <button
            onClick={onTriggerInteract}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#0b1120]/92 border border-sky-500/50 text-left shadow-lg cursor-pointer hover:bg-slate-900"
          >
            <span className="px-2 py-0.5 rounded bg-sky-500 text-slate-950 font-mono-num text-xs font-bold">
              E
            </span>
            <div>
              <div className="text-xs font-semibold text-white whitespace-nowrap">{target.label}</div>
              {target.sublabel && (
                <div className="text-[11px] text-slate-300 whitespace-nowrap">{target.sublabel}</div>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Stand up button when seated at Director chair or Cafe */}
      {isSitting && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-auto">
          <button
            onClick={onStandUp}
            className="px-4 py-2 rounded-lg bg-slate-900/95 border border-slate-600 text-xs font-medium text-white hover:bg-slate-800 cursor-pointer"
          >
            Đứng dậy khỏi ghế
          </button>
        </div>
      )}

      {/* Mobile Touch Virtual Joystick (visible on touch/small screens) */}
      <div className="md:hidden absolute bottom-6 left-5 pointer-events-auto">
        <div
          ref={joyRef}
          onTouchStart={(e) => {
            setJoyActive(true);
            handleJoyMove(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchMove={(e) => {
            if (!joyActive) return;
            handleJoyMove(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchEnd={() => {
            setJoyActive(false);
            setKnob({ x: 0, y: 0 });
            onMobileMove(0, 0);
          }}
          className="w-24 h-24 rounded-full bg-[#0b1120]/70 border border-slate-600/80 relative flex items-center justify-center touch-none"
        >
          <div
            className="w-10 h-10 rounded-full bg-sky-400/90 shadow-md"
            style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
          />
        </div>
      </div>
    </div>
  );
};
