import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowLeft } from 'lucide-react';
import { eventBus } from '../core/eventBus';
import type { SimulationEngine } from '../core/simulationEngine';
import { formatGameTime } from '../core/timeManager';
import type { GameState } from '../core/types';
import { SmartphoneAppContent, type PhoneAppId } from './SmartphoneApps';

interface VirtualSmartphoneProps {
  isOpen: boolean;
  state: GameState;
  sim: SimulationEngine;
  onToggle: () => void;
  captureCCTV: (cam: 'showroom' | 'cashier' | 'tech' | 'warehouse' | 'entrance') => string | null;
  onUpdateAudio: (music: number, sfx: number, muted: boolean) => void;
}

const WALLPAPERS = [
  'linear-gradient(155deg, #091326 0%, #0c2b4e 52%, #083344 100%)',
  'linear-gradient(155deg, #170f2e 0%, #3b1d6e 55%, #1e1b4b 100%)',
  'linear-gradient(155deg, #06221b 0%, #0f4c3a 55%, #082f49 100%)',
];

function renderAppSvgIcon(id: Exclude<PhoneAppId, 'home'>): React.ReactNode {
  switch (id) {
    case 'phone':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="white" strokeWidth="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      );
    case 'messages':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="white" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'banking':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="white" strokeWidth="2">
          <path d="M3 10h18M5 10v8M10 10v8M14 10v8M19 10v8M2 20h20M12 2L2 7h20L12 2z" />
        </svg>
      );
    case 'reports':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="white" strokeWidth="2">
          <path d="M3 3v18h18M7 16l4-4 4 3 5-6" />
        </svg>
      );
    case 'orders':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="white" strokeWidth="2">
          <path d="M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v9" />
        </svg>
      );
    case 'employees':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="white" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87" />
        </svg>
      );
    case 'business':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="white" strokeWidth="2">
          <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
        </svg>
      );
    case 'calendar':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="white" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );
    case 'email':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="white" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M22 7l-10 6L2 7" />
        </svg>
      );
    case 'market':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="white" strokeWidth="2">
          <rect x="7" y="2" width="10" height="20" rx="2" />
          <path d="M11 18h2" />
        </svg>
      );
    case 'camera':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="white" strokeWidth="2">
          <path d="M23 7l-7 5 7 5V7z" />
          <rect x="1" y="5" width="15" height="14" rx="2" />
        </svg>
      );
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="white" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1.02 1.41 1.11H21a2 2 0 1 1 0 4h-.09c-.64.09-1.15.51-1.41 1.11z" />
        </svg>
      );
  }
}

const APP_LIST: { id: Exclude<PhoneAppId, 'home'>; label: string; bg: string }[] = [
  { id: 'reports', label: 'Báo cáo', bg: 'bg-sky-600' },
  { id: 'banking', label: 'Ngân hàng', bg: 'bg-emerald-600' },
  { id: 'employees', label: 'Nhân sự', bg: 'bg-indigo-600' },
  { id: 'orders', label: 'Đơn hàng', bg: 'bg-amber-600' },
  { id: 'business', label: 'Doanh nghiệp', bg: 'bg-slate-600' },
  { id: 'market', label: 'Thị trường', bg: 'bg-cyan-600' },
  { id: 'camera', label: 'Camera', bg: 'bg-zinc-700' },
  { id: 'calendar', label: 'Lịch', bg: 'bg-rose-600' },
  { id: 'email', label: 'Email', bg: 'bg-blue-600' },
  { id: 'settings', label: 'Cài đặt', bg: 'bg-slate-700' },
];

const DOCK_APPS: { id: Exclude<PhoneAppId, 'home'>; label: string; bg: string }[] = [
  { id: 'phone', label: 'Điện thoại', bg: 'bg-emerald-500' },
  { id: 'messages', label: 'Tin nhắn', bg: 'bg-sky-500' },
  { id: 'reports', label: 'Báo cáo', bg: 'bg-indigo-500' },
  { id: 'camera', label: 'Camera', bg: 'bg-slate-600' },
];

export const VirtualSmartphone: React.FC<VirtualSmartphoneProps> = ({
  isOpen,
  state,
  sim,
  onToggle,
  captureCCTV,
  onUpdateAudio,
}) => {
  const [activeApp, setActiveApp] = useState<PhoneAppId>('home');
  const phoneRef = useRef<HTMLDivElement | null>(null);
  const timeInfo = formatGameTime(state.totalMinutes);

  const unreadMsgs = state.messages.filter((m) => !m.read).length;
  const unreadMail = state.emails.filter((e) => !e.read).length;
  const totalUnread = unreadMsgs + unreadMail;

  useEffect(() => {
    const el = phoneRef.current;
    if (!el) return;
    if (isOpen) {
      gsap.fromTo(
        el,
        { y: 120, scale: 0.9, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, duration: 0.36, ease: 'power3.out' },
      );
    }
  }, [isOpen]);

  const handleOpenToggle = () => {
    eventBus.emit('audio:click');
    onToggle();
  };

  return (
    <>
      {/* Fixed circular Smartphone button on right side of screen */}
      <button
        onClick={handleOpenToggle}
        aria-label="Mở điện thoại cá nhân"
        title="Điện thoại cá nhân (Tab / P)"
        className={`fixed right-5 top-1/2 -translate-y-1/2 z-20 w-13 h-13 rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-xl border ${
          isOpen
            ? 'bg-sky-500 border-sky-300 text-slate-950'
            : 'bg-[#0b1120]/92 hover:bg-slate-800 border-slate-600 text-white'
        }`}
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.9">
          <rect x="6" y="2" width="12" height="20" rx="3" />
          <line x1="10" y1="5" x2="14" y2="5" strokeLinecap="round" />
          <circle cx="12" cy="18.5" r="0.8" fill="currentColor" />
        </svg>
        {totalUnread > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center font-mono-num">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      {/* Raised First-Person iPhone 18 Pro Inspired Smartphone */}
      {isOpen && (
        <div className="fixed right-20 bottom-5 sm:bottom-8 z-30 pointer-events-auto">
          <div
            ref={phoneRef}
            className="w-[310px] sm:w-[330px] h-[610px] max-h-[84vh] rounded-[42px] p-[9px] bg-gradient-to-b from-zinc-500 via-zinc-700 to-zinc-800 shadow-[0_24px_60px_rgba(0,0,0,0.75)] border border-zinc-400/40 relative flex flex-col"
          >
            {/* Inner OLED Bezel */}
            <div
              className="flex-1 rounded-[34px] overflow-hidden flex flex-col relative border border-black"
              style={{
                background:
                  activeApp === 'home'
                    ? WALLPAPERS[state.settings.wallpaperIndex % WALLPAPERS.length]
                    : '#090d16',
              }}
            >
              {/* Status Bar + Dynamic Island */}
              <div className="px-5 pt-2.5 pb-1.5 flex items-center justify-between text-[11px] font-semibold text-white shrink-0">
                <span className="font-mono-num">{timeInfo.timeStr}</span>

                {/* Dynamic Island */}
                <div className="w-24 h-6 rounded-full bg-black border border-zinc-800 flex items-center justify-between px-2.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-800" />
                  <span className="text-[9px] text-sky-400 font-mono-num">5G</span>
                </div>

                <div className="flex items-center gap-1 font-mono-num text-[10px]">
                  <span>94%</span>
                  <div className="w-4 h-2.5 rounded-sm border border-white/70 p-[1px]">
                    <div className="w-full h-full bg-emerald-400 rounded-[1px]" />
                  </div>
                </div>
              </div>

              {/* Active App Header */}
              {activeApp !== 'home' && (
                <div className="px-4 py-2 flex items-center justify-between border-b border-slate-800 bg-[#0b1120] shrink-0">
                  <button
                    onClick={() => {
                      eventBus.emit('audio:click');
                      setActiveApp('home');
                    }}
                    className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Màn hình chính</span>
                  </button>
                  <span className="text-xs font-semibold text-white">
                    {[...APP_LIST, ...DOCK_APPS].find((a) => a.id === activeApp)?.label}
                  </span>
                </div>
              )}

              {/* Screen Body */}
              {activeApp === 'home' ? (
                <div className="flex-1 flex flex-col justify-between p-4">
                  <div>
                    {/* Date & Weather header widget */}
                    <div className="text-center mt-2 mb-5">
                      <div className="font-display text-4xl font-bold text-white font-mono-num">
                        {timeInfo.timeStr}
                      </div>
                      <div className="text-xs text-sky-200/90 mt-0.5">
                        {timeInfo.dateStr} · {state.weather === 'rain' ? 'Trời mưa' : 'Nắng đẹp'}
                      </div>
                    </div>

                    {/* App Icon Grid */}
                    <div className="grid grid-cols-4 gap-x-2.5 gap-y-3.5">
                      {APP_LIST.map((app) => {
                        const badge = app.id === 'email' ? unreadMail : 0;
                        return (
                          <button
                            key={app.id}
                            onClick={() => {
                              eventBus.emit('audio:click');
                              setActiveApp(app.id);
                            }}
                            className="flex flex-col items-center gap-1 group cursor-pointer"
                          >
                            <div
                              className={`w-12 h-12 rounded-2xl ${app.bg} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform relative`}
                            >
                              {renderAppSvgIcon(app.id)}
                              {badge > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center font-mono-num">
                                  {badge}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-white/95 font-medium truncate w-full text-center">
                              {app.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Dock */}
                  <div className="rounded-2xl bg-slate-950/65 border border-white/10 p-2.5 grid grid-cols-4 gap-2">
                    {DOCK_APPS.map((app) => {
                      const badge = app.id === 'messages' ? unreadMsgs : 0;
                      return (
                        <button
                          key={app.id}
                          onClick={() => {
                            eventBus.emit('audio:click');
                            setActiveApp(app.id);
                          }}
                          className="flex flex-col items-center gap-1 cursor-pointer group relative"
                        >
                          <div
                            className={`w-11 h-11 rounded-xl ${app.bg} flex items-center justify-center group-hover:scale-105 transition-transform`}
                          >
                            {renderAppSvgIcon(app.id)}
                            {badge > 0 && (
                              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center font-mono-num">
                                {badge}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto sim-scroll p-3">
                  <SmartphoneAppContent
                    appId={activeApp}
                    state={state}
                    sim={sim}
                    captureCCTV={captureCCTV}
                    onUpdateAudio={onUpdateAudio}
                  />
                </div>
              )}

              {/* Home Gesture Bar */}
              <div className="py-2 flex justify-center shrink-0">
                <button
                  onClick={() => (activeApp === 'home' ? onToggle() : setActiveApp('home'))}
                  title={activeApp === 'home' ? 'Cất điện thoại' : 'Về màn hình chính'}
                  className="w-28 h-1 rounded-full bg-white/50 hover:bg-white/80 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
