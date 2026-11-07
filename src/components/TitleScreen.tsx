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
        <div className="inline-block bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold mb-2 border border-amber-500/40">
          ৩ডি ওপেন ওয়ার্ল্ড বাংলাদেশি কমেডি গেম
        </div>

        {/* Bespoke Styled Bengali Title */}
        <h1 className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-amber-400 to-red-600 drop-shadow-[0_4px_12px_rgba(220,38,38,0.8)] tracking-wide leading-tight">
          আমরা চোর
        </h1>

        <div className="mt-1 flex items-center gap-2 text-yellow-300 text-lg sm:text-xl font-bold drop-shadow-md">
          <span>চোরগিরি করাই আমাদের কাম!</span>
          <span className="text-2xl">😂💰</span>
        </div>

        <p className="mt-2 text-xs sm:text-sm text-slate-200 bg-slate-950/70 p-3 rounded-xl border border-slate-700/60 max-w-md shadow-md">
          ঢাকার ব্যস্ত রাজপথ, রিকশার ঘণ্টা, টং দোকানের মালাই চা, কাঁচা বাজারের রূপালী ইলিশ এবং পুলিশের সাথে চোখ ধাঁধানো দৌড়াদৌড়ি!
        </p>

        {/* Menu Buttons Group */}
        <div className="mt-5 flex flex-col gap-2.5 max-w-xs">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              soundEngine.playRickshawBell();
              onStartGame();
            }}
            style={{ touchAction: 'manipulation' }}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 hover:from-emerald-500 hover:to-green-400 text-white font-black text-lg py-3 px-6 rounded-2xl shadow-[0_6px_20px_rgba(16,185,129,0.5)] border-2 border-emerald-300 transform active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-6 h-6 fill-white" />
            <span>খেলা শুরু (PLAY)</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                onOpenMissions();
              }}
              style={{ touchAction: 'manipulation' }}
              className="flex items-center justify-center gap-2 bg-blue-900/80 hover:bg-blue-800 text-blue-200 font-bold py-2.5 px-3 rounded-xl border border-blue-600/50 shadow transition cursor-pointer text-sm active:scale-95"
            >
              <Target className="w-4 h-4 text-blue-400" />
              <span>মিশন সমূহ</span>
            </button>

            <button
              onPointerDown={(e) => {
                e.preventDefault();
                onOpenCharacter();
              }}
              style={{ touchAction: 'manipulation' }}
              className="flex items-center justify-center gap-2 bg-blue-900/80 hover:bg-blue-800 text-blue-200 font-bold py-2.5 px-3 rounded-xl border border-blue-600/50 shadow transition cursor-pointer text-sm active:scale-95"
            >
              <User className="w-4 h-4 text-cyan-400" />
              <span>চরিত্র</span>
            </button>
          </div>

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
