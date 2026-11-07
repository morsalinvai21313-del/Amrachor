export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'MISSION_COMPLETE' | 'GAME_OVER';

export type TimeOfDay = 'DAWN' | 'DAY' | 'SUNSET' | 'NIGHT';
export type WeatherType = 'CLEAR' | 'RAIN' | 'OVERCAST';

export interface Mission {
  id: number;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  objectiveBn: string;
  targetType: 'STEAL_SWEET' | 'STEAL_TEA' | 'STEAL_FISH' | 'DRIVE_CNG' | 'ESCAPE_POLICE';
  targetPos: { x: number; y: number; z: number };
  rewardMoney: number;
  unlocked: boolean;
  completed: boolean;
  dialogueIntro: string;
  dialogueSuccess: string;
}

export interface PlayerStats {
  money: number;
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  wantedLevel: number; // 0 to 5
  isDriving: boolean;
  drivingVehicleType: 'CNG' | 'RICKSHAW' | null;
  speedKmh: number;
}

export interface DialogOption {
  textBn: string;
  action: () => void;
  cost?: number;
}

export interface ActiveDialog {
  speakerBn: string;
  roleBn: string;
  textBn: string;
  options: DialogOption[];
}

export interface GameSettings {
  graphicsQuality: 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA';
  soundVolume: number; // 0 to 1
  voiceVolume: number; // 0 to 1
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  showTouchControls: boolean;
}
