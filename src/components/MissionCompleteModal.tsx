import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, ArrowRight, Play } from 'lucide-react';
import { Mission } from '../types/game';
import { soundEngine } from '../audio/SoundFX';

interface MissionCompleteModalProps {
  mission: Mission;
  onContinue: () => void;
}

export const MissionCompleteModal: React.FC<MissionCompleteModalProps> = ({
  mission,
  onContinue,
}) => {
  useEffect(() => {
    soundEngine.playCoin();
    // Fire confetti bursts
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore
    }
  }, []);

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border-2 border-emerald-500 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.4)] p-6 text-center flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-4 text-4xl shadow-inner animate-bounce">
          🏆
        </div>

        <div className="text-emerald-400 font-black text-xs uppercase tracking-widest">
          মিশন সফল! MISSION COMPLETED!
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
          {mission.titleBn}
        </h2>

        <p className="text-sm text-slate-300 mt-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
          {mission.dialogueSuccess}
        </p>

        {/* Reward Money Box */}
        <div className="mt-4 bg-gradient-to-r from-amber-950/80 to-slate-950 border border-amber-500/50 p-4 rounded-2xl w-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Award className="w-5 h-5" />
            <span>অর্জিত পুরস্কার:</span>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            + ৳ {mission.rewardMoney.toLocaleString()}
          </div>
        </div>

        <button
          onClick={onContinue}
          className="mt-6 w-full py-3.5 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-black text-lg rounded-2xl shadow-lg border border-emerald-300 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
        >
          <span>পরবর্তী মিশনে যান</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  money: number;
  onBribeRelease: () => void;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  money,
  onBribeRelease,
  onRestart,
}) => {
  const bribeCost = 2500;
  const canBribe = money >= bribeCost;

  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border-2 border-red-600 rounded-3xl shadow-[0_0_40px_rgba(220,38,38,0.5)] p-6 text-center flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center mb-4 text-4xl shadow-inner">
          👮‍♂️
        </div>

        <div className="text-red-500 font-black text-xs uppercase tracking-widest">
          গ্রেপ্তার! ARRESTED!
        </div>

        <h2 className="text-3xl font-black text-white mt-1">
          ধরা পড়লে মার!
        </h2>

        <p className="text-sm text-slate-300 mt-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
          পুলিশ আপনাকে ধরে ফেলেছে! তবে আপনি কি পুলিশ অফিসারকে মিষ্টি খাওয়ার টাকা দিয়ে মুক্তি পেতে চান?
        </p>

        {/* Bribe Button */}
        <button
          onClick={onBribeRelease}
          disabled={!canBribe}
          className="mt-5 w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 disabled:opacity-40 text-slate-950 font-black text-base rounded-2xl shadow-lg border border-yellow-200 flex items-center justify-between active:scale-95 transition cursor-pointer"
        >
          <span>মিষ্টি খাওয়ার টাকা দিন (ঘুষ)</span>
          <span className="font-mono font-bold">৳ {bribeCost.toLocaleString()}</span>
        </button>

        {/* Retry Button */}
        <button
          onClick={onRestart}
          className="mt-3 w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-base rounded-2xl border border-slate-700 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>নতুন করে শুরু করুন</span>
        </button>
      </div>
    </div>
  );
};
