import { Skill } from '../types/game';

export const GAME_CONFIG = {
  PLAYER_MAX_HP: 10000,
  AI_MAX_HP: 15000,
  GAME_DURATION: 120000, // 2 minutes
  GCD_DURATION: 1500, // 1.5 seconds
  ENABLE_DEBUG_LOGS: false, // Toggle for debug logs
};

export const PLAYER_SKILLS: Skill[] = [
  {
    id: 'p_attack',
    name: '两仪', // 普通攻击
    type: 'normal',
    damage: 300,
    castTime: 0,
    cooldown: 0,
    lastUsedTime: 0,
    canInterrupt: false,
    isGcdTrigger: true,
    gcd: GAME_CONFIG.GCD_DURATION,
    icon: 'Sword', // Lucide icon name
  },
  {
    id: 'p_cast',
    name: '四象合一', // 读条攻击
    type: 'charge',
    damage: 800,
    castTime: 2000,
    cooldown: 7000,
    lastUsedTime: 0,
    canInterrupt: false,
    isGcdTrigger: true,
    gcd: GAME_CONFIG.GCD_DURATION,
    icon: 'Wand',
  },
  {
    id: 'p_interrupt',
    name: '剑飞惊天',
    type: 'interrupt',
    damage: 100,
    castTime: 0,
    cooldown: 7000, // 20s
    lastUsedTime: 0,
    canInterrupt: true,
    isGcdTrigger: false, // No GCD
    gcd: 0,
    icon: 'Zap',
  },
  {
    id: 'p_defensive',
    name: '坐忘无我',
    type: 'defensive',
    damage: 0,
    castTime: 0,
    cooldown: 10000, // 10s
    lastUsedTime: 0,
    canInterrupt: false,
    isGcdTrigger: true,
    gcd: GAME_CONFIG.GCD_DURATION,
    damageReduction: 1.0, // 100% reduction for 2s (or as per requirement "抵挡2秒伤害")
    icon: 'Shield',
  },
];

export const AI_SKILLS: Skill[] = [
  {
    id: 'ai_normal',
    name: '普通攻击',
    type: 'normal',
    damage: 200,
    castTime: 0,
    cooldown: 3000,
    lastUsedTime: 0,
    canInterrupt: false,
    isGcdTrigger: true,
    gcd: GAME_CONFIG.GCD_DURATION,
  },
  {
    id: 'ai_yellow_1',
    name: '七星拱瑞',
    type: 'charge',
    damage: 1500,
    castTime: 1500,
    cooldown: 8000,
    lastUsedTime: 0,
    canInterrupt: false, // The skill itself doesn't interrupt, but it IS interruptible (logic handled in code)
    isGcdTrigger: true,
    gcd: GAME_CONFIG.GCD_DURATION,
    color: 'yellow',
  },
  {
    id: 'ai_red_1',
    name: '吞日月',
    type: 'charge',
    damage: 3000, // High damage
    castTime: 1500,
    cooldown: 15000,
    lastUsedTime: 0,
    canInterrupt: false,
    isGcdTrigger: true,
    gcd: GAME_CONFIG.GCD_DURATION,
    color: 'red', // Uninterruptible
  },
  {
    id: 'ai_yellow_fast',
    name: '三环套月',
    type: 'charge',
    damage: 800,
    castTime: 560, // Fast cast
    cooldown: 6000,
    lastUsedTime: 0,
    canInterrupt: false,
    isGcdTrigger: true,
    gcd: GAME_CONFIG.GCD_DURATION,
    color: 'yellow',
  },
];
