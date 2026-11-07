import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Pause,
  Volume2,
  VolumeX,
  Footprints,
  Flame,
  ArrowUp,
  MessageCircle,
  Car,
  Bell,
  Heart,
  Zap,
} from 'lucide-react';
import { PlayerStats, Mission } from '../types/game';

interface HUDProps {
  stats: PlayerStats;
  activeMission: Mission | null;
  nearShopPrompt: string | null;
  onPause: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onJump: () => void;
  onSprintToggle: (sprinting: boolean) => void;
  onPunch: () => void;
  onInteract: () => void;
  onToggleVehicle: () => void;
  onHonkHorn: () => void;
  onJoystickMove: (x: number, y: number) => void;
  drawMiniMapCallback: (canvas: HTMLCanvasElement) => void;
  showTouchControls: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  activeMission,
  nearShopPrompt,
  onPause,
  isMuted,
  onToggleMute,
  onJump,
  onSprintToggle,
  onPunch,
  onInteract,
  onToggleVehicle,
  onHonkHorn,
  onJoystickMove,
  drawMiniMapCallback,
  showTouchControls,
}) => {
  const miniMapRef = useRef<HTMLCanvasElement | null>(null);
  const [isSprintingState, setIsSprintingState] = useState(false);

  // Virtual Joystick state with pointer capture & ID tracking for zero lag multi-touch
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const [joystickThumb, setJoystickThumb] = useState({ x: 0, y: 0 });
  const [isDraggingJoy, setIsDraggingJoy] = useState(false);
  const activePointerIdRef = useRef<number | null>(null);

  // Throttled Mini-Map update (10 FPS) to eliminate CPU/GPU overdraw lag
  useEffect(() => {
    const renderMap = () => {
      if (miniMapRef.current) {
        drawMiniMapCallback(miniMapRef.current);
      }
    };
    renderMap();
    const intervalId = window.setInterval(renderMap, 100);
    return () => clearInterval(intervalId);
  }, [drawMiniMapCallback]);

  // Zero-lag Pointer Joystick Handlers
  const updateJoystickCoords = useCallback((clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxRadius = 45;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setJoystickThumb({ x: dx, y: dy });
    onJoystickMove(dx / maxRadius, dy / maxRadius);
  }, [onJoystickMove]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    activePointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Fallback if browser doesn't support capture
    }
    setIsDraggingJoy(true);
    updateJoystickCoords(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingJoy || e.pointerId !== activePointerIdRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    updateJoystickCoords(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== activePointerIdRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    activePointerIdRef.current = null;
    setIsDraggingJoy(false);
    setJoystickThumb({ x: 0, y: 0 });
    onJoystickMove(0, 0);
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-4 overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* Top Bar: MiniMap, Mission Banner, Stars & Money */}
      <div className="flex items-start justify-between w-full">
        {/* Top-Left: MiniMap & Status Cluster */}
        <div className="flex items-start gap-2.5 sm:gap-3 pointer-events-auto">
          {/* Mini-Map Radar */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-cyan-400 bg-slate-950/90 shadow-[0_0_15px_rgba(6,182,212,0.4)] overflow-hidden flex items-center justify-center">
            <canvas ref={miniMapRef} width={110} height={110} className="w-full h-full" />
            <div className="absolute top-1 font-bold text-[9px] text-cyan-300 drop-shadow">N</div>
          </div>

          {/* Health & Stamina bars */}
          <div className="flex flex-col gap-1.5 bg-slate-950/80 p-2 sm:p-2.5 rounded-xl border border-slate-800 shadow-md">
            {/* Health */}
            <div className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
              <div className="w-20 sm:w-28 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-red-500/30">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-400 rounded-full transition-all duration-150"
                  style={{ width: `${Math.max(0, Math.min(100, (stats.health / stats.maxHealth) * 100))}%` }}
                />
              </div>
            </div>

            {/* Stamina */}
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <div className="w-20 sm:w-28 h-2 bg-slate-800 rounded-full overflow-hidden border border-amber-500/30">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-100"
                  style={{ width: `${Math.max(0, Math.min(100, (stats.stamina / stats.maxStamina) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top-Center: Mission Objective Banner */}
        {activeMission && (
          <div className="pointer-events-auto max-w-[180px] sm:max-w-sm bg-gradient-to-r from-red-950/90 via-slate-900/90 to-red-950/90 border border-amber-500/50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl shadow-xl flex items-center gap-2 backdrop-blur-md">
            <span className="text-lg">⚠️</span>
            <div className="text-left">
              <div className="text-amber-400 font-extrabold text-[11px] sm:text-xs truncate">
                {activeMission.titleBn}
              </div>
              <div className="text-white text-[10px] sm:text-xs font-medium line-clamp-1">
                {activeMission.objectiveBn}
              </div>
            </div>
          </div>
        )}

        {/* Top-Right: Money, Wanted Stars, Pause & Mute */}
        <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
          {/* Money Badge */}
          <div className="flex items-center gap-1.5 bg-slate-950/90 px-3 py-1 rounded-xl border border-amber-500/40 shadow-lg">
            <span className="text-amber-400 font-black text-base sm:text-lg">৳</span>
            <span className="text-white font-mono font-bold text-sm sm:text-base tracking-wider tabular-nums">
              {stats.money.toLocaleString()}
            </span>
          </div>

          {/* 5-Star Wanted Level */}
          <div className="flex items-center gap-0.5 bg-slate-950/80 px-2 py-0.5 rounded-lg border border-red-900/40 shadow">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-base sm:text-lg transition-transform ${
                  star <= stats.wantedLevel
                    ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.9)] scale-110'
                    : 'text-slate-700'
                }`}
              >
                ★
              </span>
            ))}
          </div>

          {/* Pause & Mute Controls */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleMute();
              }}
              style={{ touchAction: 'none' }}
              className="p-2 bg-slate-900/80 hover:bg-slate-800 text-amber-400 rounded-xl border border-slate-700 active:scale-90 transition cursor-pointer"
              title="শব্দ অন/অফ"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onPause();
              }}
              style={{ touchAction: 'none' }}
              className="p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-slate-700 active:scale-90 transition cursor-pointer"
              title="পজ করুন"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Middle Center: Interaction Prompts */}
      <div className="my-auto flex flex-col items-center justify-center gap-2 pointer-events-none">
        {nearShopPrompt && (
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onInteract();
            }}
            style={{ touchAction: 'none' }}
            className="pointer-events-auto bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm sm:text-base px-5 py-2.5 rounded-2xl shadow-[0_4px_16px_rgba(245,158,11,0.5)] border-2 border-white flex items-center gap-2 active:scale-90 transition cursor-pointer animate-pulse"
          >
            <MessageCircle className="w-5 h-5 fill-slate-950" />
            <span>{nearShopPrompt} [E]</span>
          </button>
        )}

        {/* Speedometer display when driving */}
        {stats.isDriving && (
          <div className="pointer-events-auto bg-slate-950/90 border-2 border-emerald-500 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-2xl backdrop-blur-md">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tabular-nums">
              {stats.speedKmh}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-300 font-bold uppercase tracking-wider">
              <div>KM/H</div>
              <div className="text-amber-400">{stats.drivingVehicleType}</div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Area: Controls Bar & Mobile Touch Controls */}
      <div className="flex items-end justify-between w-full pointer-events-none">
        {/* Left Side: Virtual Joystick (Touch controls) */}
        {showTouchControls && (
          <div
            ref={joystickBaseRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ touchAction: 'none' }}
            className="pointer-events-auto relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-900/70 border-2 border-cyan-400/50 backdrop-blur-sm flex items-center justify-center shadow-2xl cursor-pointer select-none"
          >
            {/* Joystick thumb */}
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-b from-cyan-400 to-blue-600 shadow-lg border-2 border-white pointer-events-none transform transition-transform"
              style={{
                transform: `translate(${joystickThumb.x}px, ${joystickThumb.y}px)`,
              }}
            />
          </div>
        )}

        {/* Center: Desktop Quick Key Hints (Desktop only) */}
        <div className="hidden md:flex items-center gap-2 bg-slate-950/80 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300 backdrop-blur-sm pointer-events-auto">
          <span className="font-mono bg-slate-800 px-1 py-0.5 rounded text-amber-300">WASD</span> সরুন •{' '}
          <span className="font-mono bg-slate-800 px-1 py-0.5 rounded text-amber-300">Space</span> লাফ •{' '}
          <span className="font-mono bg-slate-800 px-1 py-0.5 rounded text-amber-300">Shift</span> দৌড় •{' '}
          <span className="font-mono bg-slate-800 px-1 py-0.5 rounded text-amber-300">F</span> চড়/ঘুসি •{' '}
          <span className="font-mono bg-slate-800 px-1 py-0.5 rounded text-amber-300">E</span> কথা •{' '}
          <span className="font-mono bg-slate-800 px-1 py-0.5 rounded text-amber-300">V</span> গাড়ি •{' '}
          <span className="font-mono bg-slate-800 px-1 py-0.5 rounded text-amber-300">H</span> হর্ন
        </div>

        {/* Right Side: Multi-Touch Action Buttons Grid */}
        <div className="pointer-events-auto grid grid-cols-3 gap-2 sm:gap-2.5">
          {/* Punch / Slap Button ("ঢিসুম!") */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPunch();
            }}
            style={{ touchAction: 'none' }}
            className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-red-600 to-rose-700 hover:from-red-500 text-white font-black flex flex-col items-center justify-center shadow-[0_4px_14px_rgba(239,68,68,0.5)] border-2 border-rose-300 active:scale-85 transition cursor-pointer select-none"
            title="ঘুসি / চড় মারুন [F]"
          >
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
            <span className="text-[9px] sm:text-[10px] font-bold">ঘুসি [F]</span>
          </button>

          {/* Jump Button */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onJump();
            }}
            style={{ touchAction: 'none' }}
            className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 text-white font-black flex flex-col items-center justify-center shadow-[0_4px_14px_rgba(37,99,235,0.5)] border-2 border-blue-300 active:scale-85 transition cursor-pointer select-none"
            title="লাফ দিন [Space]"
          >
            <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[9px] sm:text-[10px] font-bold">লাফ</span>
          </button>

          {/* Sprint / Run Button */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const next = !isSprintingState;
              setIsSprintingState(next);
              onSprintToggle(next);
            }}
            style={{ touchAction: 'none' }}
            className={`w-13 h-13 sm:w-16 sm:h-16 rounded-full font-black flex flex-col items-center justify-center border-2 active:scale-85 transition cursor-pointer shadow-lg select-none ${
              isSprintingState
                ? 'bg-amber-500 text-slate-950 border-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.7)]'
                : 'bg-slate-800 text-white border-slate-600 hover:bg-slate-700'
            }`}
            title="দৌড় [Shift]"
          >
            <Footprints className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[9px] sm:text-[10px] font-bold">দৌড়</span>
          </button>

          {/* Vehicle Enter / Exit Button */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleVehicle();
            }}
            style={{ touchAction: 'none' }}
            className={`w-13 h-13 sm:w-16 sm:h-16 rounded-full font-black flex flex-col items-center justify-center border-2 active:scale-85 transition cursor-pointer shadow-lg select-none ${
              stats.isDriving
                ? 'bg-rose-600 text-white border-rose-300 shadow-[0_0_12px_rgba(225,29,72,0.6)]'
                : 'bg-emerald-600 text-white border-emerald-300 hover:bg-emerald-500'
            }`}
            title={stats.isDriving ? 'নামুন [V]' : 'উঠুন [V]'}
          >
            <Car className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[9px] sm:text-[10px] font-bold">{stats.isDriving ? 'নামুন' : 'সিএনজি'}</span>
          </button>

          {/* Horn / Bell Button */}
          {stats.isDriving && (
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onHonkHorn();
              }}
              style={{ touchAction: 'none' }}
              className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex flex-col items-center justify-center shadow-lg border-2 border-amber-200 active:scale-85 transition cursor-pointer select-none"
              title="হর্ন বাজান [H]"
            >
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 fill-slate-950" />
              <span className="text-[9px] sm:text-[10px] font-bold">হর্ন</span>
            </button>
          )}

          {/* Interact Button */}
          {nearShopPrompt && (
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onInteract();
              }}
              style={{ touchAction: 'none' }}
              className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-black flex flex-col items-center justify-center shadow-lg border-2 border-cyan-300 active:scale-85 transition cursor-pointer select-none animate-pulse"
              title="কথা বলুন [E]"
            >
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-[9px] sm:text-[10px] font-bold">কথা [E]</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
