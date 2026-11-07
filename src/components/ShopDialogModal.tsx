import React from 'react';
import { Coffee, Candy, ShieldAlert, Sparkles, X, ChevronRight } from 'lucide-react';
import { soundEngine } from '../audio/SoundFX';

interface ShopDialogModalProps {
  shopName: string;
  money: number;
  onBuyItem: (cost: number, healthRestore: number, clearsWanted: boolean, dialogReply: string) => void;
  onClose: () => void;
}

export const ShopDialogModal: React.FC<ShopDialogModalProps> = ({
  shopName,
  money,
  onBuyItem,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] z-50 flex flex-col justify-between p-4 sm:p-6 select-none pointer-events-none">
      {/* Top Header Badge */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-sm sm:text-base px-4 py-1.5 rounded-2xl shadow-lg border-2 border-white flex items-center gap-2">
          <span>🏪</span>
          <span>{shopName} — দোকানে কথা বলুন</span>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 transition cursor-pointer shadow-md"
          title="বন্ধ করুন"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Area: Left Speech Bubble & Right Stacked Action Buttons */}
      <div className="flex flex-col sm:flex-row items-end justify-between gap-4 w-full pointer-events-auto">
        {/* Dialogue Bubble (Shopkeeper speaking) */}
        <div className="w-full sm:max-w-xl bg-slate-950/90 border-2 border-amber-500/80 rounded-3xl p-3.5 sm:p-4 shadow-[0_8px_30px_rgba(0,0,0,0.8)] backdrop-blur-md flex items-center gap-3.5">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-yellow-200 shadow-md flex items-center justify-center text-3xl shrink-0">
            👳‍♂️
            <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5 border border-white text-[9px]">
              ✓
            </div>
          </div>
          <div className="flex-1">
            <div className="text-amber-400 font-extrabold text-xs uppercase tracking-wider">
              দোকানদার মামা:
            </div>
            <div className="text-white text-sm sm:text-base font-semibold mt-0.5 leading-snug">
              "এই যে ভাই, কি লাগবে? গরম চা, খাঁটি ছানার মিষ্টি নাকি জরুরি ওষুধ?"
            </div>
          </div>
        </div>

        {/* Right-Hand Stacked Action Pills (Screenshot Layout) */}
        <div className="w-full sm:w-auto flex flex-col gap-2 min-w-[200px] sm:min-w-[240px]">
          {/* Option 1: Tea */}
          <button
            onClick={() => {
              if (money >= 20) {
                soundEngine.playCoin();
                onBuyItem(20, 25, false, 'মামা: "একদম স্পেশাল মালাই চা! খেয়ে শরীর চাঙ্গা করে নেন!"');
              }
            }}
            disabled={money < 20}
            className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-40 text-white font-bold rounded-2xl border-2 border-blue-400/60 shadow-lg transition cursor-pointer active:scale-95 text-xs sm:text-sm"
          >
            <div className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-cyan-300" />
              <span>চা খাবো</span>
            </div>
            <span className="font-mono text-amber-300">৳ ২০</span>
          </button>

          {/* Option 2: Sweets */}
          <button
            onClick={() => {
              if (money >= 50) {
                soundEngine.playCoin();
                onBuyItem(50, 50, false, 'মামা: "খাঁটি ছানার গরম রসগোল্লা! খেয়ে মন ভরে যাবে!"');
              }
            }}
            disabled={money < 50}
            className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-40 text-white font-bold rounded-2xl border-2 border-blue-400/60 shadow-lg transition cursor-pointer active:scale-95 text-xs sm:text-sm"
          >
            <div className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-cyan-300" />
              <span>মিষ্টি কিনুন</span>
            </div>
            <span className="font-mono text-amber-300">৳ ৫০</span>
          </button>

          {/* Option 3: Steal Goods (Heist action) */}
          <button
            onClick={() => {
              // Heist chance
              const isCaught = Math.random() < 0.45;
              if (isCaught) {
                soundEngine.playPoliceWhistle();
                onBuyItem(0, 0, false, 'দোকানদার: "আরে চোর চোর! দোকান থেকে মাল চুরি করেছে! পুলিশ ধরো!"');
              } else {
                soundEngine.playCoin();
                onBuyItem(-1500, 20, false, 'চোর: "হাহা! মামার চোখ ফাঁকি দিয়ে ১,৫০০ টাকার মাল সাফ!"');
              }
            }}
            className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-red-700 via-rose-700 to-red-800 hover:from-red-600 text-white font-bold rounded-2xl border-2 border-yellow-400 shadow-lg transition cursor-pointer active:scale-95 text-xs sm:text-sm animate-pulse"
          >
            <div className="flex items-center gap-2">
              <span>🤫</span>
              <span>মালামাল চুরি করুন</span>
            </div>
            <span className="text-yellow-300 font-bold text-[11px]">+৳ ১,৫০০</span>
          </button>

          {/* Option 4: Bribe Police */}
          <button
            onClick={() => {
              if (money >= 2000) {
                soundEngine.playCoin();
                onBuyItem(2000, 0, true, 'মামা: "হাহা! পুলিশের মিষ্টি খাওয়ার ব্যবস্থা করেছি, ওয়ান্টেড লেভেল শেষ!"');
              }
            }}
            disabled={money < 2000}
            className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-amber-700 to-yellow-800 hover:from-amber-600 disabled:opacity-40 text-white font-bold rounded-2xl border border-amber-400/60 shadow-lg transition cursor-pointer active:scale-95 text-xs sm:text-sm"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-300" />
              <span>পুলিশকে মিষ্টি (ঘুষ)</span>
            </div>
            <span className="font-mono text-yellow-300">৳ ২,০০০</span>
          </button>

          {/* Option 5: Leave */}
          <button
            onClick={onClose}
            className="flex items-center justify-center px-4 py-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 font-bold rounded-2xl border border-slate-700 transition cursor-pointer text-xs active:scale-95"
          >
            চলে যান / কিছু না
          </button>
        </div>
      </div>
    </div>
  );
};
