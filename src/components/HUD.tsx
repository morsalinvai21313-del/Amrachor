import React, { useRef, useEffect, useState, memo } from 'react';
import {
  Pause,
  Volume2,
  VolumeX,
  Car,
  Bell,
  Heart,
  Zap,
  Activity,
  LogOut,
  ChevronLeft,
  ChevronRight,
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
  onSteer?: (dir: number) => void;
  onThrottle?: (dir: number) => void;
  drawMiniMapCallback: (canvas: HTMLCanvasElement) => void;
  showTouchControls: boolean;
  showPerfMonitor?: boolean;
  perfStats?: {
    fps: number;
    frameTimeMs: number;
    drawCalls: number;
    triangles: number;
    activeNPCs: number;
    activeVehicles: number;
  };
}

export const HUD: React.FC<HUDProps> = memo(({
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
  onSteer,
  onThrottle,
  drawMiniMapCallback,
  showTouchControls,
  showPerfMonitor = false,
  perfStats,
}) => {
  const miniMapRef = useRef<HTMLCanvasElement | null>(null);
  const [isSprintingState, setIsSprintingState] = useState(false);
  const [activePedal, setActivePedal] = useState<'GAS' | 'BRAKE' | null>(null);
  const [activeSteerDir, setActiveSteerDir] = useState<number>(0);

  // Virtual Joystick with Direct DOM Transform (Zero React Re-render Overhead)
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const isDraggingJoyRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const joyCenterRef = useRef({ cx: 0, cy: 0 });

  // Throttled Mini-Map update (8 FPS) to eliminate CPU/GPU overdraw lag
  useEffect(() => {
    const renderMap = () => {
      if (miniMapRef.current) {
        drawMiniMapCallback(miniMapRef.current);
      }
    };
    renderMap();
    const intervalId = window.setInterval(renderMap, 125);
    return () => clearInterval(intervalId);
  }, [drawMiniMapCallback]);

  // Zero-lag Pointer Joystick Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    activePointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Fallback
    }
    isDraggingJoyRef.current = true;

    if (joystickBaseRef.current) {
      const rect = joystickBaseRef.current.getBoundingClientRect();
      joyCenterRef.current = {
        cx: rect.left + rect.width / 2,
        cy: rect.top + rect.height / 2,
      };
    }

    const maxRadius = 45;
    let dx = e.clientX - joyCenterRef.current.cx;
    let dy = e.clientY - joyCenterRef.current.cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    if (thumbRef.current) {
      thumbRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    }
    onJoystickMove(dx / maxRadius, dy / maxRadius);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingJoyRef.current || e.pointerId !== activePointerIdRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const maxRadius = 45;
    let dx = e.clientX - joyCenterRef.current.cx;
    let dy = e.clientY - joyCenterRef.current.cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    if (thumbRef.current) {
      thumbRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    }
    onJoystickMove(dx / maxRadius, dy / maxRadius);
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
    isDraggingJoyRef.current = false;

    if (thumbRef.current) {
      thumbRef.current.style.transform = 'translate3d(0px, 0px, 0)';
    }
    onJoystickMove(0, 0);
  };

  // Pedal Handlers for Driving
  const handleGasDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setActivePedal('GAS');
    onThrottle?.(1);
  };

  const handleBrakeDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setActivePedal('BRAKE');
    onThrottle?.(-1);
  };

  const handlePedalUp = (e: React.PointerEvent) => {
    e.preventDefault();
    setActivePedal(null);
    onThrottle?.(0);
  };

  // Steering Handlers for Driving
  const handleSteerDown = (dir: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    setActiveSteerDir(dir);
    onSteer?.(dir);
  };

  const handleSteerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    setActiveSteerDir(0);
    onSteer?.(0);
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-4 overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* ================= TOP BAR ================= */}
      <div className="flex items-start justify-between w-full">
        {/* Top-Left: MiniMap & Status Cluster */}
        <div className="flex items-start gap-2.5 sm:gap-3 pointer-events-auto">
          {/* Mini-Map Circular Radar */}
          <div className="relative w-22 h-22 sm:w-28 sm:h-28 rounded-full border-2 border-cyan-400 bg-slate-950/90 shadow-[0_0_15px_rgba(6,182,212,0.4)] overflow-hidden flex items-center justify-center">
            <canvas ref={miniMapRef} width={112} height={112} className="w-full h-full" />
            <div className="absolute top-1 font-bold text-[9px] text-cyan-300 drop-shadow">N</div>
          </div>

          {/* Status Bars and Driving Badge */}
          <div className="flex flex-col gap-1.5">
            {stats.isDriving && (
              <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[11px] sm:text-xs px-2.5 py-0.5 rounded-lg shadow-md border border-yellow-200 uppercase tracking-wide">
                🚗 গাড়ি চালান ({stats.drivingVehicleType})
              </div>
            )}

            {/* Health & Stamina bars */}
            <div className="flex flex-col gap-1 bg-slate-950/85 p-1.5 sm:p-2 rounded-xl border border-slate-800 shadow-md">
              {/* Health */}
              <div className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                <div className="w-18 sm:w-26 h-2 bg-slate-800 rounded-full overflow-hidden border border-red-500/30">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-rose-400 rounded-full transition-all duration-150"
                    style={{ width: `${Math.max(0, Math.min(100, (stats.health / stats.maxHealth) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Stamina */}
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <div className="w-18 sm:w-26 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-amber-500/30">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-100"
                    style={{ width: `${Math.max(0, Math.min(100, (stats.stamina / stats.maxStamina) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top-Center: High-Visibility Mission Objective Banner */}
        <div className="flex flex-col items-center gap-1.5 pointer-events-auto max-w-[200px] sm:max-w-md">
          {activeMission && (
            <div className="w-full bg-gradient-to-r from-red-950/95 via-red-900/95 to-red-950/95 border-2 border-amber-400/80 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl shadow-[0_4px_18px_rgba(220,38,38,0.5)] flex items-center gap-2 backdrop-blur-md">
              <span className="text-base sm:text-lg animate-bounce">⚠️</span>
              <div className="text-left flex-1 min-w-0">
                <div className="text-yellow-300 font-extrabold text-[11px] sm:text-xs truncate flex items-center justify-between">
                  <span>{activeMission.titleBn}</span>
                  {stats.missionDistance !== undefined && stats.missionDistance !== null && (
                    <span className="text-white font-mono bg-black/50 px-1.5 py-0.2 rounded text-[10px] ml-1">
                      {stats.missionDistance} মি.
                    </span>
                  )}
                </div>
                <div className="text-white text-[10px] sm:text-xs font-medium line-clamp-1">
                  {activeMission.objectiveBn}
                </div>
              </div>
            </div>
          )}

          {/* Police Chase Alert */}
          {stats.wantedLevel >= 1 && (
            <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-[10px] sm:text-xs px-3 py-1 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.8)] border border-yellow-300 animate-pulse flex items-center gap-1.5">
              <span>🚨</span>
              <span>পুলিশের হাত থেকে বাঁচুন!</span>
            </div>
          )}
        </div>

        {/* Top-Right: Speedometer (if driving), Money, Wanted Stars, Pause & Mute */}
        <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
          {/* Speedometer Dial when driving */}
          {stats.isDriving && (
            <div className="bg-slate-950/95 border-2 border-emerald-400 px-3 py-1 rounded-2xl flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.4)] backdrop-blur-md">
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tabular-nums">
                {stats.speedKmh}
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-300 font-bold uppercase leading-tight">
                <div className="text-white font-extrabold">KM/H</div>
                <div className="text-amber-400 text-[8px]">স্পিড</div>
              </div>
            </div>
          )}

          {/* Money Badge (Bangladeshi Taka '৳') */}
          <div className="flex items-center gap-1.5 bg-slate-950/90 px-3 py-1 rounded-xl border border-amber-500/50 shadow-lg">
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

          {/* Controls Cluster: Mute & Pause */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleMute();
              }}
              style={{ touchAction: 'none' }}
              className="p-2 bg-slate-900/85 hover:bg-slate-800 text-amber-400 rounded-xl border border-slate-700 active:scale-90 transition cursor-pointer"
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
              className="p-2 bg-slate-900/85 hover:bg-slate-800 text-white rounded-xl border border-slate-700 active:scale-90 transition cursor-pointer"
              title="পজ করুন"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= MIDDLE CENTER ================= */}
      <div className="my-auto flex flex-col items-center justify-center gap-2 pointer-events-none">
        {/* Real-time Hardware Performance Monitor */}
        {showPerfMonitor && perfStats && (
          <div className="pointer-events-auto bg-slate-950/90 border border-emerald-500/60 px-3 py-1 rounded-xl shadow-lg backdrop-blur-sm flex items-center gap-2.5 text-[10px] font-mono text-slate-300">
            <div className="flex items-center gap-1 text-emerald-400 font-bold">
              <Activity className="w-3 h-3" />
              <span>{perfStats.fps} FPS</span>
            </div>
            <span>•</span>
            <div>{perfStats.frameTimeMs} ms</div>
            <span>•</span>
            <div>Draws: {perfStats.drawCalls}</div>
          </div>
        )}

        {/* Proximity Shop Interaction Action Button */}
        {nearShopPrompt && (
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onInteract();
            }}
            style={{ touchAction: 'none' }}
            className="pointer-events-auto bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm sm:text-base px-5 py-2.5 rounded-2xl shadow-[0_4px_20px_rgba(245,158,11,0.6)] border-2 border-white flex items-center gap-2 active:scale-90 transition cursor-pointer animate-pulse"
          >
            <span className="text-xl">🏪</span>
            <span>{nearShopPrompt} [E]</span>
          </button>
        )}
      </div>

      {/* ================= BOTTOM AREA ================= */}
      <div className="flex items-end justify-between w-full pointer-events-none">
        {/* Left Side: Joystick or Vehicle Steering Arrows */}
        {showTouchControls && (
          <div className="pointer-events-auto">
            {stats.isDriving ? (
              /* Driving Steering Arrows (◀ and ▶) */
              <div className="flex items-center gap-3">
                <button
                  onPointerDown={handleSteerDown(1)}
                  onPointerUp={handleSteerUp}
                  onPointerCancel={handleSteerUp}
                  style={{ touchAction: 'none' }}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-900/80 border-2 active:scale-90 transition flex items-center justify-center shadow-xl cursor-pointer ${
                    activeSteerDir > 0
                      ? 'border-yellow-400 bg-amber-600/60 text-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.6)]'
                      : 'border-slate-500 text-white hover:border-cyan-400'
                  }`}
                  title="বামে ঘোরান"
                >
                  <ChevronLeft className="w-8 h-8 sm:w-10 sm:h-10" />
                </button>
                <button
                  onPointerDown={handleSteerDown(-1)}
                  onPointerUp={handleSteerUp}
                  onPointerCancel={handleSteerUp}
                  style={{ touchAction: 'none' }}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-900/80 border-2 active:scale-90 transition flex items-center justify-center shadow-xl cursor-pointer ${
                    activeSteerDir < 0
                      ? 'border-yellow-400 bg-amber-600/60 text-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.6)]'
                      : 'border-slate-500 text-white hover:border-cyan-400'
                  }`}
                  title="ডানে ঘোরান"
                >
                  <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10" />
                </button>
              </div>
            ) : (
              /* Walking Virtual Joystick */
              <div
                ref={joystickBaseRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{ touchAction: 'none' }}
                className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-900/70 border-2 border-cyan-400/50 backdrop-blur-sm flex items-center justify-center shadow-2xl cursor-pointer select-none"
              >
                <div
                  ref={thumbRef}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-b from-cyan-400 to-blue-600 shadow-lg border-2 border-white pointer-events-none will-change-transform"
                />
              </div>
            )}
          </div>
        )}

        {/* Center: Desktop Quick Key Hints */}
        <div className="hidden md:flex items-center gap-2 bg-slate-950/80 px-3 py-1 rounded-xl border border-slate-800 text-[11px] text-slate-300 backdrop-blur-sm pointer-events-auto">
          <span className="font-mono bg-slate-800 px-1 py-0.5 rounded text-amber-300">WASD</span> সরুন •{' '}
          <span className="font-mono bg-slate-800 px-1 py-0.5 rounded text-amber-300">Space</span> লাফ •{' '}
          <span className="font-mono bg-slate-800 px-1 py-0.5 rounded text-amber-300">Shift</span> দৌড় •{' '}
          <span className="font-mono bg-slate-800 px-1 py-0.5 rounded text-amber-300">F</span> ঘুসি •{' '}
          <span className="font-mono bg-slate-800 px-1 py-0.5 rounded text-amber-300">V</span> গাড়ি •{' '}
          <span className="font-mono bg-slate-800 px-1 py-0.5 rounded text-amber-300">H</span> হর্ন
        </div>

        {/* Right Side: Driving Pedals OR Walking Action Buttons */}
        <div className="pointer-events-auto">
          {stats.isDriving ? (
            /* ================= DRIVING CONTROLS: BRAKE & GAS PEDALS ================= */
            <div className="flex items-end gap-3 select-none">
              {/* Horn Button */}
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  onHonkHorn();
                }}
                style={{ touchAction: 'none' }}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex flex-col items-center justify-center shadow-lg border-2 border-amber-200 active:scale-85 transition cursor-pointer"
                title="হর্ন বাজান [H]"
              >
                <Bell className="w-5 h-5 fill-slate-950" />
                <span className="text-[9px] font-bold">হর্ন</span>
              </button>

              {/* Exit Vehicle Button */}
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  onToggleVehicle();
                }}
                style={{ touchAction: 'none' }}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-black flex flex-col items-center justify-center shadow-lg border-2 border-rose-300 active:scale-85 transition cursor-pointer"
                title="গাড়ি থেকে নামুন [V]"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-[9px] font-bold">নামুন</span>
              </button>

              {/* Realistic Metal Brake Pedal */}
              <button
                onPointerDown={handleBrakeDown}
                onPointerUp={handlePedalUp}
                onPointerCancel={handlePedalUp}
                style={{ touchAction: 'none' }}
                className={`w-14 h-20 sm:w-16 sm:h-24 rounded-2xl flex flex-col items-center justify-center border-3 transition-all duration-75 cursor-pointer shadow-2xl active:scale-95 ${
                  activePedal === 'BRAKE'
                    ? 'bg-gradient-to-b from-red-600 to-rose-800 border-white shadow-[0_0_20px_rgba(239,68,68,0.8)] translate-y-1'
                    : 'bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-slate-400 hover:border-red-400'
                }`}
                title="ব্রেক ও রিভার্স"
              >
                <div className="flex flex-col gap-1 items-center">
                  <div className="w-8 sm:w-10 h-1.5 bg-slate-400/80 rounded" />
                  <div className="w-8 sm:w-10 h-1.5 bg-slate-400/80 rounded" />
                  <div className="w-8 sm:w-10 h-1.5 bg-slate-400/80 rounded" />
                </div>
                <span className="text-[10px] sm:text-xs font-black text-white mt-1 uppercase tracking-wider">
                  ব্রেক
                </span>
              </button>

              {/* Realistic Metal Gas Pedal (Accelerator) */}
              <button
                onPointerDown={handleGasDown}
                onPointerUp={handlePedalUp}
                onPointerCancel={handlePedalUp}
                style={{ touchAction: 'none' }}
                className={`w-14 h-24 sm:w-16 sm:h-28 rounded-2xl flex flex-col items-center justify-center border-3 transition-all duration-75 cursor-pointer shadow-2xl active:scale-95 ${
                  activePedal === 'GAS'
                    ? 'bg-gradient-to-b from-emerald-500 to-green-700 border-white shadow-[0_0_20px_rgba(16,185,129,0.8)] translate-y-1'
                    : 'bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-slate-400 hover:border-emerald-400'
                }`}
                title="এক্সিলারেটর (গ্যাস)"
              >
                <div className="flex flex-col gap-1 items-center">
                  <div className="w-8 sm:w-10 h-1 bg-slate-400/80 rounded" />
                  <div className="w-8 sm:w-10 h-1 bg-slate-400/80 rounded" />
                  <div className="w-8 sm:w-10 h-1 bg-slate-400/80 rounded" />
                  <div className="w-8 sm:w-10 h-1 bg-slate-400/80 rounded" />
                </div>
                <span className="text-[10px] sm:text-xs font-black text-emerald-300 mt-2 uppercase tracking-wider">
                  গ্যাস
                </span>
              </button>
            </div>
          ) : (
            /* ================= WALKING CONTROLS: ACTION BUTTONS ================= */
            <div className="flex items-center gap-2 sm:gap-3 select-none">
              {/* Vehicle Enter Button */}
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  onToggleVehicle();
                }}
                style={{ touchAction: 'none' }}
                className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-black flex flex-col items-center justify-center border-2 border-emerald-300 active:scale-85 transition cursor-pointer shadow-lg select-none"
                title="গাড়িতে উঠুন [V]"
              >
                <Car className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-[9px] sm:text-[10px] font-bold">গাড়ি</span>
              </button>

              {/* Jump Button */}
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  onJump();
                }}
                style={{ touchAction: 'none' }}
                className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 text-white font-black flex flex-col items-center justify-center shadow-[0_4px_14px_rgba(37,99,235,0.5)] border-2 border-blue-300 active:scale-85 transition cursor-pointer select-none"
                title="লাফ দিন [Space]"
              >
                <span className="text-xl sm:text-2xl">🏃‍♂️</span>
                <span className="text-[9px] sm:text-[10px] font-bold">লাফ</span>
              </button>

              {/* Sprint / Run Button */}
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
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
                <span className="text-xl sm:text-2xl">🏃</span>
                <span className="text-[9px] sm:text-[10px] font-bold">দৌড়</span>
              </button>

              {/* Punch / Slap Button ("ঢিসুম!") - Big Primary Action */}
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  onPunch();
                }}
                style={{ touchAction: 'none' }}
                className="w-15 h-15 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-red-600 via-rose-600 to-amber-600 hover:from-red-500 text-white font-black flex flex-col items-center justify-center shadow-[0_6px_20px_rgba(239,68,68,0.7)] border-3 border-yellow-300 active:scale-85 transition cursor-pointer select-none"
                title="ঘুসি / চড় মারুন [F]"
              >
                <span className="text-2xl sm:text-3xl">👊</span>
                <span className="text-[10px] sm:text-[11px] font-black">ঘুসি [F]</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
