import React from 'react';
import { Play, Target, User, Settings, Code, Info, Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../audio/SoundFX';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenMissions: () => void;
  onOpenCharacter: () => void;
  onOpenSettings: () => void;
  onOpenUnityExport: () => void;
  onOpenAbout: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenMissions,
  onOpenCharacter,
  onOpenSettings,
  onOpenUnityExport,
  onOpenAbout,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 select-none overflow-hidden bg-gradient-to-t from-slate-950/80 via-transparent to-slate-900/60 pointer-events-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-amber-500/30 shadow-lg">
          <span className="text-xl">👑</span>
          <div>
            <div className="text-amber-400 font-extrabold text-sm tracking-wider uppercase">Amra Studio</div>
            <div className="text-xs text-slate-300 font-medium">com.amra.chor • v1.0.0</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMute}
            className="p-3 bg-slate-900/80 hover:bg-slate-800 text-amber-400 rounded-2xl border border-slate-700 transition active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
            title="শব্দ অন/অফ"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <div className="bg-red-600/90 text-white font-extrabold text-xs px-3 py-2 rounded-xl border border-red-400/50 shadow-md">
            12+ AGES
          </div>
        </div>
      </div>

      {/* Center Left: Main Title Lockup */}
      <div className="my-auto max-w-lg pointer-events-auto">
        <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold mb-2 border border-amber-500/40">
          <span>🎮</span>
          <span>৩ডি ওপেন ওয়ার্ল্ড বাংলাদেশি কমেডি গেম</span>
        </div>

        {/* Mascot & Bespoke Styled Bengali Title */}
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-yellow-200 shadow-xl flex items-center justify-center text-3xl sm:text-4xl shadow-[0_4px_16px_rgba(245,158,11,0.5)] transform -rotate-3">
            🥷💰
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-400 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] tracking-wide">
                আমরা
              </span>
              <span className="text-5xl sm:text-6xl font-black text-red-600 drop-shadow-[0_4px_12px_rgba(220,38,38,0.8)] tracking-wide">
                চোর
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-yellow-300 text-sm sm:text-base font-bold drop-shadow">
              <span>চোরগিরি করাই আমাদের কাম!</span>
              <span>😂</span>
            </div>
          </div>
        </div>

        <p className="mt-2.5 text-xs sm:text-sm text-slate-200 bg-slate-950/75 p-2.5 rounded-xl border border-slate-700/60 max-w-md shadow-md">
          ঢাকার ব্যস্ত রাজপথ, রিকশার টুংটাং ঘণ্টা, টং দোকানের মালাই চা, কাঁচা বাজারের ইলিশ এবং পুলিশের সাথে দুর্দান্ত ধাওয়া!
        </p>

        {/* Menu Buttons Group - Vertical Stacked Pill Style matching screenshots */}
        <div className="mt-4 flex flex-col gap-2 max-w-xs">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              soundEngine.playRickshawBell();
              onStartGame();
            }}
            style={{ touchAction: 'manipulation' }}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 hover:from-emerald-500 hover:to-green-400 text-white font-black text-base sm:text-lg py-2.5 px-6 rounded-2xl shadow-[0_6px_20px_rgba(16,185,129,0.5)] border-2 border-emerald-300 transform active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>খেলা শুরু (PLAY)</span>
          </button>

          <button
            onPointerDown={(e) => {
              e.preventDefault();
              onOpenMissions();
            }}
            style={{ touchAction: 'manipulation' }}
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-2 px-4 rounded-xl border border-blue-400/50 shadow transition cursor-pointer text-sm active:scale-95"
          >
            <Target className="w-4 h-4 text-cyan-300" />
            <span>মিশন সমূহ</span>
          </button>

          <button
            onPointerDown={(e) => {
              e.preventDefault();
              onOpenCharacter();
            }}
            style={{ touchAction: 'manipulation' }}
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-2 px-4 rounded-xl border border-blue-400/50 shadow transition cursor-pointer text-sm active:scale-95"
          >
            <User className="w-4 h-4 text-cyan-300" />
            <span>ক্যারেক্টার / পোশাক</span>
          </button>

          <button
            onPointerDown={(e) => {
              e.preventDefault();
              onOpenSettings();
            }}
            style={{ touchAction: 'manipulation' }}
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-2 px-4 rounded-xl border border-blue-400/50 shadow transition cursor-pointer text-sm active:scale-95"
          >
            <Settings className="w-4 h-4 text-cyan-300" />
            <span>সেটিংস</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                onOpenUnityExport();
              }}
              style={{ touchAction: 'manipulation' }}
              className="flex items-center justify-center gap-2 bg-amber-950/80 hover:bg-amber-900 text-amber-200 font-bold py-2.5 px-3 rounded-xl border border-amber-600/50 shadow transition cursor-pointer text-sm active:scale-95"
            >
              <Code className="w-4 h-4 text-amber-400" />
              <span>ইউনিটি কোড</span>
            </button>

            <button
              onPointerDown={(e) => {
                e.preventDefault();
                onOpenSettings();
              }}
              style={{ touchAction: 'manipulation' }}
              className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-3 rounded-xl border border-slate-600/50 shadow transition cursor-pointer text-sm active:scale-95"
            >
              <Settings className="w-4 h-4 text-slate-300" />
              <span>সেটিংস</span>
            </button>
          </div>

          <a
            href="./APK_DOWNLOAD/app-debug.apk"
            download="app-debug.apk"
            style={{ touchAction: 'manipulation' }}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black py-2.5 px-4 rounded-xl border-2 border-yellow-200 shadow-md transition cursor-pointer text-sm active:scale-95"
          >
            <span>📱 অ্যান্ড্রয়েড APK ডাউনলোড (Installable)</span>
          </a>

          <button
            onPointerDown={(e) => {
              e.preventDefault();
              onOpenAbout();
            }}
            style={{ touchAction: 'manipulation' }}
            className="flex items-center justify-center gap-2 bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-medium py-1.5 px-3 rounded-lg border border-slate-700/40 text-xs transition cursor-pointer active:scale-95"
          >
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>আমাদের সম্পর্কে</span>
          </button>
        </div>
      </div>

      {/* Bottom Hint Banner */}
      <div className="w-full flex justify-between items-center text-xs text-slate-300 bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800 backdrop-blur-md pointer-events-auto">
        <div className="flex items-center gap-3">
          <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold text-[11px]">CONTROLS</span>
          <span>WASD সরুন • Space লাফ • Shift দৌড় • F চড়/ঘুসি • E কথা বলুন • V সিএনজি • H হর্ন</span>
        </div>
        <div className="hidden sm:block text-slate-400 text-[11px]">
          মোবাইল স্ক্রিনে অন-স্ক্রিন জয়স্টিক ব্যবহার করুন
        </div>
      </div>
    </div>
  );
};
