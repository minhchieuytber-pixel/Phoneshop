import React, { useEffect, useState } from 'react';
import { EXPANSION_STAGES, type SimulationEngine } from '../core/simulationEngine';
import { formatGameTime, formatShortVND, formatVND } from '../core/timeManager';
import type { GameState } from '../core/types';

export type PhoneAppId =
  | 'home'
  | 'phone'
  | 'messages'
  | 'banking'
  | 'reports'
  | 'orders'
  | 'employees'
  | 'business'
  | 'calendar'
  | 'email'
  | 'market'
  | 'camera'
  | 'settings';

interface AppsProps {
  appId: Exclude<PhoneAppId, 'home'>;
  state: GameState;
  sim: SimulationEngine;
  captureCCTV: (cam: 'showroom' | 'cashier' | 'tech' | 'warehouse' | 'entrance') => string | null;
  onUpdateAudio: (music: number, sfx: number, muted: boolean) => void;
}

export const SmartphoneAppContent: React.FC<AppsProps> = ({
  appId,
  state,
  sim,
  captureCCTV,
  onUpdateAudio,
}) => {
  const [callBanner, setCallBanner] = useState<string | null>(null);
  const [negSupplierId, setNegSupplierId] = useState(state.suppliers[0]?.id ?? '');
  const [negModelId, setNegModelId] = useState(state.models[0]?.id ?? '');
  const [negQty, setNegQty] = useState(12);
  const [negDiscount, setNegDiscount] = useState(6);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeCam, setActiveCam] = useState<'showroom' | 'cashier' | 'tech' | 'warehouse' | 'entrance'>('showroom');
  const [camFrame, setCamFrame] = useState<string | null>(null);
  const [transferAmt, setTransferAmt] = useState(5_000_000);

  useEffect(() => {
    if (appId === 'messages') sim.markMessagesRead();
    if (appId === 'email') sim.markEmailsRead();
  }, [appId, sim]);

  useEffect(() => {
    if (appId !== 'camera') return;
    setCamFrame(captureCCTV(activeCam));
    const timer = window.setInterval(() => {
      setCamFrame(captureCCTV(activeCam));
    }, 900);
    return () => window.clearInterval(timer);
  }, [appId, activeCam, captureCCTV]);

  const timeInfo = formatGameTime(state.totalMinutes);

  if (appId === 'phone') {
    const placeCall = (name: string, role: string, summary: string) => {
      setCallBanner(`Đang kết nối cuộc gọi với ${name}...`);
      sim.recordCall(name, role, summary);
      window.setTimeout(() => {
        setCallBanner(`Đã hoàn tất trao đổi với ${name}.`);
      }, 1500);
    };

    return (
      <div className="space-y-3">
        {callBanner && (
          <div className="p-2.5 rounded-lg bg-emerald-950/90 border border-emerald-500/40 text-xs text-emerald-200">
            {callBanner}
          </div>
        )}
        <div className="text-[11px] font-semibold text-slate-400">Danh bạ nội bộ &amp; Đối tác</div>
        <div className="space-y-1.5">
          {state.employees.map((e) => (
            <div key={e.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/80">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">{e.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{e.role}</div>
              </div>
              <button
                onClick={() => placeCall(e.name, e.role, 'Trao đổi tiến độ công việc tại cửa hàng')}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-[11px] font-medium text-white cursor-pointer"
              >
                Gọi
              </button>
            </div>
          ))}
          {state.suppliers.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/80">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-sky-300 truncate">{s.repName}</div>
                <div className="text-[10px] text-slate-400 truncate">{s.name} · {s.phone}</div>
              </div>
              <button
                onClick={() =>
                  placeCall(s.repName, s.name, 'Trao đổi chính sách nhập hàng & hẹn gặp văn phòng')
                }
                className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-[11px] font-medium text-white cursor-pointer"
              >
                Gọi
              </button>
            </div>
          ))}
        </div>

        <div className="text-[11px] font-semibold text-slate-400 pt-2">Lịch sử cuộc gọi</div>
        {state.callHistory.length === 0 ? (
          <div className="text-[11px] text-slate-500">Chưa có cuộc gọi nào.</div>
        ) : (
          <div className="space-y-1.5">
            {state.callHistory.slice(0, 8).map((c) => (
              <div key={c.id} className="p-2 rounded bg-slate-900/90 border border-slate-800 text-[11px]">
                <div className="flex justify-between font-medium text-slate-200">
                  <span>{c.contactName}</span>
                  <span className="font-mono-num text-slate-400">Ngày {c.day}</span>
                </div>
                <div className="text-slate-400 text-[10px] mt-0.5">{c.summary}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (appId === 'messages') {
    return (
      <div className="space-y-2">
        {state.messages.length === 0 ? (
          <div className="text-xs text-slate-400 text-center py-8">Hộp tin nhắn trống</div>
        ) : (
          state.messages.map((m) => (
            <div key={m.id} className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700/60">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-sky-300">{m.senderName}</span>
                <span className="text-[10px] text-slate-400 font-mono-num">
                  Ngày {m.day} · {formatGameTime(m.minute).timeStr}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mb-1">{m.senderRole}</div>
              <p className="text-xs text-slate-100 leading-relaxed">{m.text}</p>
            </div>
          ))
        )}
      </div>
    );
  }

  if (appId === 'banking') {
    return (
      <div className="space-y-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-sky-900/80 to-slate-900 border border-sky-500/30">
          <div className="text-[10px] text-sky-300">Tài khoản Doanh nghiệp</div>
          <div className="font-mono-num text-lg font-bold text-white mt-0.5">
            {formatVND(state.businessBalance)}
          </div>
          <div className="flex justify-between text-[11px] text-slate-300 mt-2 pt-2 border-t border-white/10">
            <span>Cá nhân: <b className="font-mono-num text-emerald-300">{formatShortVND(state.personalBalance)}</b></span>
            <span>Dư nợ vay: <b className="font-mono-num text-amber-300">{formatShortVND(state.loanDebt)}</b></span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/70 space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-semibold text-slate-200">Vay vốn Ngân hàng (0.08%/ngày)</span>
            <span className="font-mono-num text-sky-300">
              Còn hạn mức {formatShortVND(Math.max(0, 500_000_000 - state.loanDebt))}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { amount: 50_000_000, label: '+50 tr' },
              { amount: 150_000_000, label: '+150 tr' },
              { amount: 300_000_000, label: '+300 tr' },
            ].map((pkg) => (
              <button
                key={pkg.amount}
                onClick={() => {
                  const r = sim.takeLoan(pkg.amount);
                  setFeedback(r.message);
                }}
                className="py-1.5 px-1.5 rounded-lg bg-sky-700/80 hover:bg-sky-600 text-[11px] font-medium font-mono-num text-white cursor-pointer"
              >
                Vay {pkg.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => {
                const r = sim.repayLoan(50_000_000);
                setFeedback(r.message);
              }}
              disabled={state.loanDebt <= 0}
              className="py-1.5 px-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-[11px] font-medium font-mono-num text-amber-300 cursor-pointer"
            >
              Trả 50 tr
            </button>
            <button
              onClick={() => {
                const r = sim.repayLoan(state.loanDebt);
                setFeedback(r.message);
              }}
              disabled={state.loanDebt <= 0}
              className="py-1.5 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-[11px] font-medium text-white cursor-pointer"
            >
              Tất toán hết
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="number"
            step={1000000}
            value={transferAmt}
            onChange={(e) => setTransferAmt(Number(e.target.value))}
            className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs font-mono-num text-white"
          />
          <button
            onClick={() => {
              const ok = sim.transferOwnerSalary(transferAmt);
              setFeedback(ok ? `Đã rút ${formatShortVND(transferAmt)} sang tài khoản cá nhân.` : 'Số dư không đủ.');
            }}
            className="px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-[11px] font-medium text-white whitespace-nowrap cursor-pointer"
          >
            Rút về ví
          </button>
        </div>

        {feedback && <div className="text-[11px] text-sky-300">{feedback}</div>}

        <div className="text-[11px] font-semibold text-slate-400">Lịch sử giao dịch thực tế</div>
        <div className="space-y-1.5">
          {state.transactions.length === 0 ? (
            <div className="text-[11px] text-slate-500">Chưa có giao dịch phát sinh.</div>
          ) : (
            state.transactions.slice(0, 18).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-2 rounded bg-slate-800/70 text-[11px]">
                <div className="min-w-0 pr-2">
                  <div className="text-slate-100 truncate font-medium">{tx.itemName}</div>
                  <div className="text-[10px] text-slate-400 truncate">
                    Ngày {tx.day} · {tx.paymentMethod.toUpperCase()}
                  </div>
                </div>
                <div className={`font-mono-num font-semibold whitespace-nowrap ${tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {tx.amount >= 0 ? '+' : ''}{formatShortVND(tx.amount)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (appId === 'reports') {
    const todayTx = state.transactions.filter((t) => t.day === timeInfo.day);
    const todayRev = todayTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const totalRev = state.transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const totalProfit = state.transactions.reduce((s, t) => s + t.profit, 0);

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-lg bg-slate-800/80">
            <div className="text-[10px] text-slate-400">Doanh thu hôm nay</div>
            <div className="font-mono-num text-sm font-bold text-emerald-400">{formatShortVND(todayRev)}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/80">
            <div className="text-[10px] text-slate-400">Tổng lợi nhuận ròng</div>
            <div className="font-mono-num text-sm font-bold text-sky-400">{formatShortVND(totalProfit)}</div>
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-800/60 flex justify-between text-[11px]">
          <span className="text-slate-400">Tổng doanh thu tích lũy</span>
          <span className="font-mono-num font-semibold text-white">{formatShortVND(totalRev)}</span>
        </div>

        <div className="text-[11px] font-semibold text-slate-400">Hiệu suất nhân viên</div>
        <div className="space-y-1.5">
          {state.employees.map((e) => (
            <div key={e.id} className="p-2 rounded-lg bg-slate-800/75 text-[11px]">
              <div className="flex justify-between font-semibold text-white">
                <span>{e.name}</span>
                <span className="font-mono-num text-sky-400">{e.performance}/100</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono-num">
                <span>Khách: {e.customersServed}</span>
                <span>Đơn: {e.ordersClosed}</span>
                <span>DS: {formatShortVND(e.revenueGenerated)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (appId === 'orders') {
    return (
      <div className="space-y-3">
        <div className="p-2.5 rounded-xl bg-slate-800/90 space-y-2">
          <div className="text-xs font-semibold text-sky-300">Đặt lô hàng nhanh từ Nhà cung cấp</div>
          <select
            value={negSupplierId}
            onChange={(e) => setNegSupplierId(e.target.value)}
            className="w-full p-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-white"
          >
            {state.suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name} (-{Math.round(s.baseDiscount * 100)}%)</option>
            ))}
          </select>
          <select
            value={negModelId}
            onChange={(e) => setNegModelId(e.target.value)}
            className="w-full p-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-white"
          >
            {state.models.map((m) => (
              <option key={m.id} value={m.id}>{m.model} ({formatShortVND(m.wholesalePrice)})</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={100}
              value={negQty}
              onChange={(e) => setNegQty(Number(e.target.value))}
              className="w-20 p-1.5 rounded bg-slate-900 border border-slate-700 text-xs font-mono-num text-white"
            />
            <button
              onClick={() => {
                const sup = state.suppliers.find((s) => s.id === negSupplierId);
                const r = sim.placeWholesaleOrder(
                  negSupplierId,
                  negModelId,
                  negQty,
                  Math.round((sup?.baseDiscount ?? 0.05) * 100),
                  true,
                );
                setFeedback(r.message);
              }}
              className="flex-1 py-1.5 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs cursor-pointer"
            >
              Đặt nhập kho
            </button>
          </div>
          {feedback && <div className="text-[11px] text-emerald-300">{feedback}</div>}
        </div>

        <div className="text-[11px] font-semibold text-slate-400">Đơn nhập hàng ({state.orders.length})</div>
        {state.orders.length === 0 ? (
          <div className="text-[11px] text-slate-500">Chưa có đơn nhập hàng.</div>
        ) : (
          <div className="space-y-1.5">
            {state.orders.map((o) => (
              <div key={o.id} className="p-2 rounded-lg bg-slate-800/70 text-[11px]">
                <div className="flex justify-between font-semibold text-white">
                  <span>{o.quantity}x {o.modelName}</span>
                  <span className="text-sky-400">{o.status}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>{o.supplierName}</span>
                  <span className="font-mono-num">{formatShortVND(o.totalCost)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (appId === 'employees') {
    return (
      <div className="space-y-2.5">
        {feedback && <div className="text-[11px] text-sky-300">{feedback}</div>}
        {state.employees.map((e) => (
          <div key={e.id} className="p-2.5 rounded-xl bg-slate-800/85 border border-slate-700/60 space-y-1.5">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs font-semibold text-white">{e.name}</div>
                <div className="text-[10px] text-slate-400">{e.role} · Tinh thần {e.morale}%</div>
              </div>
              <span className="font-mono-num text-[11px] text-emerald-400">{formatShortVND(e.salary)}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-300 font-mono-num">
              <span>KN: {e.skill}</span>
              <span>TĐ: {e.speed}</span>
              <span>GT: {e.communication}</span>
            </div>
            <div className="flex gap-1 pt-1">
              <button
                onClick={() => {
                  sim.adjustEmployeeSalary(e.id, 1_000_000);
                  setFeedback(`Đã tăng lương +1tr cho ${e.name}`);
                }}
                className="flex-1 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[10px] text-white cursor-pointer"
              >
                +Lương
              </button>
              <button
                onClick={() => {
                  const ok = sim.bonusEmployee(e.id, 1_000_000);
                  setFeedback(ok ? `Đã thưởng 1tr cho ${e.name}` : 'Không đủ ngân sách.');
                }}
                className="flex-1 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-[10px] text-white cursor-pointer"
              >
                Thưởng
              </button>
              <button
                onClick={() => {
                  const ok = sim.trainEmployee(e.id);
                  setFeedback(ok ? `${e.name} bắt đầu đào tạo 2 ngày.` : 'Đang đào tạo hoặc thiếu tiền.');
                }}
                className="flex-1 py-1 rounded bg-sky-700 hover:bg-sky-600 text-[10px] text-white cursor-pointer"
              >
                Đào tạo
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (appId === 'business') {
    const curStage = EXPANSION_STAGES[state.expansionLevel - 1];
    const nextStage = EXPANSION_STAGES[state.expansionLevel];
    return (
      <div className="space-y-3">
        <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700">
          <div className="text-[10px] text-sky-400 font-medium">Quy mô hiện tại · Cấp {state.expansionLevel}/7</div>
          <div className="text-sm font-bold text-white mt-0.5">{curStage?.name}</div>
          <p className="text-[11px] text-slate-300 mt-1">{curStage?.description}</p>
          <div className="flex justify-between text-[11px] text-slate-300 mt-2 pt-2 border-t border-slate-700">
            <span>Uy tín: <b className="text-amber-300 font-mono-num">{Math.round(state.reputation)}/100</b></span>
            <span>Nhân sự: <b className="font-mono-num">{state.employees.length}/{curStage?.maxStaff}</b></span>
          </div>
        </div>

        {nextStage && (
          <div className="p-3 rounded-xl bg-sky-950/50 border border-sky-500/40 space-y-2">
            <div className="text-xs font-semibold text-white">Nâng cấp: {nextStage.name}</div>
            <div className="text-[11px] text-slate-300">{nextStage.description}</div>
            <button
              onClick={() => setFeedback(sim.upgradeExpansion().message)}
              className="w-full py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs cursor-pointer"
            >
              Mở rộng ({formatShortVND(nextStage.upgradeCost)})
            </button>
          </div>
        )}

        {feedback && <div className="text-[11px] text-emerald-300">{feedback}</div>}

        <div className="text-[11px] font-semibold text-slate-400">Đối thủ cạnh tranh</div>
        {state.competitors.map((c) => (
          <div key={c.id} className="p-2 rounded-lg bg-slate-800/70 text-[11px]">
            <div className="flex justify-between font-semibold text-white">
              <span>{c.name}</span>
              <span className="text-amber-300">{c.strategy}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{c.lastAction}</div>
          </div>
        ))}
      </div>
    );
  }

  if (appId === 'calendar') {
    return (
      <div className="space-y-2">
        {state.calendar.map((ev) => (
          <div key={ev.id} className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <div className="flex justify-between text-[10px] text-sky-400 font-mono-num">
              <span>Ngày {ev.day} · {ev.timeText}</span>
              <span>{ev.participant}</span>
            </div>
            <div className="text-xs font-medium text-white mt-1">{ev.title}</div>
          </div>
        ))}
      </div>
    );
  }

  if (appId === 'email') {
    return (
      <div className="space-y-2.5">
        <div className="p-2.5 rounded-xl bg-slate-800/90 space-y-2 border border-slate-700">
          <div className="text-xs font-semibold text-sky-300">Gửi đề xuất đàm phán Hợp đồng</div>
          <select
            value={negSupplierId}
            onChange={(e) => setNegSupplierId(e.target.value)}
            className="w-full p-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-white"
          >
            {state.suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.repName})</option>
            ))}
          </select>
          <select
            value={negModelId}
            onChange={(e) => setNegModelId(e.target.value)}
            className="w-full p-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-white"
          >
            {state.models.map((m) => (
              <option key={m.id} value={m.id}>{m.model}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-1.5">
            <label className="text-[10px] text-slate-400">
              SL máy
              <input
                type="number"
                min={5}
                value={negQty}
                onChange={(e) => setNegQty(Number(e.target.value))}
                className="w-full mt-0.5 p-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
              />
            </label>
            <label className="text-[10px] text-slate-400">
              Đòi giảm (%)
              <input
                type="number"
                min={2}
                max={20}
                value={negDiscount}
                onChange={(e) => setNegDiscount(Number(e.target.value))}
                className="w-full mt-0.5 p-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
              />
            </label>
          </div>
          <button
            onClick={() => {
              const r = sim.negotiateContract(negSupplierId, negModelId, negQty, negDiscount, 15);
              setFeedback(r.message);
            }}
            className="w-full py-1.5 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs cursor-pointer"
          >
            Mời đối tác qua Phòng Khách deal giá
          </button>
          {feedback && <div className="text-[11px] text-emerald-300">{feedback}</div>}
        </div>

        {state.emails.map((mail) => (
          <div key={mail.id} className="p-2.5 rounded-lg bg-slate-800/75 border border-slate-700/60">
            <div className="text-xs font-semibold text-white">{mail.subject}</div>
            <div className="text-[10px] text-sky-400 mt-0.5">{mail.fromName}</div>
            <p className="text-[11px] text-slate-300 mt-1.5 whitespace-pre-line">{mail.body}</p>
          </div>
        ))}
      </div>
    );
  }

  if (appId === 'market') {
    return (
      <div className="space-y-2">
        {state.models.map((m) => (
          <div key={m.id} className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs font-semibold text-white">{m.model}</div>
                <div className="text-[10px] text-slate-400">{m.brand} · {m.storage} · {m.lifecycle}</div>
              </div>
              <span className={`font-mono-num text-[11px] font-semibold ${m.stock <= 2 ? 'text-rose-400' : 'text-emerald-400'}`}>
                Kho: {m.stock}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] mt-2 pt-1.5 border-t border-slate-700/60">
              <span className="text-slate-400 font-mono-num">Nhập: {formatShortVND(m.wholesalePrice)}</span>
              <span className="text-sky-300 font-mono-num font-semibold">Bán: {formatShortVND(m.retailPrice)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (appId === 'camera') {
    const cams: { id: typeof activeCam; name: string }[] = [
      { id: 'showroom', name: 'Showroom' },
      { id: 'cashier', name: 'Thu ngân' },
      { id: 'tech', name: 'Kỹ thuật' },
      { id: 'warehouse', name: 'Kho' },
      { id: 'entrance', name: 'Cửa chính' },
    ];
    return (
      <div className="space-y-2.5">
        <div className="flex flex-wrap gap-1">
          {cams.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCam(c.id)}
              className={`px-2 py-1 rounded text-[10px] font-medium cursor-pointer ${
                activeCam === c.id ? 'bg-sky-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="rounded-lg overflow-hidden border border-slate-700 bg-black aspect-video flex items-center justify-center">
          {camFrame ? (
            <img src={camFrame} alt="CCTV Live Feed" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-slate-500">Đang kết nối camera 3D...</span>
          )}
        </div>
        <div className="text-[10px] text-slate-400 font-mono-num flex justify-between">
          <span>CAM-{activeCam.toUpperCase()}</span>
          <span>{timeInfo.timeStr} · Ngày {timeInfo.day}</span>
        </div>
      </div>
    );
  }

  // Settings app
  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-slate-300">Hình nền điện thoại</div>
      <div className="grid grid-cols-3 gap-2">
        {['Xanh Đêm', 'Titan Tím', 'Ngọc Lục'].map((label, idx) => (
          <button
            key={label}
            onClick={() => {
              state.settings.wallpaperIndex = idx;
              setFeedback(`Đã đổi hình nền: ${label}`);
            }}
            className={`py-2 rounded-lg text-[11px] font-medium border cursor-pointer ${
              state.settings.wallpaperIndex === idx
                ? 'border-sky-400 bg-sky-900/40 text-white'
                : 'border-slate-700 bg-slate-800 text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="block pt-2">
        <div className="flex justify-between text-[11px] text-slate-300 mb-1">
          <span>Nhạc nền</span>
          <span className="font-mono-num">{Math.round(state.settings.musicVolume * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={state.settings.musicVolume}
          onChange={(e) => onUpdateAudio(Number(e.target.value), state.settings.sfxVolume, state.settings.muted)}
          className="w-full accent-sky-500"
        />
      </label>
      <label className="block">
        <div className="flex justify-between text-[11px] text-slate-300 mb-1">
          <span>Âm thanh cửa hàng</span>
          <span className="font-mono-num">{Math.round(state.settings.sfxVolume * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={state.settings.sfxVolume}
          onChange={(e) => onUpdateAudio(state.settings.musicVolume, Number(e.target.value), state.settings.muted)}
          className="w-full accent-sky-500"
        />
      </label>
      {feedback && <div className="text-[11px] text-sky-300">{feedback}</div>}
    </div>
  );
};
