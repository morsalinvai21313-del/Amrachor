import React from 'react';
import { User, Shield, Zap, Sparkles, X } from 'lucide-react';

interface CharacterModalProps {
  onClose: () => void;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-cyan-400 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5 font-black text-xl">
            <User className="w-6 h-6 text-yellow-300" />
            <span>চরিত্র পরিচিতি — আমরা চোর</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/20 text-white transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/40 flex items-center justify-center text-4xl shadow-inner">
              🕶️
            </div>
            <div>
              <div className="text-xl font-black text-white">রমজান চোর (আমড়া চোর)</div>
              <div className="text-xs text-amber-400 font-bold">পেশাদার বাংলাদেশি কমেডি চোর</div>
              <div className="text-xs text-slate-400 mt-1">
                পোশাক: স্ট্রাইপ টি-শার্ট, ব্লু লুঙ্গি, ডার্ক সানগ্লাস ও টাকার বস্তা (৳)
              </div>
            </div>
          </div>

          {/* Stats Radar */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-3">
              <Zap className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-xs text-slate-400 font-bold">দৌড় গতি (Speed)</div>
                <div className="text-sm font-black text-white font-mono">৯৫% (স্প্রিন্টার)</div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-pink-400" />
              <div>
                <div className="text-xs text-slate-400 font-bold">হাতসাফাই চাতুর্য</div>
                <div className="text-sm font-black text-white font-mono">১০০% (নিখুঁত)</div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-3">
              <Shield className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="text-xs text-slate-400 font-bold">পুলিশের ফাঁকি</div>
                <div className="text-sm font-black text-white font-mono">৮৮% (চটপটে)</div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-3">
              <span className="text-xl">🛺</span>
              <div>
                <div className="text-xs text-slate-400 font-bold">সিএনজি ড্রাইভিং</div>
                <div className="text-sm font-black text-white font-mono">৯০% (হাইওয়ে কিং)</div>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
            ঢাকার অলিগলিতে বড় হওয়া রমজান চোর কোনো ক্ষতিকর অপরাধী নয়, বরং এক হাস্যকর চোর যার মূল লক্ষ্য মিষ্টি দোকান থেকে জিলাপি, টং দোকানের মালাই চা এবং মাছের বাজার থেকে রূপালী ইলিশ চুরি করা!
          </p>

          <button
            onClick={onClose}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black rounded-xl transition cursor-pointer"
          >
            খেলায় ফিরে যান
          </button>
        </div>
      </div>
    </div>
  );
};
