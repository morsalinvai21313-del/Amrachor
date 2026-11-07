import React from 'react';
import { Coffee, Candy, ShieldAlert, Sparkles, X } from 'lucide-react';
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
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-amber-500 rounded-3xl shadow-[0_10px_35px_rgba(245,158,11,0.3)] overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 px-6 py-3 flex items-center justify-between text-slate-950">
          <div className="font-black text-lg flex items-center gap-2">
            <span>🏪</span>
            <span>{shopName} — দোকানে কথা বলুন</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/20 text-slate-950 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Dialogue Box */}
        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-start gap-4 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl">
              👳‍♂️
            </div>
            <div>
              <div className="text-amber-400 font-extrabold text-sm">দোকানদার মামা:</div>
              <div className="text-white text-base font-semibold mt-0.5">
                "এই যে ভাই! কি লাগবে বলেন? গরম চা, মিষ্টি নাকি পুলিশের হাত থেকে বাঁচার রাস্তা?"
              </div>
            </div>
          </div>

          {/* Action Options */}
          <div className="flex flex-col gap-2.5">
            {/* Option 1: Tea */}
            <button
              onClick={() => {
                if (money >= 20) {
                  soundEngine.playCoin();
                  onBuyItem(20, 25, false, 'মামা: "একদম স্পেশাল মালাই চা! খেয়ে শরীর চাঙ্গা করে নেন!"');
                }
              }}
              disabled={money < 20}
              className="w-full flex items-center justify-between p-3.5 bg-slate-800/80 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl border border-slate-700 transition cursor-pointer active:scale-98"
            >
              <div className="flex items-center gap-3">
                <Coffee className="w-5 h-5 text-amber-400" />
                <div className="text-left font-bold text-sm">
                  <span>স্পেশাল মালাই চা</span>
                  <div className="text-xs text-emerald-400 font-medium">+২৫ স্বাস্থ্য পুনরুদ্ধার</div>
                </div>
              </div>
              <div className="text-amber-400 font-mono font-bold">৳ ২০</div>
            </button>

            {/* Option 2: Sweets */}
            <button
              onClick={() => {
                if (money >= 50) {
                  soundEngine.playCoin();
                  onBuyItem(50, 50, false, 'মামা: "খাঁটি ছানার গরম চমচম! স্বাদ মুখে লেগে থাকবে!"');
                }
              }}
              disabled={money < 50}
              className="w-full flex items-center justify-between p-3.5 bg-slate-800/80 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl border border-slate-700 transition cursor-pointer active:scale-98"
            >
              <div className="flex items-center gap-3">
                <Candy className="w-5 h-5 text-pink-400" />
                <div className="text-left font-bold text-sm">
                  <span>রসগোল্লা ও গরম মিষ্টি</span>
                  <div className="text-xs text-emerald-400 font-medium">+৫০ স্বাস্থ্য ও স্ট্যামিনা বুস্ট</div>
                </div>
              </div>
              <div className="text-amber-400 font-mono font-bold">৳ ৫০</div>
            </button>

            {/* Option 3: Medicine / First Aid */}
            <button
              onClick={() => {
                if (money >= 150) {
                  soundEngine.playCoin();
                  onBuyItem(150, 100, false, 'মামা: "জরুরি মলম ও ওষুধ দিয়ে দিলাম, এবার পুলিশ থেকে সাবধান!"');
                }
              }}
              disabled={money < 150}
              className="w-full flex items-center justify-between p-3.5 bg-slate-800/80 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl border border-slate-700 transition cursor-pointer active:scale-98"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <div className="text-left font-bold text-sm">
                  <span>ফার্স্ট এইড ও এনার্জি প্যাক</span>
                  <div className="text-xs text-emerald-400 font-medium">১০০% পূর্ণ স্বাস্থ্য</div>
                </div>
              </div>
              <div className="text-amber-400 font-mono font-bold">৳ ১৫০</div>
            </button>

            {/* Option 4: Police Bribery */}
            <button
              onClick={() => {
                if (money >= 2000) {
                  soundEngine.playCoin();
                  onBuyItem(2000, 0, true, 'মামা: "হাহা! পুলিশের মিষ্টি খাওয়ার টাকা দিয়েছি! ওয়ান্টেড লেভেল কমে গেছে!"');
                }
              }}
              disabled={money < 2000}
              className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-red-950/70 to-slate-800 hover:from-red-900/80 hover:to-slate-700 disabled:opacity-50 text-white rounded-xl border border-red-500/50 transition cursor-pointer active:scale-98"
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <div className="text-left font-bold text-sm">
                  <span>পুলিশকে মিষ্টি খাওয়ার টাকা (ঘুষ)</span>
                  <div className="text-xs text-amber-300 font-medium">২-স্টার ওয়ান্টেড লেভেল কমান!</div>
                </div>
              </div>
              <div className="text-amber-400 font-mono font-bold">৳ ২,০০০</div>
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer text-sm"
          >
            কিছু না / দোকান থেকে চলে যান
          </button>
        </div>
      </div>
    </div>
  );
};
