// levels.js — Level configurations
const LEVELS = [
  { level: 1,  enemyCount: 8,  types: ['grunt'],                        spawnInterval: 2500, enemySpeed: 90  },
  { level: 2,  enemyCount: 14, types: ['grunt'],                        spawnInterval: 2000, enemySpeed: 100 },
  { level: 3,  enemyCount: 16, types: ['grunt', 'charger'],             spawnInterval: 1800, enemySpeed: 105 },
  { level: 4,  enemyCount: 20, types: ['grunt', 'charger'],             spawnInterval: 1500, enemySpeed: 115 },
  { level: 5,  enemyCount: 24, types: ['grunt', 'charger', 'shooter'],  spawnInterval: 1300, enemySpeed: 120 },
  { level: 6,  enemyCount: 28, types: ['grunt', 'charger', 'shooter'],  spawnInterval: 1200, enemySpeed: 130 },
  { level: 7,  enemyCount: 32, types: ['grunt', 'charger', 'shooter'],  spawnInterval: 1100, enemySpeed: 140 },
  { level: 8,  enemyCount: 36, types: ['grunt', 'charger', 'shooter'],  spawnInterval: 1000, enemySpeed: 145 },
  { level: 9,  enemyCount: 40, types: ['grunt', 'charger', 'shooter'],  spawnInterval: 900,  enemySpeed: 150 },
  { level: 10, enemyCount: 1,  types: ['boss'],                         spawnInterval: 5000, enemySpeed: 65  },
];

function getLevelConfig(levelNum) {
  if (levelNum <= LEVELS.length) {
    return LEVELS[levelNum - 1];
  }
  // Scale beyond level 10
  const base = LEVELS[LEVELS.length - 1];
  const extra = levelNum - LEVELS.length;
  return {
    level: levelNum,
    enemyCount: base.enemyCount + extra * 5,
    types: ['grunt', 'charger', 'shooter'],
    spawnInterval: Math.max(600, 900 - extra * 40),
    enemySpeed: 150 + extra * 8
  };
}
