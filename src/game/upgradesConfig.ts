import { UpgradeConfig } from '../types/game';

export const UPGRADES_LIST: UpgradeConfig[] = [
  {
    id: 'bladeLevel',
    name: 'Plow Blade Width',
    description: 'Wider scoops clear more snow per pass with increased combo buildup.',
    icon: 'blade',
    maxLevel: 4,
    costs: [120, 280, 550], // To reach lv 2, 3, 4
    levels: [
      { level: 1, title: 'Standard Steel (2.4m)', statDescription: 'Baseline street clearance width' },
      { level: 2, title: 'Wide Wing Blade (3.1m)', statDescription: '+30% snow clearance width' },
      { level: 3, title: 'V-Plow Cleaver (3.8m)', statDescription: 'Slices through deep banks with ease' },
      { level: 4, title: 'Rotary Turbo Blower (4.5m)', statDescription: 'Huge clearance zone + high combo rate' },
    ],
  },
  {
    id: 'engineLevel',
    name: 'Engine & Torque',
    description: 'Increases top plowing speed and acceleration through heavy powder.',
    icon: 'engine',
    maxLevel: 4,
    costs: [100, 240, 500],
    levels: [
      { level: 1, title: 'Utility 4x4', statDescription: 'Max Speed: 26 km/h' },
      { level: 2, title: 'Turbo Intercooler', statDescription: 'Max Speed: 34 km/h' },
      { level: 3, title: 'Blizzard V8', statDescription: 'Max Speed: 42 km/h' },
      { level: 4, title: 'Alpine Apex Beast', statDescription: 'Max Speed: 50 km/h' },
    ],
  },
  {
    id: 'treadsLevel',
    name: 'Treads & Tire Grip',
    description: 'Better handling on black ice and sharper turning response.',
    icon: 'tires',
    maxLevel: 3,
    costs: [140, 320],
    levels: [
      { level: 1, title: 'Winter Radials', statDescription: 'Slight slip on icy corners' },
      { level: 2, title: 'Diamond Steel Chains', statDescription: 'High traction & fast steering response' },
      { level: 3, title: 'Studded Rubber Tracks', statDescription: 'Zero slip on ice, superior control' },
    ],
  },
  {
    id: 'spreaderLevel',
    name: 'Rear Salt Spreader',
    description: 'Automatically distributes de-icing grit behind you to clear missed snow.',
    icon: 'spreader',
    maxLevel: 3,
    costs: [150, 300, 600],
    levels: [
      { level: 0, title: 'None Installed', statDescription: 'No rear clearance' },
      { level: 1, title: 'Rock Salt Hopper', statDescription: 'Melts a 1.2m trail behind truck' },
      { level: 2, title: 'High-Velocity Spinner', statDescription: 'Melts a 2.0m wide trail' },
      { level: 3, title: 'Heated Radiant Undercarriage', statDescription: 'Wide 2.8m automated clean sweep' },
    ],
  },
  {
    id: 'boostLevel',
    name: 'Nitro Snow Jet',
    description: 'Press Spacebar for a burst of high speed and instant snow ejection.',
    icon: 'boost',
    maxLevel: 3,
    costs: [180, 380],
    levels: [
      { level: 1, title: 'Cozy Boost', statDescription: '2.0s duration · 6s cooldown' },
      { level: 2, title: 'Turbo Injector', statDescription: '2.6s duration · 4.5s cooldown' },
      { level: 3, title: 'Alpine Rocket Thrust', statDescription: '3.2s duration · 3s cooldown' },
    ],
  },
  {
    id: 'magnetLevel',
    name: 'Lost Item Magnet',
    description: 'Draws buried frozen coins, hot cocoa mugs, and lost mittens toward the truck.',
    icon: 'magnet',
    maxLevel: 2,
    costs: [120, 260],
    levels: [
      { level: 0, title: 'Manual Pickup', statDescription: 'Drive directly over items' },
      { level: 1, title: 'Magnetic Sweeper', statDescription: '4.5m collection radius' },
      { level: 2, title: 'Golden Snowflake Vacuum', statDescription: '8.0m collection radius' },
    ],
  },
];
