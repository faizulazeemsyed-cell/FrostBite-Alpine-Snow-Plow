export type GameMode = 'TITLE' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAMEOVER';

export interface VehicleUpgrades {
  bladeLevel: number; // 1 to 4: Standard -> Wide Angle -> V-Plow -> Rotary Blower
  engineLevel: number; // 1 to 4: Utility -> Turbo -> Blizzard V8 -> Apex
  treadsLevel: number; // 1 to 3: Radials -> Chains -> Studded Tracks
  spreaderLevel: number; // 0 to 3: None -> Rock Salt -> Heated Radiant
  boostLevel: number; // 1 to 3: Base Nitro -> Fast Cooldown -> Alpine Jet
  magnetLevel: number; // 0 to 2: None -> Mitten & Coin -> Golden Magnet
}

export interface UpgradeConfig {
  id: keyof VehicleUpgrades;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  costs: number[]; // cost to reach level 2, 3, 4 etc.
  levels: {
    level: number;
    title: string;
    statDescription: string;
  }[];
}

export interface TownSector {
  id: string;
  name: string;
  description: string;
  targetPercent: number; // e.g. 90%
  clearedPercent: number;
  totalSnowCells: number;
  clearedSnowCells: number;
  isComplete: boolean;
  rewardCoins: number;
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
}

export interface CollectibleItem {
  id: string;
  type: 'coin' | 'cocoa' | 'mitten' | 'snowflake';
  position: [number, number, number];
  collected: boolean;
  value: number;
  name: string;
}

export interface ComboState {
  count: number;
  multiplier: number;
  timer: number; // seconds left before combo starts decaying
  maxTimer: number;
  tierName: string;
}

export interface GameStats {
  snowPlowedMeters: number;
  totalCoinsEarned: number;
  maxCombo: number;
  sectorsCompleted: number;
  timePlayedSeconds: number;
  itemsFound: number;
}
