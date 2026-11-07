import { useEffect, useRef, useState, useCallback } from 'react';
import { GameWorld } from './game/GameWorld';
import { INITIAL_MISSIONS } from './game/missionData';
import { GameSettings, GameState, Mission, PlayerStats } from './types/game';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { ShopDialogModal } from './components/ShopDialogModal';
import { MissionsModal } from './components/MissionsModal';
import { MissionCompleteModal, GameOverModal } from './components/MissionCompleteModal';
import { UnityExportModal } from './components/UnityExportModal';
import { CharacterModal } from './components/CharacterModal';
import { SettingsModal, AboutModal } from './components/SettingsModal';
import { soundEngine } from './audio/SoundFX';

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<GameWorld | null>(null);

  // High-level Game States
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);
  const [activeMission, setActiveMission] = useState<Mission | null>(INITIAL_MISSIONS[0]);

  // Player Stats synced to HUD
  const [stats, setStats] = useState<PlayerStats>({
    money: 25750,
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    wantedLevel: 1,
    isDriving: false,
    drivingVehicleType: null,
    speedKmh: 0,
  });

  // Modals Visibility
  const [showShopModal, setShowShopModal] = useState(false);
  const [currentShopName, setCurrentShopName] = useState('ঢাকা সুইটস');
  const [nearShopPrompt, setNearShopPrompt] = useState<string | null>(null);

  const [showMissionsModal, setShowMissionsModal] = useState(false);
  const [showUnityModal, setShowUnityModal] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const [completedMission, setCompletedMission] = useState<Mission | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);

  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    graphicsQuality: 'HIGH',
    soundVolume: 0.8,
    voiceVolume: 0.9,
    timeOfDay: 'DAY',
    weather: 'CLEAR',
    showTouchControls: true,
  });

  const [isMuted, setIsMuted] = useState(false);

  // Keys Held Tracking for 60fps simulation
  const keysHeld = useRef<{ [key: string]: boolean }>({});

  // Initialize GameWorld once
  useEffect(() => {
    if (!mountRef.current) return;

    const world = new GameWorld(mountRef.current);
    worldRef.current = world;
    world.activeMission = activeMission;

    // Callbacks from GameWorld
    world.onNearShop = (shopName, prompt) => {
      setCurrentShopName(shopName);
      setNearShopPrompt(prompt);
    };

    world.onLeaveShop = () => {
      setNearShopPrompt(null);
    };

    world.onMissionObjectiveReached = () => {
      if (world.activeMission && !world.activeMission.completed) {
        world.activeMission.completed = true;
        setCompletedMission(world.activeMission);
        setGameState('MISSION_COMPLETE');

        // Award Money
        world.stats.money += world.activeMission.rewardMoney;

        // Unlock next mission
        setMissions((prev) =>
          prev.map((m) => {
            if (m.id === world.activeMission?.id) {
              return { ...m, completed: true };
            }
            if (m.id === (world.activeMission?.id ?? 0) + 1) {
              return { ...m, unlocked: true };
            }
            return m;
          })
        );
      }
    };

    world.onPoliceArrest = () => {
      setIsGameOver(true);
      setGameState('GAME_OVER');
      soundEngine.speakBengali('ধরা পড়লে মার! পুলিশ আপনাকে ধরেছে!', 1.0, 1.05);
    };

    world.start();

    // Throttled sync for React HUD stats; avoids re-renders if stats are identical
    const syncInterval = window.setInterval(() => {
      if (worldRef.current) {
        const s = worldRef.current.stats;
        setStats((prev) => {
          if (
            prev.money === s.money &&
            prev.health === s.health &&
            prev.stamina === s.stamina &&
            prev.wantedLevel === s.wantedLevel &&
            prev.isDriving === s.isDriving &&
            prev.speedKmh === s.speedKmh
          ) {
            return prev;
          }
          return { ...s };
        });
      }
    }, 200);

    return () => {
      clearInterval(syncInterval);
      world.dispose();
      worldRef.current = null;
    };
  }, []);

  // Update activeMission reference in world
  useEffect(() => {
    if (worldRef.current) {
      worldRef.current.activeMission = activeMission;
    }
  }, [activeMission]);

  // Update environment when settings change
  useEffect(() => {
    if (worldRef.current) {
      worldRef.current.setEnvironmentTime(settings.timeOfDay, settings.weather);
    }
  }, [settings.timeOfDay, settings.weather]);

  // Handle Keyboard Inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      keysHeld.current[e.code] = true;

      const world = worldRef.current;
      if (!world) return;

      // Punch [F]
      if (e.code === 'KeyF') {
        world.performPunch();
      }
      // Interact / Talk [E]
      if (e.code === 'KeyE') {
        if (nearShopPrompt) {
          setShowShopModal(true);
        }
      }
      // Vehicle [V]
      if (e.code === 'KeyV') {
        world.toggleVehicle();
      }
      // Horn [H]
      if (e.code === 'KeyH') {
        world.honkVehicleHorn();
      }
      // Jump [Space]
      if (e.code === 'Space') {
        world.inputJump = true;
      }
      // Mute [M]
      if (e.code === 'KeyM') {
        const m = soundEngine.toggleMute();
        setIsMuted(m);
      }
      // Pause [KeyP or Escape]
      if (e.code === 'KeyP' || e.code === 'Escape') {
        setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysHeld.current[e.code] = false;
      const world = worldRef.current;
      if (!world) return;
      if (e.code === 'Space') {
        world.inputJump = false;
      }
    };

    const updateKeys = () => {
      const world = worldRef.current;
      if (!world) return;
      let x = 0;
      let y = 0;
      if (keysHeld.current['KeyA'] || keysHeld.current['ArrowLeft']) x -= 1;
      if (keysHeld.current['KeyD'] || keysHeld.current['ArrowRight']) x += 1;
      if (keysHeld.current['KeyW'] || keysHeld.current['ArrowUp']) y += 1;
      if (keysHeld.current['KeyS'] || keysHeld.current['ArrowDown']) y -= 1;

      world.inputMove.x = x;
      world.inputMove.y = y;
      world.inputSprint = !!(keysHeld.current['ShiftLeft'] || keysHeld.current['ShiftRight']);
    };

    const handleKeyDownWrapper = (e: KeyboardEvent) => {
      handleKeyDown(e);
      updateKeys();
    };

    const handleKeyUpWrapper = (e: KeyboardEvent) => {
      handleKeyUp(e);
      updateKeys();
    };

    window.addEventListener('keydown', handleKeyDownWrapper);
    window.addEventListener('keyup', handleKeyUpWrapper);

    return () => {
      window.removeEventListener('keydown', handleKeyDownWrapper);
      window.removeEventListener('keyup', handleKeyUpWrapper);
    };
  }, [nearShopPrompt]);

  // Actions
  const handleStartGame = () => {
    setGameState('PLAYING');
    soundEngine.speakBengali('চোরগিরি করাই আমাদের কাম! পুলিশ থেকে বাঁচুন!', 1.1, 1.05);
  };

  const handlePause = () => {
    setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : 'PLAYING'));
  };

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleJoystickMove = useCallback((x: number, y: number) => {
    if (worldRef.current) {
      worldRef.current.inputMove.x = x;
      worldRef.current.inputMove.y = -y; // Invert for forward standard
    }
  }, []);

  const handleMiniMapDraw = useCallback((canvas: HTMLCanvasElement) => {
    if (worldRef.current) {
      worldRef.current.drawMiniMap(canvas);
    }
  }, []);

  const handleSelectMission = (mission: Mission) => {
    setActiveMission(mission);
    setShowMissionsModal(false);
    if (gameState === 'TITLE') {
      setGameState('PLAYING');
    }
    soundEngine.speakBengali(mission.dialogueIntro, 1.1, 1.05);
  };

  const handleContinueAfterMission = () => {
    setCompletedMission(null);
    setGameState('PLAYING');
    // Set next unlocked mission if available
    const nextMission = missions.find((m) => m.id === (activeMission?.id ?? 0) + 1);
    if (nextMission) {
      setActiveMission(nextMission);
    }
  };

  const handleBribeRelease = () => {
    if (worldRef.current && worldRef.current.stats.money >= 2500) {
      worldRef.current.stats.money -= 2500;
      worldRef.current.stats.wantedLevel = 0;
      worldRef.current.stats.health = 100;
      soundEngine.speakBengali('আচ্ছা ঠিক আছে! মিষ্টি খাওয়ার জন্য টাকাটা রাখলাম, পালাও!', 1.0, 1.05);
      setIsGameOver(false);
      setGameState('PLAYING');
    }
  };

  const handleRestart = () => {
    if (worldRef.current) {
      worldRef.current.playerPos.set(0, 0, 5);
      worldRef.current.stats.health = 100;
      worldRef.current.stats.wantedLevel = 0;
      worldRef.current.stats.isDriving = false;
    }
    setIsGameOver(false);
    setGameState('PLAYING');
  };

  const handleBuyShopItem = (
    cost: number,
    healthRestore: number,
    clearsWanted: boolean,
    reply: string
  ) => {
    if (worldRef.current) {
      worldRef.current.stats.money -= cost;
      if (healthRestore > 0) {
        worldRef.current.stats.health = Math.min(
          worldRef.current.stats.maxHealth,
          worldRef.current.stats.health + healthRestore
        );
      }
      if (clearsWanted) {
        worldRef.current.stats.wantedLevel = Math.max(0, worldRef.current.stats.wantedLevel - 2);
      }
    }
    soundEngine.speakBengali(reply, 1.15, 1.1);
    setShowShopModal(false);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-['Hind_Siliguri',sans-serif]">
      {/* Isolated Three.js WebGL Mount Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Title Screen Overlay */}
      {gameState === 'TITLE' && (
        <div className="absolute inset-0 z-20">
          <TitleScreen
            onStartGame={handleStartGame}
            onOpenMissions={() => setShowMissionsModal(true)}
            onOpenCharacter={() => setShowCharacterModal(true)}
            onOpenSettings={() => setShowSettingsModal(true)}
            onOpenUnityExport={() => setShowUnityModal(true)}
            onOpenAbout={() => setShowAboutModal(true)}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />
        </div>
      )}

      {/* In-Game HUD Overlay (Only when PLAYING or PAUSED) */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <div className="absolute inset-0 z-10">
          <HUD
            stats={stats}
            activeMission={activeMission}
            nearShopPrompt={nearShopPrompt}
            onPause={handlePause}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onJump={() => {
              if (worldRef.current) worldRef.current.inputJump = true;
            }}
            onSprintToggle={(sprinting) => {
              if (worldRef.current) worldRef.current.inputSprint = sprinting;
            }}
            onPunch={() => {
              if (worldRef.current) worldRef.current.performPunch();
            }}
            onInteract={() => {
              if (nearShopPrompt) setShowShopModal(true);
            }}
            onToggleVehicle={() => {
              if (worldRef.current) worldRef.current.toggleVehicle();
            }}
            onHonkHorn={() => {
              if (worldRef.current) worldRef.current.honkVehicleHorn();
            }}
            onJoystickMove={handleJoystickMove}
            drawMiniMapCallback={handleMiniMapDraw}
            showTouchControls={settings.showTouchControls}
          />
        </div>
      )}

      {/* Paused Modal */}
      {gameState === 'PAUSED' && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-40 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 text-center flex flex-col gap-3 shadow-2xl">
            <h2 className="text-3xl font-black text-amber-400">খেলা সাময়িক স্থগিত</h2>
            <div className="text-xs text-slate-300">GAME PAUSED</div>

            <button
              onClick={() => setGameState('PLAYING')}
              className="mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition cursor-pointer"
            >
              খেলা চালিয়ে যান (RESUME)
            </button>
            <button
              onClick={() => setShowMissionsModal(true)}
              className="py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl transition cursor-pointer text-sm"
            >
              মিশন তালিকা
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition cursor-pointer text-sm"
            >
              সেটিংস
            </button>
            <button
              onClick={() => setGameState('TITLE')}
              className="py-2.5 bg-red-950 hover:bg-red-900 text-red-200 font-bold rounded-xl transition cursor-pointer text-sm"
            >
              মূল মেনুতে যান (MAIN MENU)
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showShopModal && (
        <ShopDialogModal
          shopName={currentShopName}
          money={stats.money}
          onBuyItem={handleBuyShopItem}
          onClose={() => setShowShopModal(false)}
        />
      )}

      {showMissionsModal && (
        <MissionsModal
          missions={missions}
          activeMissionId={activeMission?.id ?? null}
          onSelectMission={handleSelectMission}
          onClose={() => setShowMissionsModal(false)}
        />
      )}

      {completedMission && gameState === 'MISSION_COMPLETE' && (
        <MissionCompleteModal
          mission={completedMission}
          onContinue={handleContinueAfterMission}
        />
      )}

      {isGameOver && gameState === 'GAME_OVER' && (
        <GameOverModal
          money={stats.money}
          onBribeRelease={handleBribeRelease}
          onRestart={handleRestart}
        />
      )}

      {showUnityModal && (
        <UnityExportModal onClose={() => setShowUnityModal(false)} />
      )}

      {showCharacterModal && (
        <CharacterModal onClose={() => setShowCharacterModal(false)} />
      )}

      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(updated) => setSettings((prev) => ({ ...prev, ...updated }))}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {showAboutModal && (
        <AboutModal onClose={() => setShowAboutModal(false)} />
      )}
    </div>
  );
}
