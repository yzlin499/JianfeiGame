export interface Character {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  buffs: Buff[];
  isCasting: boolean;
  castSkill: Skill | null;
  castProgress: number; // 0-100
  castDirection: 'forward' | 'reverse';
  globalCooldownEndTime: number; // Timestamp when GCD ends
  silenceEndTime: number; // Timestamp when silence ends
  skillCooldowns: Record<string, number>; // Map of skill ID to timestamp when CD ends
  aiFakeCastStopAt?: number; // Progress to stop at (0-100) for fake casting
}

export interface Buff {
  id: string;
  name: string;
  type: 'immune_interrupt' | 'immune_silence' | 'damage_reduction';
  duration: number; // milliseconds
  endTime: number; // timestamp
  icon: string;
  value?: number; // e.g. damage reduction amount (0-1)
}

export interface Skill {
  id: string;
  name: string;
  type: 'normal' | 'charge' | 'interrupt' | 'defensive';
  damage: number;
  castTime: number; // milliseconds, 0 means instant
  cooldown: number; // milliseconds
  lastUsedTime: number; // timestamp
  canInterrupt: boolean; // can this skill interrupt others?
  isGcdTrigger: boolean; // does this skill trigger GCD?
  gcd: number; // GCD duration (usually 1500ms)
  damageReduction?: number; // reduction ratio (0-1)
  color?: 'yellow' | 'red'; // cast bar color
  icon?: string;
}

export interface PlayerSkill extends Skill {
  isAvailable: boolean;
  cooldownRemaining: number;
}

export interface CombatEvent {
  timestamp: number;
  type: 'skill_cast' | 'interrupt_success' | 'damage_dealt' | 'buff_applied' | 'damage_taken' | 'healed' | 'fake_cast_cancel';
  source: 'player' | 'ai';
  target: 'player' | 'ai';
  skillName: string;
  value?: number;
  isCritical?: boolean;
}

export interface FloatingText {
  id: string;
  text: string;
  type: 'damage' | 'heal' | 'critical' | 'immune' | 'interrupt';
  x: number; // Percentage 0-100 relative to container or specific logic
  y: number;
  targetId: 'player' | 'ai';
  timestamp: number;
}

export interface GameState {
  status: 'idle' | 'playing' | 'paused' | 'ended';
  startTime: number;
  duration: number; // total game duration in ms
  winner: 'player' | 'ai' | 'tie' | null;
  player: Character;
  ai: Character;
  combatLog: CombatEvent[];
  floatingTexts: FloatingText[];
}
