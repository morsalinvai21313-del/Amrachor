import React from 'react';
import { Settings, Sun, Moon, CloudRain, Monitor, Volume2, X } from 'lucide-react';
import { GameSettings, TimeOfDay, WeatherType } from '../types/game';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between text-white border-b border-slate-700">
          <div className="flex items-center gap-2.5 font-black text-xl">
            <Settings className="w-6 h-6 text-amber-400" />
            <span>গেম সেটিংস (SETTINGS)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/20 text-white transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[75vh]">
          {/* Day / Night Time Cycle */}
          <div>
            <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>পরিবেশের সময় (Time of Day)</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['DAWN', 'DAY', 'SUNSET', 'NIGHT'] as TimeOfDay[]).map((t) => (
                <button
                  key={t}
                  onClick={() => onUpdateSettings({ timeOfDay: t })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                    settings.timeOfDay === t
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {t === 'DAWN' ? 'ভোর' : t === 'DAY' ? 'দুপুর' : t === 'SUNSET' ? 'সন্ধ্যা' : 'রাত'}
                </button>
              ))}
            </div>
          </div>

          {/* Weather */}
          <div>
            <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-cyan-400" />
              <span>আবহাওয়া (Weather)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateSettings({ weather: 'CLEAR' })}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                  settings.weather === 'CLEAR'
                    ? 'bg-cyan-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                রৌদ্রোজ্জ্বল (Clear Sun)
              </button>
              <button
                onClick={() => onUpdateSettings({ weather: 'RAIN' })}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                  settings.weather === 'RAIN'
                    ? 'bg-cyan-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                বৃষ্টি (Dhaka Monsoon Rain)
              </button>
            </div>
          </div>

          {/* Graphics Quality */}
          <div>
            <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Monitor className="w-4 h-4 text-emerald-400" />
              <span>গ্রাফিক্স কোয়ালিটি (Android Graphics)</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['LOW', 'MEDIUM', 'HIGH', 'ULTRA'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => onUpdateSettings({ graphicsQuality: q })}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    settings.graphicsQuality === q
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Audio Volume */}
          <div>
            <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-purple-400" />
              <span>শব্দ ও সাউন্ড ভলিউম (Volume)</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.soundVolume}
              onChange={(e) => onUpdateSettings({ soundVolume: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Touch Controls Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <span className="text-sm font-bold text-slate-200">মোবাইল ভার্চুয়াল জয়স্টিক দেখান</span>
            <input
              type="checkbox"
              checked={settings.showTouchControls}
              onChange={(e) => onUpdateSettings({ showTouchControls: e.target.checked })}
              className="w-5 h-5 accent-amber-500 cursor-pointer rounded"
            />
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition cursor-pointer mt-2"
          >
            সংরক্ষণ করুন (SAVE)
          </button>
        </div>
      </div>
    </div>
  );
};

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between text-white border-b border-slate-700">
          <div className="font-black text-xl text-amber-400">আমরা চোর — Amra Chor</div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/20 text-white transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 text-sm text-slate-300">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎮</span>
            <div>
              <div className="font-extrabold text-white text-base">Amra Studio Inc.</div>
              <div className="text-xs text-amber-400">Package: com.amra.chor • Version 1.0.0</div>
            </div>
          </div>

          <p className="leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <strong>"আমরা চোর"</strong> বাংলাদেশের শহর জীবন, পুরান ঢাকার অলিগলি, রিকশা-সিএনজি কালচার এবং প্রাণবন্ত লোকাল কমেডি নিয়ে নির্মিত একটি অ্যাডভান্সড ৩ডি ওপেন ওয়ার্ল্ড গেম।
          </p>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs flex flex-col gap-1.5 font-mono">
            <div>• Engine: Three.js 3D (Web) & Unity 3D URP (Android)</div>
            <div>• Namespace: AmraChor</div>
            <div>• Sound: Procedural Web Audio Bengali Synthesizer</div>
            <div>• AI: Autonomous NPC Crowd & Police Patrol AI</div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition cursor-pointer mt-2"
          >
            ঠিক আছে
          </button>
        </div>
      </div>
    </div>
  );
};
