import React, { useState } from 'react';
import {
  ArrowUpCircle,
  Bell,
  BookOpen,
  Briefcase,
  Camera,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Coffee,
  Cpu,
  FileSignature,
  Gift,
  Globe,
  GraduationCap,
  Handshake,
  Headset,
  Home,
  Landmark,
  LayoutGrid,
  Megaphone,
  MessageSquare,
  Minus,
  Package,
  PackageCheck,
  Phone,
  Plus,
  Receipt,
  RefreshCw,
  ShieldAlert,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Square,
  TrendingUp,
  Truck,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  Wallet,
  Wrench,
  X,
} from 'lucide-react';
import { EXPANSION_STAGES, type SimulationEngine } from '../core/simulationEngine';
import { formatGameTime, formatShortVND } from '../core/timeManager';
import type { GameState, InteractableTarget, OnlineOrderStatus } from '../core/types';

interface DeviceMonitorProps {
  target: InteractableTarget;
  state: GameState;
  sim: SimulationEngine;
  captureCCTV: (cam: 'showroom' | 'cashier' | 'tech' | 'warehouse' | 'entrance') => string | null;
  onClose: () => void;
}

type PCAppId =
  | 'desktop'
  | 'overview'
  | 'online'
  | 'hr'
  | 'attendance'
  | 'market'
  | 'suppliers'
  | 'complaints'
  | 'finance';

const ONLINE_STATUS_LABEL: Record<OnlineOrderStatus, string> = {
  new: 'Chờ CSKH duyệt',
  confirming: 'CSKH đang duyệt đơn',
  confirmed: 'Chờ Kho đóng gói',
  packing: 'Kho đang đóng gói',
  packed: 'Đã đóng gói (Chờ ship)',
  shipping: 'Đang giao hàng',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

const AppleLogoSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
  </svg>
);

const WindowsStartSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M3 3h8.5v8.5H3V3zm9.5 0H21v8.5h-8.5V3zM3 12.5h8.5V21H3v-8.5zm9.5 0H21V21h-8.5v-8.5z" />
  </svg>
);

export const DeviceMonitorModal: React.FC<DeviceMonitorProps> = ({
  target,
  state,
  sim,
  captureCCTV,
  onClose,
}) => {
  const [activeApp, setActiveApp] = useState<PCAppId>('desktop');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [supId, setSupId] = useState(state.suppliers[0]?.id ?? '');
  const [modId, setModId] = useState(state.models[0]?.id ?? '');
  const [qty, setQty] = useState(15);
  const [discount, setDiscount] = useState(7);
  const [termsDays, setTermsDays] = useState(15);
  const [dealQty, setDealQty] = useState<number | null>(null);
  const [dealDiscount, setDealDiscount] = useState<number | null>(null);
  const [complaintCamImg, setComplaintCamImg] = useState<string | null>(null);

  const timeInfo = formatGameTime(state.totalMinutes);

  // 1. DIRECTOR PC MONITOR (Icon-Driven Minh Chiêu Desktop OS)
  if (target.type === 'director_pc') {
    const todayTx = state.transactions.filter((t) => t.day === timeInfo.day);
    const todayRev = todayTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const todayProfit = todayTx.reduce((s, t) => s + t.profit, 0);
    const onlineOrders = state.onlineOrders ?? [];
    const activeOnlineCount = onlineOrders.filter(
      (o) => o.status !== 'delivered' && o.status !== 'cancelled',
    ).length;
    const deliveredOnlineRev = onlineOrders
      .filter((o) => o.status === 'delivered')
      .reduce((s, o) => s + o.totalAmount, 0);
    const openComplaintsCount = state.complaints.filter((c) => c.status === 'open').length;
    const curStage = EXPANSION_STAGES[state.expansionLevel - 1];
    const nextStage = EXPANSION_STAGES[state.expansionLevel];

    // Revenue breakdown by service type
    const sumByType = (txType: string) =>
      todayTx.filter((t) => t.type === txType).reduce((s, t) => s + Math.max(0, t.amount), 0);
    const revPhone = sumByType('sale');
    const revUsed = sumByType('trade_in');
    const revAcc = sumByType('accessory_sale');
    const revRepair = sumByType('repair');
    const revOnline = sumByType('online_sale');
    const revMax = Math.max(1, revPhone, revUsed, revAcc, revRepair, revOnline);

    const desktopApps: {
      id: Exclude<PCAppId, 'desktop'>;
      label: string;
      icon: React.ReactNode;
      colorClass: string;
      badge?: number;
    }[] = [
      {
        id: 'overview',
        label: 'Tổng quan',
        icon: <LayoutGrid className="w-6 h-6" />,
        colorClass: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
      },
      {
        id: 'online',
        label: 'Đơn Online',
        icon: <Globe className="w-6 h-6" />,
        colorClass: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
        badge: activeOnlineCount || undefined,
      },
      {
        id: 'hr',
        label: 'Nhân sự',
        icon: <Users className="w-6 h-6" />,
        colorClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      },
      {
        id: 'attendance',
        label: 'Chấm công',
        icon: <Clock className="w-6 h-6" />,
        colorClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      },
      {
        id: 'market',
        label: 'Kho & Giá',
        icon: <Smartphone className="w-6 h-6" />,
        colorClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      },
      {
        id: 'suppliers',
        label: 'Đối tác',
        icon: <Handshake className="w-6 h-6" />,
        colorClass: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
      },
      {
        id: 'complaints',
        label: 'Khiếu nại',
        icon: <ShieldAlert className="w-6 h-6" />,
        colorClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        badge: openComplaintsCount || undefined,
      },
      {
        id: 'finance',
        label: 'Tài chính',
        icon: <Landmark className="w-6 h-6" />,
        colorClass: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      },
    ];

    const csEmp = state.employees.find((e) => e.department === 'cs');
    const whEmp = state.employees.find((e) => e.department === 'warehouse');
    const shipEmp = state.employees.find((e) => e.department === 'shipping');

    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/90 p-2 md:p-4">
        {/* Physical Apple iMac Enclosure */}
        <div className="w-full max-w-5xl h-[86vh] flex flex-col items-center">
          <div className="w-full flex-1 min-h-0 rounded-2xl bg-[#070b14] p-1.5 border-[6px] border-slate-900 ring-1 ring-slate-600/60 shadow-2xl flex flex-col overflow-hidden">
            {/* macOS Top Menu Bar */}
            <div className="flex items-center justify-between px-4 py-1.5 bg-[#0b1120] border-b border-slate-800 shrink-0 rounded-t-lg">
              <div className="flex items-center gap-3">
                {/* macOS Window Traffic Lights */}
                <div className="flex items-center gap-1.5 pr-2 border-r border-slate-800">
                  <button
                    onClick={onClose}
                    className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-400 cursor-pointer"
                    title="Đóng iMac"
                  />
                  <span className="w-3 h-3 rounded-full bg-amber-400/90" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/90" />
                </div>
                <button
                  onClick={() => {
                    setActiveApp('desktop');
                    setFeedback(null);
                  }}
                  className="flex items-center gap-1.5 text-slate-100 hover:text-sky-300 transition-colors cursor-pointer"
                  title="Màn hình chính macOS"
                >
                  <AppleLogoSvg className="w-3.5 h-3.5 text-white" />
                  <span className="font-display font-bold text-xs tracking-wide">Minh Chiêu macOS</span>
                </button>
                {activeApp !== 'desktop' && (
                  <>
                    <span className="text-slate-600 text-xs">/</span>
                    <span className="text-xs font-medium text-sky-400">
                      {desktopApps.find((a) => a.id === activeApp)?.label}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono-num text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{timeInfo.dateStr}</span>
                  <span>·</span>
                  <span>{timeInfo.timeStr}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono-num text-emerald-400 font-semibold">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>{formatShortVND(state.businessBalance)}</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-md bg-slate-800 hover:bg-rose-600 text-slate-200 cursor-pointer"
                  title="Tắt màn hình iMac"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          {/* Desktop / Active App Workspace */}
          <div
            className="flex-1 overflow-y-auto sim-scroll p-5 text-slate-100"
            style={{
              background:
                activeApp === 'desktop'
                  ? 'radial-gradient(circle at 20% 20%, #172554 0%, #090d16 55%, #0f172a 100%)'
                  : '#090d16',
            }}
          >
            {feedback && (
              <div className="mb-4 px-3.5 py-2 rounded-lg bg-sky-950/90 border border-sky-500/40 text-xs text-sky-200 flex items-center justify-between gap-2">
                <span>{feedback}</span>
                <button onClick={() => setFeedback(null)} className="text-sky-400 hover:text-white cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* DESKTOP HOME LAUNCHER (Visual Icons Grid + Live Compact Strip) */}
            {activeApp === 'desktop' && (
              <div className="h-full flex flex-col justify-between gap-6">
                {/* Compact Top Live Widgets */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => setActiveApp('overview')}
                    className="p-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Doanh thu hôm nay</span>
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="font-mono-num text-xl font-bold text-emerald-400 mt-1.5">
                      {formatShortVND(todayRev)}
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveApp('finance')}
                    className="p-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Lợi nhuận gộp</span>
                      <Wallet className="w-4 h-4 text-sky-400" />
                    </div>
                    <div className="font-mono-num text-xl font-bold text-sky-400 mt-1.5">
                      {formatShortVND(todayProfit)}
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveApp('online')}
                    className="p-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Đơn Online</span>
                      <Truck className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="font-mono-num text-xl font-bold text-indigo-300 mt-1.5">
                      {activeOnlineCount} đang xử lý
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveApp('market')}
                    className="p-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Tồn kho · Khách</span>
                      <Package className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="font-mono-num text-xl font-bold text-amber-300 mt-1.5">
                      {sim.getTotalStock()} máy · {state.customers.length} khách
                    </div>
                  </button>
                </div>

                {/* Main Desktop App Icons Grid */}
                <div className="my-auto py-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
                    {desktopApps.map((app) => (
                      <button
                        key={app.id}
                        onClick={() => {
                          setActiveApp(app.id);
                          setFeedback(null);
                        }}
                        className="group relative flex flex-col items-center justify-center gap-2.5 p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 transition-all cursor-pointer"
                      >
                        {app.badge !== undefined && (
                          <span className="absolute top-3 right-3 font-mono-num text-xs font-bold text-amber-300">
                            {app.badge}
                          </span>
                        )}
                        <div
                          className={`w-14 h-14 rounded-2xl border flex items-center justify-center group-hover:scale-105 transition-transform ${app.colorClass}`}
                        >
                          {app.icon}
                        </div>
                        <span className="text-xs font-semibold text-slate-100 whitespace-nowrap">
                          {app.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Icon Shortcuts Footer inside Desktop */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => setFeedback(sim.launchOnlinePromoCampaign().message)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    <Megaphone className="w-4 h-4" />
                    <span>Quảng cáo Online (-2tr)</span>
                  </button>
                  <button
                    onClick={() => setFeedback(sim.assignWarehouseAudit().message)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold cursor-pointer"
                  >
                    <ClipboardCheck className="w-4 h-4 text-sky-400" />
                    <span>Kiểm kê kho</span>
                  </button>
                  <button
                    onClick={() => setActiveApp('suppliers')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold cursor-pointer"
                  >
                    <Handshake className="w-4 h-4 text-violet-400" />
                    <span>Nhập hàng sỉ</span>
                  </button>
                </div>
              </div>
            )}

            {/* APP 1: OVERVIEW */}
            {activeApp === 'overview' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">Doanh thu</div>
                      <div className="font-mono-num text-base font-bold text-emerald-400">{formatShortVND(todayRev)}</div>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">Lợi nhuận</div>
                      <div className="font-mono-num text-base font-bold text-sky-400">{formatShortVND(todayProfit)}</div>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">Khách tại quầy</div>
                      <div className="font-mono-num text-base font-bold text-white">{state.customers.length}</div>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">Đơn Online</div>
                      <div className="font-mono-num text-base font-bold text-indigo-300">{onlineOrders.length} đơn</div>
                    </div>
                  </div>
                </div>

                {/* 5-Channel Revenue Visual Bars */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Nguồn doanh thu hôm nay</span>
                    <span className="font-mono-num text-xs text-slate-400">Uy tín {Math.round(state.reputation)}/100</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    {[
                      { label: 'Bán điện thoại', val: revPhone, icon: <Smartphone className="w-4 h-4 text-sky-400" />, bar: 'bg-sky-500' },
                      { label: 'Thu mua máy cũ', val: revUsed, icon: <RefreshCw className="w-4 h-4 text-emerald-400" />, bar: 'bg-emerald-500' },
                      { label: 'Phụ kiện', val: revAcc, icon: <Sparkles className="w-4 h-4 text-amber-400" />, bar: 'bg-amber-500' },
                      { label: 'Sửa chữa', val: revRepair, icon: <Wrench className="w-4 h-4 text-teal-400" />, bar: 'bg-teal-500' },
                      { label: 'Đơn Online', val: revOnline, icon: <Truck className="w-4 h-4 text-indigo-400" />, bar: 'bg-indigo-500' },
                    ].map((ch) => (
                      <div key={ch.label} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          {ch.icon}
                          <span className="font-mono-num text-xs font-bold text-white">{formatShortVND(ch.val)}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{ch.label}</div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full ${ch.bar}`}
                            style={{ width: `${Math.max(4, Math.round((ch.val / revMax) * 100))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Running Tasks with Icons */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-white">Tác vụ đang chạy</span>
                      <button
                        onClick={() => setFeedback(sim.assignWarehouseAudit().message)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-sky-300 cursor-pointer"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        <span>Kiểm kê</span>
                      </button>
                    </div>
                    <div className="space-y-2">
                      {state.tasks.filter((t) => t.status === 'active').length === 0 ? (
                        <div className="text-xs text-slate-500 py-4 text-center">Chờ khách hàng hoặc đơn mới...</div>
                      ) : (
                        state.tasks
                          .filter((t) => t.status === 'active')
                          .slice(0, 6)
                          .map((t) => (
                            <div key={t.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                              <div className="flex items-center justify-between text-xs gap-2">
                                <span className="font-medium text-white truncate">{t.title}</span>
                                <span className="font-mono-num text-sky-400 shrink-0">{Math.round(t.progress * 100)}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-sky-500" style={{ width: `${Math.round(t.progress * 100)}%` }} />
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  {/* Active Store Customers by Service Icon */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="block text-xs font-semibold text-white mb-3">Khách hàng tại cửa hàng</span>
                    <div className="space-y-2">
                      {state.customers.length === 0 ? (
                        <div className="text-xs text-slate-500 py-4 text-center">Chưa có khách trong showroom</div>
                      ) : (
                        state.customers.slice(0, 6).map((c) => {
                          const tierIcon =
                            c.desiredTier === 'repair' ? (
                              <Wrench className="w-4 h-4 text-teal-400" />
                            ) : c.desiredTier === 'accessory' ? (
                              <Sparkles className="w-4 h-4 text-amber-400" />
                            ) : c.desiredTier === 'sell_used' ? (
                              <RefreshCw className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <ShoppingBag className="w-4 h-4 text-sky-400" />
                            );
                          const tierText =
                            c.desiredTier === 'repair'
                              ? c.repairIssue
                              : c.desiredTier === 'accessory'
                                ? c.accessoryItem
                                : c.desiredTier === 'sell_used'
                                  ? c.tradeInDevice
                                  : `Ngân sách ${formatShortVND(c.budget)}`;

                          return (
                            <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {tierIcon}
                                <div className="min-w-0">
                                  <div className="font-medium text-white truncate">{c.name}</div>
                                  <div className="text-[11px] text-slate-400 truncate">{tierText}</div>
                                </div>
                              </div>
                              <span className="font-mono-num text-[11px] text-sky-300 shrink-0">
                                {Math.round(c.patience)}%
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* APP 2: ONLINE ORDERS & SHIPPING */}
            {activeApp === 'online' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    {
                      label: 'Chờ CSKH',
                      val: onlineOrders.filter((o) => o.status === 'new' || o.status === 'confirming').length,
                      icon: <Headset className="w-5 h-5 text-indigo-400" />,
                    },
                    {
                      label: 'Đóng gói kho',
                      val: onlineOrders.filter((o) => o.status === 'confirmed' || o.status === 'packing').length,
                      icon: <PackageCheck className="w-5 h-5 text-amber-400" />,
                    },
                    {
                      label: 'Đang ship',
                      val: onlineOrders.filter((o) => o.status === 'shipping').length,
                      icon: <Truck className="w-5 h-5 text-orange-400" />,
                    },
                    {
                      label: 'Đã giao',
                      val: formatShortVND(deliveredOnlineRev),
                      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
                    },
                  ].map((k) => (
                    <div key={k.label} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                      {k.icon}
                      <div>
                        <div className="text-[11px] text-slate-400">{k.label}</div>
                        <div className="font-mono-num text-base font-bold text-white">{k.val}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Department Handoff Status Bar: CSKH -> Bộ phận Kho -> Vận chuyển */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <Headset className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 text-xs">
                      <div className="font-semibold text-white truncate">{csEmp?.name ?? 'Chưa có CSKH'}</div>
                      <div className="text-[11px] text-indigo-300 truncate">
                        {csEmp?.state === 'online_cs' ? 'CSKH đang duyệt đơn' : 'CSKH duyệt & chuyển kho'}
                      </div>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <PackageCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 text-xs">
                      <div className="font-semibold text-white truncate">{whEmp?.name ?? 'Chưa có Thủ kho'}</div>
                      <div className="text-[11px] text-amber-300 truncate">
                        {whEmp?.state === 'packing' ? 'Kho đang đóng gói' : 'Kho nhận đơn & đóng gói'}
                      </div>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 text-xs">
                      <div className="font-semibold text-white truncate">{shipEmp?.name ?? 'Chưa có Shipper'}</div>
                      <div className="text-[11px] text-orange-300 truncate">
                        {shipEmp?.state === 'shipping' ? 'Đang đi giao cho khách' : 'Chờ lấy kiện đã đóng gói'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setFeedback(sim.launchOnlinePromoCampaign().message)}
                    className="p-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer"
                  >
                    <Megaphone className="w-4 h-4" />
                    <span>Quảng cáo (-2tr)</span>
                  </button>
                </div>

                {/* Order List */}
                <div className="space-y-2">
                  {onlineOrders.length === 0 ? (
                    <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                      Chưa có đơn đặt hàng online. Nhấn nút Quảng cáo Online để kéo thêm đơn.
                    </div>
                  ) : (
                    onlineOrders.slice(0, 20).map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 text-sky-400">
                            {ord.status === 'shipping' ? (
                              <Truck className="w-4 h-4 text-orange-400" />
                            ) : ord.status === 'packing' || ord.status === 'confirmed' || ord.status === 'packed' ? (
                              <PackageCheck className="w-4 h-4 text-amber-400" />
                            ) : ord.status === 'delivered' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Globe className="w-4 h-4 text-indigo-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white flex items-center gap-2 flex-wrap">
                              <span className="font-mono-num text-sky-300">{ord.orderCode}</span>
                              <span>·</span>
                              <span>{ord.channel}</span>
                              <span>·</span>
                              <span className="truncate">{ord.quantity}x {ord.modelName}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {ord.customerName} ({ord.customerPhone}) · {ord.deliveryAddress}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate mt-0.5">
                              CSKH: {ord.csEmployeeName ?? 'Chờ nhận'} · Kho: {ord.packerEmployeeName ?? 'Chờ đóng'} · Ship: {ord.shipperEmployeeName ?? 'Chờ giao'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end">
                          <div className="text-right">
                            <div className="font-mono-num font-bold text-emerald-400">{formatShortVND(ord.totalAmount)}</div>
                            <div className="text-[11px] text-slate-300">{ONLINE_STATUS_LABEL[ord.status]}</div>
                          </div>
                          {ord.status === 'new' && (
                            <button
                              onClick={() => setFeedback(sim.confirmOnlineOrderNow(ord.id).message)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer"
                              title="Chuyển CSKH duyệt & đẩy xuống kho đóng gói"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>CSKH duyệt</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* APP 3: HR & RECRUITMENT */}
            {activeApp === 'hr' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">
                    Đội ngũ nhân sự ({state.employees.length}/{curStage.maxStaff})
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {state.employees.map((e) => (
                    <div key={e.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 border border-white/15"
                            style={{ backgroundColor: e.shirtColor }}
                          >
                            {e.name.split(' ').pop()?.[0] ?? 'N'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white text-xs truncate">{e.name}</div>
                            <div className="text-[11px] text-sky-400 truncate">{e.role}</div>
                          </div>
                        </div>
                        <div className="text-right font-mono-num text-xs shrink-0">
                          <div className="text-emerald-400 font-semibold">{formatShortVND(e.revenueGenerated)}</div>
                          <div className="text-[11px] text-slate-400">Lương {formatShortVND(e.salary)}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center font-mono-num text-[11px] bg-slate-950 p-2 rounded-lg border border-slate-800">
                        <div>
                          <div className="text-slate-500">Đơn</div>
                          <div className="text-white font-semibold">{e.ordersClosed}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Chuyên môn</div>
                          <div className="text-sky-300 font-semibold">{e.skill}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Tốc độ</div>
                          <div className="text-amber-300 font-semibold">{e.speed}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Tinh thần</div>
                          <div className="text-emerald-400 font-semibold">{e.morale}%</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            sim.adjustEmployeeSalary(e.id, 1_000_000);
                            setFeedback(`+1 triệu lương cho ${e.name}.`);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-white cursor-pointer"
                          title="Tăng lương +1 triệu"
                        >
                          <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                          <span>+1tr</span>
                        </button>
                        <button
                          onClick={() => {
                            const ok = sim.bonusEmployee(e.id, 1_500_000);
                            setFeedback(ok ? `Đã thưởng 1.5tr cho ${e.name}.` : 'Không đủ số dư.');
                          }}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-[11px] text-emerald-200 cursor-pointer"
                          title="Thưởng nóng 1.5 triệu"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          <span>Thưởng</span>
                        </button>
                        <button
                          onClick={() => {
                            const ok = sim.trainEmployee(e.id);
                            setFeedback(ok ? `${e.name} đi đào tạo 2 ngày.` : 'Không thể đào tạo lúc này.');
                          }}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-sky-900/60 hover:bg-sky-800 text-[11px] text-sky-200 cursor-pointer"
                          title="Đào tạo chuyên môn (4tr)"
                        >
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>Đào tạo</span>
                        </button>
                        {!e.isAssistant && (
                          <button
                            onClick={() => setFeedback(sim.fireEmployee(e.id).message)}
                            className="p-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 cursor-pointer"
                            title="Sa thải"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {state.candidates.length > 0 && (
                  <div className="space-y-2.5">
                    <span className="block text-xs font-semibold text-white">Ứng viên sẵn sàng</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {state.candidates.map((c) => (
                        <div key={c.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold text-white text-xs truncate">
                              {c.name} ({c.age}t) · {c.role}
                            </div>
                            <div className="text-[11px] font-mono-num text-slate-400 mt-1">
                              SK {c.skill} · SP {c.speed} · GT {c.communication} · {formatShortVND(c.expectedSalary)}/th
                            </div>
                          </div>
                          <button
                            onClick={() => setFeedback(sim.hireCandidate(c.id).message)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs shrink-0 cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Tuyển</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* APP 4: ATTENDANCE */}
            {activeApp === 'attendance' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-semibold text-white">
                    <UserCheck className="w-4 h-4 text-amber-400" />
                    <span>Chấm công ca 06:00 – 22:00</span>
                  </div>
                  <span className="font-mono-num text-sky-300">
                    {timeInfo.hour >= 22 || timeInfo.hour < 6 ? 'Đã tan làm' : 'Đang trong ca'}
                  </span>
                </div>
                {(state.attendanceLogs ?? []).length === 0 ? (
                  <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 text-center">
                    Báo cáo chấm công tự động tổng hợp lúc 22:00 hàng ngày.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-400">
                        <tr>
                          <th className="p-3">Ngày</th>
                          <th className="p-3">Nhân viên</th>
                          <th className="p-3">Vào</th>
                          <th className="p-3">Ra</th>
                          <th className="p-3">Đơn</th>
                          <th className="p-3">Doanh số</th>
                          <th className="p-3">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {(state.attendanceLogs ?? []).map((rec) => (
                          <tr key={`${rec.day}_${rec.employeeId}`} className="hover:bg-slate-900/50">
                            <td className="p-3 font-mono-num text-slate-300">{rec.day}</td>
                            <td className="p-3 font-medium text-white">{rec.employeeName}</td>
                            <td className="p-3 font-mono-num text-sky-300">{rec.checkInTime}</td>
                            <td className="p-3 font-mono-num text-amber-300">{rec.checkOutTime}</td>
                            <td className="p-3 font-mono-num">{rec.ordersClosed}</td>
                            <td className="p-3 font-mono-num text-emerald-400">{formatShortVND(rec.revenueGenerated)}</td>
                            <td className="p-3 text-emerald-300">{rec.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* APP 5: MARKET & INVENTORY */}
            {activeApp === 'market' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Bảng giá & Tồn kho ({sim.getTotalStock()} máy)</span>
                  <button
                    onClick={() => setFeedback(sim.assignWarehouseAudit().message)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-sky-300 cursor-pointer"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>Kiểm kê kho</span>
                  </button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400">
                      <tr>
                        <th className="p-3">Sản phẩm</th>
                        <th className="p-3">Nhu cầu</th>
                        <th className="p-3">Kho</th>
                        <th className="p-3">Giá nhập</th>
                        <th className="p-3">Giá bán</th>
                        <th className="p-3">Chỉnh giá</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {state.models.map((m) => (
                        <tr key={m.id}>
                          <td className="p-3">
                            <div className="font-semibold text-white">{m.model}</div>
                            <div className="text-[11px] text-slate-400">{m.brand} · {m.storage}</div>
                          </td>
                          <td className="p-3 font-mono-num text-sky-300">{m.marketDemand}x</td>
                          <td className={`p-3 font-mono-num font-bold ${m.stock <= 2 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {m.stock}
                          </td>
                          <td className="p-3 font-mono-num text-slate-300">{formatShortVND(m.wholesalePrice)}</td>
                          <td className="p-3 font-mono-num font-semibold text-white">{formatShortVND(m.retailPrice)}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => sim.updateRetailPrice(m.id, m.retailPrice - 500_000)}
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer"
                                title="Giảm 500k"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => sim.updateRetailPrice(m.id, m.retailPrice + 500_000)}
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer"
                                title="Tăng 500k"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* APP 6: SUPPLIERS & CONTRACTS */}
            {activeApp === 'suppliers' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <Handshake className="w-4 h-4 text-violet-400" />
                    <span>Đàm phán & Nhập hàng</span>
                  </div>
                  <select
                    value={supId}
                    onChange={(e) => setSupId(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    {state.suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · Uy tín {s.reputation}
                      </option>
                    ))}
                  </select>
                  <select
                    value={modId}
                    onChange={(e) => setModId(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    {state.models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.model} ({m.storage}) · {formatShortVND(m.wholesalePrice)}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="text-[11px] text-slate-400">
                      Số lượng
                      <input
                        type="number"
                        min={5}
                        max={200}
                        value={qty}
                        onChange={(e) => setQty(Number(e.target.value))}
                        className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono-num"
                      />
                    </label>
                    <label className="text-[11px] text-slate-400">
                      Chiết khấu %
                      <input
                        type="number"
                        min={1}
                        max={22}
                        value={discount}
                        onChange={(e) => setDiscount(Number(e.target.value))}
                        className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono-num"
                      />
                    </label>
                    <label className="text-[11px] text-slate-400">
                      Công nợ (ng)
                      <input
                        type="number"
                        min={0}
                        max={45}
                        value={termsDays}
                        onChange={(e) => setTermsDays(Number(e.target.value))}
                        className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono-num"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => setFeedback(sim.negotiateContract(supId, modId, qty, discount, termsDays).message)}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs cursor-pointer"
                    >
                      <Handshake className="w-4 h-4" />
                      <span>Mời Phòng Khách deal giá</span>
                    </button>
                    <button
                      onClick={() => setFeedback(sim.placeWholesaleOrder(supId, modId, qty, 5, true).message)}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium cursor-pointer"
                    >
                      <Package className="w-4 h-4" />
                      <span>Đặt ngay (-5%)</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <span className="block text-xs font-semibold text-white">Hợp đồng đang chạy</span>
                  {state.contracts.length === 0 ? (
                    <div className="text-xs text-slate-500 py-6 text-center">Chưa có hợp đồng</div>
                  ) : (
                    state.contracts.map((c) => {
                      const curOffer = c.supplierOfferDiscount ?? c.discountPercent;
                      const proposedPct = dealDiscount ?? Math.min(25, curOffer + 2);
                      const mood = c.supplierMood ?? 80;
                      return (
                        <div key={c.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
                          <div className="flex justify-between font-semibold text-white">
                            <span>{c.quantity}x {c.modelName}</span>
                            <span className="text-sky-400 font-mono-num">{formatShortVND(c.totalValue)}</span>
                          </div>
                          <div className="text-emerald-300 text-[11px]">{c.stageLabel}</div>

                          {c.status === 'rep_visiting' && c.priceAgreed === false && (
                            <div className="p-2.5 rounded-lg bg-slate-900 border border-amber-500/30 space-y-2">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-amber-300 font-medium font-mono-num">
                                  Chào giá: -{curOffer}% · Vòng {c.negotiationRound ?? 1}/{c.maxNegotiationRounds ?? 4}
                                </span>
                                <span className="text-slate-300 font-mono-num">Thiện cảm {mood}%</span>
                              </div>
                              {c.lastNegotiationNote && (
                                <p className="text-[11px] text-slate-300 italic leading-relaxed">
                                  “{c.lastNegotiationNote}”
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-1.5">
                                <label className="flex items-center gap-1 text-[11px] text-slate-400">
                                  <span>Trả %:</span>
                                  <input
                                    type="number"
                                    min={1}
                                    max={25}
                                    value={proposedPct}
                                    onChange={(e) => setDealDiscount(Number(e.target.value))}
                                    className="w-14 px-1.5 py-1 rounded bg-slate-950 border border-slate-700 text-white font-mono-num"
                                  />
                                </label>
                                <button
                                  onClick={() => {
                                    const r = sim.submitPriceDeal(c.id, proposedPct, c.quantity);
                                    setFeedback(r.message);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-[11px] cursor-pointer"
                                >
                                  Trả giá này
                                </button>
                                <button
                                  onClick={() => setFeedback(sim.acceptSupplierOffer(c.id).message)}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] cursor-pointer"
                                >
                                  Chốt -{curOffer}%
                                </button>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Hoặc qua Phòng Tiếp Khách mời cà phê &amp; deal trực tiếp với đối tác.
                              </div>
                            </div>
                          )}

                          {c.status === 'rep_visiting' && c.priceAgreed !== false && (
                            <button
                              onClick={() => setFeedback(sim.signContract(c.id).message)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer"
                            >
                              <FileSignature className="w-3.5 h-3.5" />
                              <span>Ký HĐ tại Phòng Khách &amp; Cọc 30%</span>
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* APP 7: COMPLAINTS */}
            {activeApp === 'complaints' && (
              <div className="space-y-4">
                {complaintCamImg && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 flex items-center gap-4">
                    <img src={complaintCamImg} alt="Camera" className="w-44 rounded border border-slate-700" />
                    <button
                      onClick={() => setComplaintCamImg(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-200 cursor-pointer"
                    >
                      Đóng Camera
                    </button>
                  </div>
                )}

                {state.complaints.length === 0 ? (
                  <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 text-center">
                    Không có khiếu nại tồn đọng.
                  </div>
                ) : (
                  state.complaints.map((c) => (
                    <div key={c.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="font-semibold text-white">{c.customerName} · NV: {c.employeeName}</div>
                          <div className="text-slate-400 mt-0.5">{c.description}</div>
                        </div>
                        <span className={c.status === 'open' ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                          {c.status === 'open' ? 'Chờ xử lý' : 'Đã xong'}
                        </span>
                      </div>

                      {c.status === 'open' ? (
                        <>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                sim.inspectComplaintEvidence(c.id, 'camera');
                                setComplaintCamImg(captureCCTV('showroom'));
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer ${
                                c.evidenceChecked.camera
                                  ? 'bg-sky-900/50 border-sky-500 text-sky-200'
                                  : 'bg-slate-950 border-slate-700 text-slate-300'
                              }`}
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>Camera</span>
                            </button>
                            <button
                              onClick={() => sim.inspectComplaintEvidence(c.id, 'receipt')}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer ${
                                c.evidenceChecked.receipt
                                  ? 'bg-sky-900/50 border-sky-500 text-sky-200'
                                  : 'bg-slate-950 border-slate-700 text-slate-300'
                              }`}
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Hóa đơn</span>
                            </button>
                            <button
                              onClick={() => sim.inspectComplaintEvidence(c.id, 'statement')}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer ${
                                c.evidenceChecked.statement
                                  ? 'bg-sky-900/50 border-sky-500 text-sky-200'
                                  : 'bg-slate-950 border-slate-700 text-slate-300'
                              }`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Giải trình</span>
                            </button>
                          </div>

                          {(c.evidenceChecked.camera || c.evidenceChecked.receipt || c.evidenceChecked.statement) && (
                            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sky-300">
                              {c.verifiedTruth === 'employee_fault'
                                ? 'Xác minh: Nhân viên có sai sót nghiệp vụ.'
                                : c.verifiedTruth === 'customer_misunderstanding'
                                  ? 'Xác minh: Nhân viên đúng quy trình.'
                                  : 'Xác minh: Sai lệch hệ thống.'}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setFeedback(sim.resolveComplaint(c.id, 'no_fault').message)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Vô tội</span>
                            </button>
                            <button
                              onClick={() => setFeedback(sim.resolveComplaint(c.id, 'remind').message)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white cursor-pointer"
                            >
                              <Bell className="w-3.5 h-3.5" />
                              <span>Nhắc nhở</span>
                            </button>
                            <button
                              onClick={() => setFeedback(sim.resolveComplaint(c.id, 'retrain').message)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-600 text-white cursor-pointer"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Đào tạo</span>
                            </button>
                            <button
                              onClick={() => setFeedback(sim.resolveComplaint(c.id, 'fire').message)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-700 text-white cursor-pointer"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                              <span>Sa thải</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-emerald-300">{c.resolution}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* APP 8: FINANCE & BANK LOANS */}
            {activeApp === 'finance' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-sky-400 font-semibold">Cấp {state.expansionLevel}/7 · {curStage.name}</div>
                      <div className="text-[11px] text-slate-400">Tối đa {curStage.maxStaff} nhân sự</div>
                    </div>
                  </div>
                  {nextStage && (
                    <button
                      onClick={() => setFeedback(sim.upgradeExpansion().message)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs cursor-pointer"
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                      <span>Nâng cấp ({formatShortVND(nextStage.upgradeCost)})</span>
                    </button>
                  )}
                </div>

                {/* Bank Loans */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-white">
                      <Landmark className="w-4 h-4 text-amber-400" />
                      <span>Ngân hàng (Hạn mức 500tr)</span>
                    </div>
                    <span className="font-mono-num text-sm font-bold text-amber-400">Nợ: {formatShortVND(state.loanDebt)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { amount: 50_000_000, label: '+50tr' },
                      { amount: 150_000_000, label: '+150tr' },
                      { amount: 300_000_000, label: '+300tr' },
                    ].map((pkg) => (
                      <button
                        key={pkg.amount}
                        onClick={() => setFeedback(sim.takeLoan(pkg.amount).message)}
                        className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs font-mono-num cursor-pointer"
                      >
                        Vay {pkg.label}
                      </button>
                    ))}
                    <button
                      onClick={() => setFeedback(sim.repayLoan(50_000_000).message)}
                      disabled={state.loanDebt <= 0}
                      className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-semibold text-xs font-mono-num cursor-pointer"
                    >
                      Trả 50tr
                    </button>
                    <button
                      onClick={() => setFeedback(sim.repayLoan(state.loanDebt).message)}
                      disabled={state.loanDebt <= 0}
                      className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs cursor-pointer"
                    >
                      Tất toán
                    </button>
                  </div>
                </div>

                {/* Ledger */}
                <div className="space-y-1.5">
                  {state.transactions.slice(0, 20).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Cpu className="w-4 h-4 text-slate-500 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-white truncate">{tx.itemName}</div>
                          <div className="text-[11px] text-slate-400 truncate">
                            Ngày {tx.day} · {tx.customerName ?? tx.note ?? ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono-num shrink-0">
                        <div className={tx.amount >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                          {tx.amount >= 0 ? '+' : ''}{formatShortVND(tx.amount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

            {/* macOS Bottom Dock */}
            <div className="px-3 py-2 bg-[#0b1120] border-t border-slate-800 flex items-center justify-center gap-1.5 overflow-x-auto shrink-0">
              <button
                onClick={() => {
                  setActiveApp('desktop');
                  setFeedback(null);
                }}
                className={`p-2 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                  activeApp === 'desktop'
                    ? 'bg-sky-500 text-slate-950 border-sky-400'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
                title="Desktop macOS"
              >
                <Home className="w-4 h-4" />
              </button>
              {desktopApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => {
                    setActiveApp(app.id);
                    setFeedback(null);
                  }}
                  className={`relative flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                    activeApp === app.id
                      ? 'bg-sky-500 text-slate-950 border-sky-400 font-semibold'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                  title={app.label}
                >
                  <span className="w-4 h-4 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">{app.icon}</span>
                  <span className="hidden md:inline">{app.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Brushed Silver Aluminum iMac Bottom Chin with Apple Logo & Stand */}
          <div className="w-full h-11 bg-gradient-to-b from-slate-200 to-slate-300 rounded-b-xl border-x border-b border-slate-400 flex items-center justify-center shrink-0 shadow-inner">
            <AppleLogoSvg className="w-5 h-5 text-slate-800" />
          </div>
          <div className="w-28 h-5 bg-gradient-to-b from-slate-300 to-slate-400 border-x border-slate-500 shrink-0" />
          <div className="w-56 h-2 rounded-b-md bg-slate-300 border border-slate-400 shrink-0" />
        </div>
      </div>
    );
  }

  // 2. EMPLOYEE WINDOWS 11 PC MONITORS
  const onlineOrders = state.onlineOrders ?? [];
  const isWindowsPc =
    target.type === 'pos_terminal' ||
    target.type === 'online_cs_desk' ||
    target.type === 'assistant_pc' ||
    target.type === 'tech_pc';

  if (isWindowsPc) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-3 md:p-6">
        {/* Physical Matte Black Windows Monitor */}
        <div
          className="w-full max-w-3xl h-[78vh] rounded-xl border-[6px] border-slate-900 ring-1 ring-slate-700 shadow-2xl flex flex-col overflow-hidden"
          style={{
            background: 'radial-gradient(circle at 28% 25%, #1d4ed8 0%, #0f172a 55%, #020617 100%)',
          }}
        >
          {/* Floating Windows 11 App Window */}
          <div className="flex-1 min-h-0 p-3 md:p-5 flex flex-col">
            <div className="flex-1 min-h-0 rounded-lg bg-[#0f172a] border border-slate-700 shadow-2xl flex flex-col overflow-hidden text-slate-100">
              {/* Windows 11 Title Bar */}
              <div className="flex items-center justify-between px-3.5 py-2 bg-[#111827] border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <WindowsStartSvg className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="text-xs font-semibold text-white truncate">{target.label}</span>
                  {target.sublabel && (
                    <span className="hidden sm:inline text-[11px] text-slate-400 truncate">
                      — {target.sublabel}
                    </span>
                  )}
                </div>
                <div className="flex items-center shrink-0">
                  <span className="p-1.5 text-slate-400" title="Thu nhỏ">
                    <Minus className="w-3.5 h-3.5" />
                  </span>
                  <span className="p-1.5 text-slate-400" title="Phóng to">
                    <Square className="w-3 h-3" />
                  </span>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded hover:bg-rose-600 text-slate-200 cursor-pointer"
                    title="Đóng cửa sổ Windows"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Windows App Body */}
              <div className="flex-1 overflow-y-auto sim-scroll p-4 space-y-3">
                {feedback && (
                  <div className="p-2.5 rounded-lg bg-sky-950/90 border border-sky-500/40 text-xs text-sky-200 flex items-center justify-between">
                    <span>{feedback}</span>
                    <button onClick={() => setFeedback(null)} className="text-sky-400 hover:text-white cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {target.type === 'pos_terminal' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Minh Chiêu POS · Giao dịch tại quầy &amp; Online</span>
                      <span className="font-mono-num text-emerald-400 font-semibold">
                        Quỹ: {formatShortVND(state.businessBalance)}
                      </span>
                    </div>
                    {state.transactions.filter(
                      (t) =>
                        t.type === 'sale' ||
                        t.type === 'online_sale' ||
                        t.type === 'accessory_sale' ||
                        t.type === 'trade_in' ||
                        t.type === 'repair',
                    ).length === 0 ? (
                      <div className="text-xs text-slate-500 py-8 text-center">
                        Chưa có giao dịch tại quầy POS hôm nay.
                      </div>
                    ) : (
                      state.transactions
                        .filter(
                          (t) =>
                            t.type === 'sale' ||
                            t.type === 'online_sale' ||
                            t.type === 'accessory_sale' ||
                            t.type === 'trade_in' ||
                            t.type === 'repair',
                        )
                        .slice(0, 15)
                        .map((tx) => (
                          <div
                            key={tx.id}
                            className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center text-xs"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-white truncate">{tx.itemName}</div>
                              <div className="text-[11px] text-slate-400 truncate">
                                Khách: {tx.customerName} · {tx.employeeName}
                              </div>
                            </div>
                            <div className="font-mono-num text-emerald-400 font-semibold shrink-0 ml-3">
                              {formatShortVND(tx.amount)}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                )}

                {target.type === 'online_cs_desk' && (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Headset className="w-4 h-4 text-indigo-400" />
                        <span className="font-semibold text-white">
                          CSKH duyệt đơn &amp; Chuyển Bộ phận Kho đóng gói
                        </span>
                      </div>
                      <span className="font-mono-num text-indigo-300">
                        {onlineOrders.filter((o) => o.status === 'new' || o.status === 'confirming').length} chờ duyệt
                      </span>
                    </div>

                    {onlineOrders.filter((o) => o.status === 'new' || o.status === 'confirming').length === 0 ? (
                      <div className="text-slate-400 py-4 text-center bg-slate-950/60 rounded-lg border border-slate-800">
                        Không có đơn mới chờ duyệt.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {onlineOrders
                          .filter((o) => o.status === 'new' || o.status === 'confirming')
                          .map((o) => (
                            <div
                              key={o.id}
                              className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center gap-3"
                            >
                              <div className="min-w-0">
                                <div className="font-semibold text-white truncate">
                                  {o.orderCode} · {o.quantity}x {o.modelName}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">
                                  {o.channel} · {o.customerName} ({o.customerPhone})
                                </div>
                              </div>
                              {o.status === 'new' ? (
                                <button
                                  onClick={() => setFeedback(sim.confirmOnlineOrderNow(o.id).message)}
                                  className="px-2.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shrink-0 cursor-pointer"
                                >
                                  Duyệt &amp; Chuyển kho
                                </button>
                              ) : (
                                <span className="text-indigo-300 font-medium shrink-0">
                                  {ONLINE_STATUS_LABEL[o.status]}
                                </span>
                              )}
                            </div>
                          ))}
                      </div>
                    )}

                    <div className="text-[11px] font-semibold text-slate-400 pt-1">
                      Đơn đã duyệt chuyển Kho &amp; Giao vận
                    </div>
                    <div className="space-y-1.5">
                      {onlineOrders
                        .filter(
                          (o) =>
                            o.status === 'confirmed' ||
                            o.status === 'packing' ||
                            o.status === 'packed' ||
                            o.status === 'shipping',
                        )
                        .slice(0, 6)
                        .map((o) => (
                          <div
                            key={o.id}
                            className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between items-center"
                          >
                            <span className="text-slate-200 truncate">
                              {o.orderCode} · {o.modelName}
                            </span>
                            <span className="text-amber-300 shrink-0 ml-2">{ONLINE_STATUS_LABEL[o.status]}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {target.type === 'assistant_pc' && (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-3 gap-2 font-mono-num">
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <div className="text-slate-400 text-[11px]">Khách tại cửa hàng</div>
                        <div className="text-base font-bold text-white mt-0.5">{state.customers.length}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <div className="text-slate-400 text-[11px]">Đơn Online mở</div>
                        <div className="text-base font-bold text-indigo-300 mt-0.5">
                          {onlineOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <div className="text-slate-400 text-[11px]">Tồn kho</div>
                        <div className="text-base font-bold text-emerald-400 mt-0.5">{sim.getTotalStock()} máy</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          const low = state.models.filter((m) => m.stock <= 4).map((m) => `${m.model} (${m.stock})`);
                          setFeedback(low.length > 0 ? `Sắp hết hàng: ${low.join(', ')}` : 'Tồn kho đang ổn định.');
                        }}
                        className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold cursor-pointer"
                      >
                        Kiểm tra máy sắp hết
                      </button>
                      <button
                        onClick={() => setFeedback(sim.assignWarehouseAudit().message)}
                        className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                      >
                        Giao Thủ kho kiểm kê
                      </button>
                      {!state.activeSupplierVisitId && (
                        <button
                          onClick={() => {
                            const s = state.suppliers[0];
                            const m = state.models[0];
                            if (s && m) {
                              setFeedback(sim.negotiateContract(s.id, m.id, 12, 6, 15).message);
                            }
                          }}
                          className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold cursor-pointer"
                        >
                          Mời đối tác vào Phòng Khách
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {target.type === 'tech_pc' && (
                  <div className="space-y-3 text-xs">
                    <div className="text-slate-400">
                      Hệ thống Windows chẩn đoán phần cứng &amp; tiến độ 3 kỹ thuật viên
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {state.employees
                        .filter((e) => e.department === 'tech')
                        .map((tech) => (
                          <div key={tech.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                            <div className="font-semibold text-white truncate">{tech.name}</div>
                            <div className="text-[11px] text-emerald-400 mt-0.5">
                              {tech.state === 'repairing' ? 'Đang sửa máy' : 'Sẵn sàng'}
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="space-y-2">
                      {state.tasks.filter((t) => t.type === 'repair' && t.status === 'active').length === 0 ? (
                        <div className="text-slate-500 py-4 text-center bg-slate-950/60 rounded-lg border border-slate-800">
                          Hiện chưa có ca sửa chữa đang chạy.
                        </div>
                      ) : (
                        state.tasks
                          .filter((t) => t.type === 'repair' && t.status === 'active')
                          .map((t) => (
                            <div key={t.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                              <div className="flex justify-between">
                                <span className="font-semibold text-white">{t.title}</span>
                                <span className="font-mono-num text-sky-400">{Math.round(t.progress * 100)}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${Math.round(t.progress * 100)}%` }} />
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Windows 11 Bottom Taskbar */}
          <div className="px-4 py-1.5 bg-[#0b1120] border-t border-slate-700/80 flex items-center justify-between text-xs shrink-0">
            <div className="text-[11px] text-slate-400 font-medium hidden sm:block">Windows 11 Pro</div>
            <div className="flex items-center gap-2 mx-auto sm:mx-0">
              <span className="p-1.5 rounded bg-slate-800 text-sky-400">
                <WindowsStartSvg className="w-4 h-4" />
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-800/90 border border-slate-700 text-[11px] text-slate-100">
                {target.label}
              </span>
            </div>
            <div className="text-[11px] font-mono-num text-slate-300 text-right">
              <div>{timeInfo.timeStr}</div>
              <div className="text-[10px] text-slate-400">{timeInfo.dateStr}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. IN-WORLD VIP RECEPTION, BENCH & NPC INTERACTION CARDS
  const assistant = state.employees.find((e) => e.isAssistant);
  const clickedEmp = target.payloadId ? state.employees.find((e) => e.id === target.payloadId) : undefined;
  const activeVisitContract = state.activeSupplierVisitId
    ? state.contracts.find((c) => c.id === state.activeSupplierVisitId)
    : undefined;

  return (
    <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-xl rounded-xl bg-slate-900 border border-slate-700 p-5 text-slate-100 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-display text-base font-bold text-white">{target.label}</h3>
            {target.sublabel && <div className="text-xs text-sky-400">{target.sublabel}</div>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {feedback && (
          <div className="p-2.5 rounded-lg bg-sky-950/80 border border-sky-500/40 text-xs text-sky-200">
            {feedback}
          </div>
        )}

        {target.type === 'packing_bench' && (
          <div className="space-y-2 max-h-72 overflow-y-auto sim-scroll text-xs">
            <div className="text-slate-400">Đơn đã duyệt chờ Kho đóng gói &amp; Shipper giao khách</div>
            {onlineOrders.filter(
              (o) => o.status === 'confirmed' || o.status === 'packing' || o.status === 'packed' || o.status === 'shipping',
            ).length === 0 ? (
              <div className="text-slate-500 py-4">Chưa có kiện hàng đang đóng gói hoặc đi giao.</div>
            ) : (
              onlineOrders
                .filter(
                  (o) => o.status === 'confirmed' || o.status === 'packing' || o.status === 'packed' || o.status === 'shipping',
                )
                .map((o) => (
                  <div
                    key={o.id}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        {o.orderCode} · {o.quantity}x {o.modelName}
                      </div>
                      <div className="text-[11px] text-slate-400">{o.deliveryAddress}</div>
                    </div>
                    <span className="text-orange-300 font-medium">{ONLINE_STATUS_LABEL[o.status]}</span>
                  </div>
                ))
            )}
          </div>
        )}

        {target.type === 'filing_cabinet' && (
          <div className="space-y-2 max-h-72 overflow-y-auto sim-scroll">
            {state.contracts.length === 0 ? (
              <div className="text-xs text-slate-400 py-3">Tủ hồ sơ chưa có hợp đồng đối tác nào.</div>
            ) : (
              state.contracts.map((c) => (
                <div key={c.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>{c.supplierName}</span>
                    <span className="font-mono-num text-sky-400">{formatShortVND(c.totalValue)}</span>
                  </div>
                  <div className="text-slate-300">
                    {c.quantity}x {c.modelName} (-{c.discountPercent}%)
                  </div>
                  <div className="text-emerald-300">{c.stageLabel}</div>
                </div>
              ))
            )}
          </div>
        )}

        {target.type === 'desk_phone' && (
          <div className="space-y-2">
            {state.suppliers.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs"
              >
                <div>
                  <div className="font-semibold text-white">
                    {s.repName} ({s.name})
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {s.brands.join(', ')} · {s.phone}
                  </div>
                </div>
                <button
                  onClick={() => {
                    sim.recordCall(s.repName, s.name, 'Gọi từ điện thoại bàn Giám đốc mời tới Phòng Tiếp Khách');
                    setFeedback(`Đã gọi điện trao đổi với ${s.repName}.`);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Gọi</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {target.type === 'assistant_npc' && assistant && (
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 leading-relaxed text-slate-200">
              “Cửa hàng hiện có <b className="text-white">{state.customers.length} khách</b>,{' '}
              <b className="text-indigo-300">
                {onlineOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length} đơn online
              </b>{' '}
              và tồn kho <b className="text-sky-300">{sim.getTotalStock()} máy</b>.
              {activeVisitContract
                ? ` Đối tác ${activeVisitContract.repName} đang chờ sếp tại Phòng Tiếp Khách để ký hợp đồng!”`
                : '”'}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const low = state.models.filter((m) => m.stock <= 3).map((m) => m.model);
                  setFeedback(low.length > 0 ? `Sắp hết: ${low.join(', ')}` : 'Tồn kho ổn định.');
                }}
                className="px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold cursor-pointer"
              >
                Kiểm tra tồn kho
              </button>
              <button
                onClick={() => setFeedback(sim.assignWarehouseAudit().message)}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              >
                Giao kiểm kê
              </button>
              {!activeVisitContract && (
                <button
                  onClick={() => {
                    const s = state.suppliers[0];
                    const m = state.models[0];
                    if (s && m) {
                      setFeedback(sim.negotiateContract(s.id, m.id, 12, 6, 15).message);
                    }
                  }}
                  className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold cursor-pointer"
                >
                  Đón đối tác vào Phòng Khách
                </button>
              )}
            </div>
          </div>
        )}

        {target.type === 'employee_npc' && clickedEmp && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2 font-mono-num">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Trạng thái</div>
                <div className="text-sky-300 font-semibold mt-0.5">{clickedEmp.state}</div>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Hiệu suất</div>
                <div className="text-white font-semibold mt-0.5">{clickedEmp.performance}/100</div>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Tinh thần</div>
                <div className="text-emerald-400 font-semibold mt-0.5">{clickedEmp.morale}%</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const ok = sim.bonusEmployee(clickedEmp.id, 1_000_000);
                  setFeedback(ok ? `Đã thưởng 1 triệu cho ${clickedEmp.name}.` : 'Ngân sách không đủ.');
                }}
                className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium cursor-pointer"
              >
                Thưởng 1tr
              </button>
              <button
                onClick={() => {
                  const ok = sim.trainEmployee(clickedEmp.id);
                  setFeedback(ok ? `${clickedEmp.name} đi đào tạo 2 ngày.` : 'Không thể đào tạo.');
                }}
                className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium cursor-pointer"
              >
                Đào tạo (4tr)
              </button>
            </div>
          </div>
        )}

        {(target.type === 'supplier_rep' || target.type === 'vip_table') && (
          <div className="space-y-3 text-xs">
            {activeVisitContract ? (
              (() => {
                const listUnit = activeVisitContract.listUnitPrice ?? activeVisitContract.unitPrice;
                const offerDisc = activeVisitContract.supplierOfferDiscount ?? activeVisitContract.discountPercent;
                const effectiveDealQty = Math.max(5, Math.min(200, dealQty ?? activeVisitContract.quantity));
                const effectiveDealDiscount = Math.max(
                  1,
                  Math.min(25, dealDiscount ?? Math.min(20, offerDisc + 3)),
                );
                const proposedUnitPrice = Math.round(listUnit * (1 - effectiveDealDiscount / 100));
                const proposedTotal = proposedUnitPrice * effectiveDealQty;
                const mood = activeVisitContract.supplierMood ?? 82;
                const round = activeVisitContract.negotiationRound ?? 1;
                const maxRounds = activeVisitContract.maxNegotiationRounds ?? 4;
                const moodColor =
                  mood >= 65 ? 'bg-emerald-500' : mood >= 35 ? 'bg-amber-400' : 'bg-rose-500';

                return (
                  <>
                    <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-semibold text-amber-300">Phòng Tiếp Khách VIP</span>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {activeVisitContract.repName} · {activeVisitContract.supplierName}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono-num text-emerald-400 font-bold text-sm">
                            {formatShortVND(activeVisitContract.totalValue)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono-num">
                            Cọc 30%: {formatShortVND(Math.round(activeVisitContract.totalValue * 0.3))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px] font-mono-num">
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <div className="text-slate-400 text-[10px]">Lô hàng</div>
                          <div className="text-white font-semibold mt-0.5">
                            {activeVisitContract.quantity}x {activeVisitContract.modelName}
                          </div>
                        </div>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <div className="text-slate-400 text-[10px]">Giá sỉ niêm yết</div>
                          <div className="text-slate-300 font-semibold mt-0.5">{formatShortVND(listUnit)}/máy</div>
                        </div>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <div className="text-slate-400 text-[10px]">Đối tác chào (-{offerDisc}%)</div>
                          <div className="text-sky-300 font-semibold mt-0.5">
                            {formatShortVND(activeVisitContract.unitPrice)}/máy
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono-num">
                          <span className="text-slate-400">
                            Vòng đàm phán: <b className="text-white">{Math.min(round, maxRounds)}/{maxRounds}</b> · Công nợ{' '}
                            <b className="text-sky-300">{activeVisitContract.paymentTermsDays} ngày</b>
                          </span>
                          <span className="text-slate-300">Thiện cảm: {mood}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div className={`h-full transition-all ${moodColor}`} style={{ width: `${mood}%` }} />
                        </div>
                      </div>

                      {activeVisitContract.lastNegotiationNote && (
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 italic leading-relaxed">
                          “{activeVisitContract.lastNegotiationNote}”
                        </div>
                      )}
                    </div>

                    {activeVisitContract.priceAgreed === false ? (
                      <div className="p-3.5 rounded-lg bg-slate-950 border border-sky-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sky-300">
                            Bước 1: Thương lượng &amp; Deal giá lô hàng
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Tăng SL máy giúp đối tác dễ nhượng bộ hơn
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                            <div className="text-[11px] text-slate-400">Số lượng lô (máy)</div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setDealQty(Math.max(5, effectiveDealQty - 5))}
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="number"
                                min={5}
                                max={200}
                                value={effectiveDealQty}
                                onChange={(e) => setDealQty(Number(e.target.value))}
                                className="w-full text-center p-1 rounded bg-slate-950 border border-slate-700 text-white font-mono-num font-semibold"
                              />
                              <button
                                onClick={() => setDealQty(Math.min(200, effectiveDealQty + 5))}
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                            <div className="text-[11px] text-slate-400">Chiết khấu đề xuất (%)</div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setDealDiscount(Math.max(1, effectiveDealDiscount - 1))}
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={25}
                                value={effectiveDealDiscount}
                                onChange={(e) => setDealDiscount(Number(e.target.value))}
                                className="w-full text-center p-1 rounded bg-slate-950 border border-slate-700 text-sky-300 font-mono-num font-semibold"
                              />
                              <button
                                onClick={() => setDealDiscount(Math.min(25, effectiveDealDiscount + 1))}
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] px-1 font-mono-num text-slate-300">
                          <span>Giá đề xuất: {formatShortVND(proposedUnitPrice)}/máy</span>
                          <span>Tổng lô đề xuất: {formatShortVND(proposedTotal)}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <button
                            onClick={() => {
                              const r = sim.submitPriceDeal(
                                activeVisitContract.id,
                                effectiveDealDiscount,
                                effectiveDealQty,
                              );
                              setFeedback(r.message);
                              if (!r.ok && r.message.includes('rút về')) {
                                window.setTimeout(onClose, 1600);
                              }
                            }}
                            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold cursor-pointer"
                          >
                            <Handshake className="w-4 h-4" />
                            <span>Đề xuất giá này</span>
                          </button>
                          <button
                            onClick={() => setFeedback(sim.acceptSupplierOffer(activeVisitContract.id).message)}
                            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Chốt giá -{offerDisc}%</span>
                          </button>
                          <button
                            disabled={Boolean(activeVisitContract.coffeeServed)}
                            onClick={() => setFeedback(sim.serveGuestCoffee(activeVisitContract.id).message)}
                            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-semibold ${
                              activeVisitContract.coffeeServed
                                ? 'bg-slate-800 text-amber-300/70 cursor-default'
                                : 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                            }`}
                          >
                            <Coffee className="w-4 h-4" />
                            <span>
                              {activeVisitContract.coffeeServed ? 'Đã mời cà phê' : 'Mời cà phê (+Thiện cảm)'}
                            </span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>
                            Hai bên đã chốt deal giảm <b>{activeVisitContract.discountPercent}%</b> (
                            {formatShortVND(activeVisitContract.unitPrice)}/máy). Sẵn sàng ký hợp đồng!
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {!activeVisitContract.coffeeServed && (
                            <button
                              onClick={() => setFeedback(sim.serveGuestCoffee(activeVisitContract.id).message)}
                              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold cursor-pointer"
                            >
                              <Coffee className="w-4 h-4" />
                              <span>Mời cà phê tiếp khách</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const r = sim.signContract(activeVisitContract.id);
                              setFeedback(r.message);
                              if (r.ok) window.setTimeout(onClose, 1200);
                            }}
                            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold cursor-pointer ${
                              activeVisitContract.coffeeServed ? 'sm:col-span-2' : ''
                            }`}
                          >
                            <FileSignature className="w-4 h-4" />
                            <span>Bước 2: Ký hợp đồng &amp; Cọc 30%</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        const r = sim.declineContractVisit(activeVisitContract.id);
                        setFeedback(r.message);
                        if (r.ok) window.setTimeout(onClose, 1000);
                      }}
                      className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
                    >
                      Hẹn lại dịp khác
                    </button>
                  </>
                );
              })()
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed">
                  Phòng Tiếp Khách hiện đang trống. Giám đốc có thể mời đại diện nhà cung cấp qua gặp trực tiếp để
                  thương lượng deal giá, dùng cà phê và ký hợp đồng nhập hàng tại đây.
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={supId}
                    onChange={(e) => setSupId(e.target.value)}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  >
                    {state.suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.repName} ({s.name})
                      </option>
                    ))}
                  </select>
                  <select
                    value={modId}
                    onChange={(e) => setModId(e.target.value)}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  >
                    {state.models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.model} ({m.storage})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[11px] text-slate-400">
                    Số lượng dự kiến
                    <input
                      type="number"
                      min={5}
                      max={200}
                      value={qty}
                      onChange={(e) => setQty(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono-num"
                    />
                  </label>
                  <label className="text-[11px] text-slate-400">
                    Chiết khấu mong muốn (%)
                    <input
                      type="number"
                      min={2}
                      max={22}
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono-num"
                    />
                  </label>
                </div>
                <button
                  onClick={() => {
                    const r = sim.negotiateContract(supId, modId, qty, discount, termsDays);
                    setFeedback(r.message);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold cursor-pointer"
                >
                  <Handshake className="w-4 h-4" />
                  <span>Mời đối tác qua Phòng Tiếp Khách deal giá</span>
                </button>
              </div>
            )}
          </div>
        )}

        {(target.type === 'display_phone' ||
          target.type === 'repair_bench' ||
          target.type === 'warehouse_shelf' ||
          target.type === 'customer_npc') && (
          <div className="space-y-2 text-xs text-slate-300">
            {target.type === 'display_phone' && (
              <div className="grid grid-cols-2 gap-2">
                {state.models.slice(0, 4).map((m) => (
                  <div key={m.id} className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <div className="font-semibold text-white">{m.model}</div>
                    <div className="text-sky-400 font-mono-num">{formatShortVND(m.retailPrice)}</div>
                    <div className="text-[11px] text-slate-400">Kho: {m.stock}</div>
                  </div>
                ))}
              </div>
            )}
            {target.type === 'repair_bench' && (
              <div>
                {state.tasks.filter((t) => t.type === 'repair' && t.status === 'active').length === 0
                  ? 'Bàn kỹ thuật đang sẵn sàng tiếp nhận máy.'
                  : state.tasks
                      .filter((t) => t.type === 'repair' && t.status === 'active')
                      .map((t) => (
                        <div key={t.id} className="p-2.5 rounded bg-slate-950 border border-slate-800">
                          <div className="font-semibold text-white">{t.title}</div>
                          <div className="text-sky-300 font-mono-num">{Math.round(t.progress * 100)}%</div>
                        </div>
                      ))}
              </div>
            )}
            {target.type === 'warehouse_shelf' && (
              <div className="space-y-2">
                <div>
                  Tồn kho hiện tại: <b className="text-emerald-400 font-mono-num">{sim.getTotalStock()} máy</b>
                </div>
                <button
                  onClick={() => setFeedback(sim.assignWarehouseAudit().message)}
                  className="px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold cursor-pointer"
                >
                  Yêu cầu kiểm kê kho
                </button>
              </div>
            )}
            {target.type === 'customer_npc' && (
              <div>Khách hàng đang được phục vụ theo quy trình của cửa hàng.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
