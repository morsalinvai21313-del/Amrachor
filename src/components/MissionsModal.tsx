import React from 'react';
import { Target, CheckCircle2, Lock, Play, X } from 'lucide-react';
import { Mission } from '../types/game';

interface MissionsModalProps {
  missions: Mission[];
  activeMissionId: number | null;
  onSelectMission: (mission: Mission) => void;
  onClose: () => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  missions,
  activeMissionId,
  onSelectMission,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-amber-500 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5 font-black text-xl">
            <Target className="w-6 h-6 text-amber-400" />
            <span>গেমের মিশন সমূহ (MISSIONS)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/20 text-white transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Missions List */}
        <div className="p-6 overflow-y-auto flex flex-col gap-4">
          {missions.map((m) => {
            const isActive = m.id === activeMissionId;
            return (
              <div
                key={m.id}
                className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isActive
                    ? 'bg-blue-950/80 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : m.completed
                    ? 'bg-emerald-950/40 border-emerald-600/60'
                    : m.unlocked
                    ? 'bg-slate-800/80 border-slate-700'
                    : 'bg-slate-950/60 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {m.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    ) : m.unlocked ? (
                      <Target className="w-6 h-6 text-amber-400" />
                    ) : (
                      <Lock className="w-6 h-6 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-base">{m.titleBn}</span>
                      {isActive && (
                        <span className="bg-cyan-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                          চলমান মিশন
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-300 mt-1 max-w-md">{m.descriptionBn}</div>
                    <div className="mt-2 text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <span>পুরস্কার:</span>
                      <span className="font-mono text-sm">৳ {m.rewardMoney.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-auto">
                  {m.unlocked ? (
                    <button
                      onClick={() => onSelectMission(m)}
                      disabled={isActive}
                      className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 ${
                        isActive
                          ? 'bg-cyan-600 text-slate-950 cursor-default'
                          : 'bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white shadow-md'
                      }`}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{isActive ? 'খেলা হচ্ছে' : 'মিশন শুরু করুন'}</span>
                    </button>
                  ) : (
                    <div className="text-xs text-slate-500 font-bold px-3 py-2 bg-slate-900 rounded-lg text-center border border-slate-800">
                      লক করা
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
