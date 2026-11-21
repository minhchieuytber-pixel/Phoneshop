import React from 'react';
import type { GameSettings, SimSpeed } from '../core/types';

interface PauseModalProps {
  speed: SimSpeed;
  settings: GameSettings;
  saveStatus: string | null;
  onResume: () => void;
  onSave: () => void;
  onSetSpeed: (s: SimSpeed) => void;
  onUpdateAudio: (music: number, sfx: number, muted: boolean) => void;
  onResetGame: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  speed,
  settings,
  saveStatus,
  onResume,
  onSave,
  onSetSpeed,
  onUpdateAudio,
  onResetGame,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-4">
      <div className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-700/80 p-6 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-bold tracking-tight">Tạm dừng mô phỏng</h2>
          <button
            onClick={onResume}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            Esc · Tiếp tục
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <div className="text-xs font-medium text-slate-400 mb-2">Tốc độ thời gian</div>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-950 rounded-lg">
              {(['paused', 'slow', 'normal', 'fast'] as SimSpeed[]).map((s) => (
                <button
                  key={s}
                  onClick={() => onSetSpeed(s)}
                  className={`py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    speed === s ? 'bg-sky-500 text-slate-950 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {s === 'paused' ? 'Dừng' : s === 'slow' ? 'Chậm' : s === 'normal' ? 'Vừa' : 'Nhanh'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">Âm thanh</span>
              <button
                onClick={() => onUpdateAudio(settings.musicVolume, settings.sfxVolume, !settings.muted)}
                className={`px-3 py-1 text-xs rounded-md cursor-pointer ${
                  settings.muted ? 'bg-rose-900/60 text-rose-200' : 'bg-emerald-900/50 text-emerald-200'
                }`}
              >
                {settings.muted ? 'Đang tắt tiếng' : 'Đang bật'}
              </button>
            </div>
            <label className="block">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Nhạc nền Lo-fi</span>
                <span className="font-mono-num">{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.musicVolume}
                onChange={(e) => onUpdateAudio(Number(e.target.value), settings.sfxVolume, settings.muted)}
                className="w-full accent-sky-500"
              />
            </label>
            <label className="block">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Hiệu ứng &amp; Môi trường</span>
                <span className="font-mono-num">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.sfxVolume}
                onChange={(e) => onUpdateAudio(settings.musicVolume, Number(e.target.value), settings.muted)}
                className="w-full accent-sky-500"
              />
            </label>
          </div>

          <div className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-slate-800">
            Mẹo: Nhìn thẳng vào vật thể trong cửa hàng (Cửa kính, Công tắc đèn, Máy tính Giám đốc, Điện thoại bàn, Ghế, Tủ hồ sơ, Nhân viên) và nhấn <span className="text-slate-200 font-semibold">E</span> hoặc <span className="text-slate-200 font-semibold">Click</span> để tương tác.
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={onResume}
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm rounded-lg cursor-pointer"
            >
              Quay lại cửa hàng
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onSave}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium rounded-lg cursor-pointer"
              >
                Lưu tiến trình
              </button>
              <button
                onClick={onResetGame}
                className="py-2.5 bg-rose-950/70 hover:bg-rose-900/80 text-rose-200 text-xs font-medium rounded-lg cursor-pointer"
              >
                Chơi lại từ đầu
              </button>
            </div>
            {saveStatus && <div className="text-center text-xs text-emerald-400">{saveStatus}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};
