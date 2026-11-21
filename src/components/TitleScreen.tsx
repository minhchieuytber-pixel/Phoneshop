import React, { useEffect } from 'react';

interface TitleScreenProps {
  hasSave: boolean;
  savedSummary?: string;
  onStartNew: () => void;
  onContinue: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  hasSave,
  savedSummary,
  onStartNew,
  onContinue,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (hasSave) onContinue();
        else onStartNew();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hasSave, onContinue, onStartNew]);

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-between p-6 md:p-12 pointer-events-auto bg-gradient-to-r from-[#090d16]/90 via-[#090d16]/55 to-transparent">
      {/* Top left minimalist studio mark */}
      <div className="flex items-center gap-3">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <rect x="7" y="2" width="22" height="32" rx="5" stroke="#38bdf8" strokeWidth="2.2" />
          <rect x="14" y="5" width="8" height="2.2" rx="1.1" fill="#38bdf8" />
          <path d="M13 21L17 17L20 20L24 14" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-xs font-medium tracking-widest text-slate-300">
          INDIE BUSINESS &amp; LIFE SIMULATOR
        </span>
      </div>

      {/* Main Title Lockup over calm negative space */}
      <div className="max-w-xl my-auto">
        <svg viewBox="0 0 540 130" className="w-full max-w-lg mb-4" aria-label="Phone Store Simulator 3D">
          <text
            x="0"
            y="46"
            fill="#f8fafc"
            fontFamily="Outfit, sans-serif"
            fontWeight="700"
            fontSize="44"
            letterSpacing="-1"
          >
            PHONE STORE
          </text>
          <text
            x="0"
            y="96"
            fill="#38bdf8"
            fontFamily="Outfit, sans-serif"
            fontWeight="700"
            fontSize="44"
            letterSpacing="-1"
          >
            SIMULATOR 3D
          </text>
          <rect x="2" y="112" width="110" height="3" rx="1.5" fill="#38bdf8" />
        </svg>

        <p className="text-sm md:text-base text-slate-200 leading-relaxed max-w-md mb-8">
          Điều hành cửa hàng điện thoại của riêng bạn trong thế giới 3D sống động: quản lý đội ngũ nhân viên, đàm phán nhà cung cấp, theo dõi thị trường và xây dựng tập đoàn bán lẻ công nghệ.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {hasSave ? (
            <>
              <button
                onClick={onContinue}
                className="px-6 py-3 bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-slate-950 font-semibold text-sm rounded-lg transition-all cursor-pointer"
              >
                Tiếp tục điều hành
              </button>
              <button
                onClick={onStartNew}
                className="px-5 py-3 bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-medium text-sm rounded-lg border border-slate-600/60 transition-all cursor-pointer"
              >
                Khởi tạo cửa hàng mới
              </button>
            </>
          ) : (
            <button
              onClick={onStartNew}
              className="px-7 py-3.5 bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-slate-950 font-semibold text-sm rounded-lg transition-all cursor-pointer"
            >
              Bắt đầu kinh doanh
            </button>
          )}
        </div>

        {hasSave && savedSummary && (
          <p className="mt-3 text-xs text-slate-400 font-mono-num">
            Bản lưu gần nhất · {savedSummary}
          </p>
        )}
      </div>

      {/* Single flat control hint line */}
      <div className="text-xs text-slate-300/90 tracking-wide">
        WASD Di chuyển · Kéo chuột / Nhìn · E / Click Tương tác vật thể · Tab Điện thoại · Esc Tạm dừng
      </div>
    </div>
  );
};
