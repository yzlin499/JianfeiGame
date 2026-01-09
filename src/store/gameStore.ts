import { create } from 'zustand';
import { Character, GameState, Skill, CombatEvent, Buff } from '../types/game';
import { GAME_CONFIG, PLAYER_SKILLS, AI_SKILLS } from '../config/skills';

const dispatchAiLog = (detail: string) => {
  if (GAME_CONFIG.ENABLE_DEBUG_LOGS) {
    window.dispatchEvent(new CustomEvent('ai-log', { detail }));
  }
};

interface GameActions {
  startGame: () => void;
  pauseGame: () => void;
  restartGame: () => void;
  tick: (deltaTime: number) => void;
  playerUseSkill: (skillId: string) => void;
}

// Initial State Helper
const createInitialCharacter = (id: string, name: string, maxHp: number, skills: Skill[]): Character => ({
  id,
  name,
  hp: maxHp,
  maxHp,
  buffs: [],
  isCasting: false,
  castSkill: null,
  castProgress: 0,
  castDirection: 'forward',
  globalCooldownEndTime: 0,
  silenceEndTime: 0,
  skillCooldowns: {},
});

const initialState: Omit<GameState, 'combatLog'> & { combatLog: CombatEvent[] } = {
  status: 'idle',
  startTime: 0,
  duration: 0,
  winner: null,
  player: createInitialCharacter('player', '侠士', GAME_CONFIG.PLAYER_MAX_HP, PLAYER_SKILLS),
  ai: createInitialCharacter('ai', '剑圣镜像', GAME_CONFIG.AI_MAX_HP, AI_SKILLS),
  combatLog: [],
  floatingTexts: [],
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  startGame: () => {
    set({
      ...initialState,
      status: 'playing',
      startTime: Date.now(),
      // Reset characters with fresh state but same config
      player: createInitialCharacter('player', '侠士', GAME_CONFIG.PLAYER_MAX_HP, PLAYER_SKILLS),
      ai: createInitialCharacter('ai', '剑圣镜像', GAME_CONFIG.AI_MAX_HP, AI_SKILLS),
    });
  },

  pauseGame: () => {
    set((state) => ({ status: state.status === 'playing' ? 'paused' : state.status }));
  },

  restartGame: () => {
    get().startGame();
  },

  tick: (deltaTime: number) => {
    const state = get();
    if (state.status !== 'playing') return;

    const now = Date.now();

    // 1. Check Game Over
    if (state.duration >= GAME_CONFIG.GAME_DURATION || state.player.hp <= 0 || state.ai.hp <= 0) {
      let winner: 'player' | 'ai' | 'tie' = 'tie';
      if (state.player.hp <= 0) winner = 'ai';
      else if (state.ai.hp <= 0) winner = 'player';
      else if (state.player.hp > state.ai.hp) winner = 'player';
      else if (state.ai.hp > state.player.hp) winner = 'ai';

      set({ status: 'ended', winner });
      return;
    }

    // 2. Update Duration
    const newDuration = state.duration + deltaTime;

    // 3. Update Characters (Buffs, Casting, Silence)
    const updateCharacter = (char: Character, opponent: Character, isAi: boolean): Partial<Character> => {
      let updates: Partial<Character> = {};

      // Buffs expiration
      const activeBuffs = char.buffs.filter(b => b.endTime > now);
      if (activeBuffs.length !== char.buffs.length) updates.buffs = activeBuffs;

      // Casting
      if (char.isCasting && char.castSkill) {
        const newProgress = char.castProgress + (deltaTime / char.castSkill.castTime) * 100;
        
        if (newProgress >= 100) {
          // Cast Complete
          updates.isCasting = false;
          updates.castSkill = null;
          updates.castProgress = 0;
          
          // Deal Damage / Effect
          // Check opponent mitigation
          let damage = char.castSkill.damage;
          const mitigationBuff = opponent.buffs.find(b => b.type === 'damage_reduction');
          if (mitigationBuff && mitigationBuff.value) {
            damage = Math.floor(damage * (1 - mitigationBuff.value));
          }

          if (damage > 0) {
            // Apply damage to opponent (Need to update opponent state outside this function map, 
            // but for simplicity we assume we can emit events or handle it in main tick)
            // We will handle damage application in the main set call by merging updates
          }
          
          // Log event
          // (Logging logic moved to main tick to avoid side effects in calculation)
        } else {
          updates.castProgress = newProgress;
        }
      }

      return updates;
    };

    // We need to handle damage application carefully.
    // Let's refactor tick to be more imperative for clarity.
    
    let player = { ...state.player };
    let ai = { ...state.ai };
    let logs = [...state.combatLog];
    // Shorten TTL to 500ms
    let floatingTexts = state.floatingTexts.filter(ft => now - ft.timestamp < 500);

    const addFloatingText = (text: string, type: 'damage' | 'heal' | 'critical' | 'immune' | 'interrupt', targetId: 'player' | 'ai') => {
        floatingTexts.push({
            id: `ft_${now}_${Math.random()}`,
            text,
            type,
            x: 50 + (Math.random() * 20 - 10), // Random jitter
            y: 0,
            targetId,
            timestamp: now,
        });
    };

    // Helper to apply damage
    const applyDamage = (source: Character, target: Character, skill: Skill) => {
      let damage = skill.damage;
      // Check mitigation
      const mitigationBuff = target.buffs.find(b => b.type === 'damage_reduction');
      if (mitigationBuff && mitigationBuff.value) {
        const originalDamage = damage;
        damage = Math.floor(damage * (1 - mitigationBuff.value));
        
        // Target ID determines where the text floats. 
        // If Player hits AI -> Text on AI
        // If AI hits Player -> Text on Player
        if (damage === 0 && originalDamage > 0) {
            addFloatingText('免疫', 'immune', target.id as 'player' | 'ai');
        } else if (damage < originalDamage) {
            addFloatingText(`-${damage} (减伤)`, 'damage', target.id as 'player' | 'ai');
        }

        logs.push({
          timestamp: now,
          type: 'damage_taken',
          source: source.id === 'player' ? 'player' : 'ai',
          target: target.id === 'player' ? 'player' : 'ai',
          skillName: skill.name,
          value: damage
        });
      } else {
         addFloatingText(`-${damage}`, 'damage', target.id as 'player' | 'ai');
         logs.push({
          timestamp: now,
          type: 'damage_dealt',
          source: source.id === 'player' ? 'player' : 'ai',
          target: target.id === 'player' ? 'player' : 'ai',
          skillName: skill.name,
          value: damage
        });
      }
      
      target.hp = Math.max(0, target.hp - damage);
    };

    // Update Player Casting
    if (player.isCasting && player.castSkill) {
      player.castProgress += (deltaTime / player.castSkill.castTime) * 100;
      if (player.castProgress >= 100) {
        applyDamage(player, ai, player.castSkill);
        player.isCasting = false;
        player.castSkill = null;
        player.castProgress = 0;
      }
    }

    // Update AI Casting
    if (ai.isCasting && ai.castSkill) {
      ai.castProgress += (deltaTime / ai.castSkill.castTime) * 100;
      
      // 检查假读条自动取消逻辑
      if (ai.aiFakeCastStopAt && now >= ai.aiFakeCastStopAt) {
        // AI自己打断读条来骗剑飞
        ai.isCasting = false;
        ai.castSkill = null;
        ai.castProgress = 0;
        ai.aiFakeCastStopAt = undefined;
        
        dispatchAiLog(`假读条成功！AI主动打断[${ai.castSkill?.name}]来骗玩家剑飞`);
        
        logs.push({
          timestamp: now,
          type: 'fake_cast_cancel',
          source: 'ai',
          target: 'ai',
          skillName: ai.castSkill?.name || 'unknown'
        });
      } else if (ai.castProgress >= 100) {
        applyDamage(ai, player, ai.castSkill);
        ai.isCasting = false;
        ai.castSkill = null;
        ai.castProgress = 0;
        ai.aiFakeCastStopAt = undefined;
      }
    }

    // Update Buffs
    player.buffs = player.buffs.filter(b => b.endTime > now);
    ai.buffs = ai.buffs.filter(b => b.endTime > now);

    // AI Logic (Simple Decision Engine)
    if (!ai.isCasting && ai.silenceEndTime < now && ai.globalCooldownEndTime < now) {
        let chosenSkill: Skill | null = null;
        let decisionReason = '';

        // 1. Smart Defense: If player is casting High Damage Red Skill
        if (player.isCasting && player.castSkill?.color === 'red' && player.castSkill.damage > 500) {
             const defensiveSkill = AI_SKILLS.find(s => s.type === 'defensive');
             // Note: AI_SKILLS config needs 'defensive' skill if we want AI to use it.
             // Currently AI_SKILLS in config doesn't have one.
             // But if we add it, this logic works.
             if (defensiveSkill) {
                 chosenSkill = defensiveSkill;
                 decisionReason = `检测到玩家高伤害红技能[${player.castSkill.name}]，准备防御`;
             }
        }

        // 2. Random Selection if no smart choice - 现在会检查技能CD！
        if (!chosenSkill) {
            // 获取所有可用的技能（不在CD中）
            const availableSkills = AI_SKILLS.filter(s => {
                const skillCooldownEnd = ai.skillCooldowns[s.id] || 0;
                const isOnCooldown = skillCooldownEnd > now;
                const isAvailable = !isOnCooldown && Math.random() < 0.3; // 30%基础概率，但只从可用技能中选择
                return isAvailable;
            });
            
            if (availableSkills.length > 0) {
                chosenSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
                decisionReason = `从${availableSkills.length}个可用技能中随机选择[${chosenSkill.name}]`;
            } else {
                // 所有技能都在CD中
                dispatchAiLog(`AI: 所有技能都在CD中，无法行动`);
            }
        }

        if (chosenSkill) {
            const skill = chosenSkill;
            
            // 添加详细的AI决策日志
            const logMessage = `AI决策: ${decisionReason} | 选择技能: ${skill.name} | 是否有读条: ${skill.castTime > 0 ? '是' : '否'} | 伤害: ${skill.damage}`;
            dispatchAiLog(logMessage);
            
            // Start Cast or Instant
            if (skill.castTime > 0) {
                ai.isCasting = true;
                ai.castSkill = skill;
                ai.castProgress = 0;
                
                // 如果是黄技能，可能触发假读条逻辑
                if (skill.color === 'yellow') {
                    const fakeCastChance = 0.3; // 30%概率假读条
                    if (Math.random() < fakeCastChance) {
                        const fakeStopTime = now + skill.castTime * 0.3; // 30%读条时间后自己打断
                        ai.aiFakeCastStopAt = fakeStopTime;
                        dispatchAiLog(`开始假读条[${skill.name}]，将在${(fakeStopTime - now) / 1000}秒后自己打断来骗剑飞`);
                    }
                }
            } else {
                applyDamage(ai, player, skill);
            }
            
            if (skill.isGcdTrigger) {
                ai.globalCooldownEndTime = now + skill.gcd;
            }
            
            // 设置技能CD - 关键修复！
            if (skill.cooldown > 0) {
                ai.skillCooldowns[skill.id] = now + skill.cooldown;
                dispatchAiLog(`技能[${skill.name}]进入CD，剩余${skill.cooldown/1000}秒`);
            }
            
            logs.push({
                timestamp: now,
                type: 'skill_cast',
                source: 'ai',
                target: 'player',
                skillName: skill.name
            });
        } else {
            dispatchAiLog('AI: 无可用技能，等待CD');
        }
    } else if (ai.isCasting) {
        dispatchAiLog(`AI读条中: [${ai.castSkill?.name}] 进度: ${ai.castProgress.toFixed(1)}%`);
    } else {
        let waitReason = '';
        if (ai.silenceEndTime >= now) {
            waitReason = `被沉默，剩余${((ai.silenceEndTime - now) / 1000).toFixed(1)}秒`;
        } else if (ai.globalCooldownEndTime >= now) {
            waitReason = `GCD中，剩余${((ai.globalCooldownEndTime - now) / 1000).toFixed(1)}秒`;
        }
        if (waitReason) {
            dispatchAiLog(`AI等待: ${waitReason}`);
        }
    }

    // Clean up floating texts every frame
    // We already filtered at the start (line 138) and potentially added new ones.
    // So just use the local 'floatingTexts' array.
    
    set({
      duration: newDuration,
      player,
      ai,
      combatLog: logs.slice(-50), // Keep last 50 logs
      floatingTexts: floatingTexts
    });
  },

  playerUseSkill: (skillId: string) => {
    const state = get();
    const now = Date.now();
    const player = { ...state.player };
    const ai = { ...state.ai };
    const logs = [...state.combatLog];
    const floatingTexts = [...state.floatingTexts];

    const addFloatingText = (text: string, type: 'damage' | 'heal' | 'critical' | 'immune' | 'interrupt', targetId: 'player' | 'ai') => {
        floatingTexts.push({
            id: `ft_${now}_${Math.random()}`,
            text,
            type,
            x: 50 + (Math.random() * 20 - 10), // Random jitter
            y: 0,
            targetId,
            timestamp: now,
        });
    };

    // Helper to apply damage
    const applyDamage = (source: Character, target: Character, skill: Skill) => {
      let damage = skill.damage;
      // Check mitigation
      const mitigationBuff = target.buffs.find(b => b.type === 'damage_reduction');
      if (mitigationBuff && mitigationBuff.value) {
        const originalDamage = damage;
        damage = Math.floor(damage * (1 - mitigationBuff.value));
        
        if (damage === 0 && originalDamage > 0) {
            addFloatingText('免疫', 'immune', target.id as 'player' | 'ai');
        } else if (damage < originalDamage) {
            addFloatingText(`-${damage} (减伤)`, 'damage', target.id as 'player' | 'ai');
        }

        logs.push({
          timestamp: now,
          type: 'damage_taken',
          source: source.id === 'player' ? 'player' : 'ai',
          target: target.id === 'player' ? 'player' : 'ai',
          skillName: skill.name,
          value: damage
        });
      } else {
         addFloatingText(`-${damage}`, 'damage', target.id as 'player' | 'ai');
         logs.push({
          timestamp: now,
          type: 'damage_dealt',
          source: source.id === 'player' ? 'player' : 'ai',
          target: target.id === 'player' ? 'player' : 'ai',
          skillName: skill.name,
          value: damage
        });
      }
      
      target.hp = Math.max(0, target.hp - damage);
    };

    // Find skill
    const skillConfig = PLAYER_SKILLS.find(s => s.id === skillId);
    if (!skillConfig) return;

    // Checks
    if (state.status !== 'playing') return;
    if (player.silenceEndTime > now) return; // Silenced
    
    // CD Check
    if (player.skillCooldowns[skillId] > now) return;

    // GCD Check
    if (skillConfig.isGcdTrigger && player.globalCooldownEndTime > now) return;
    
    // Casting Check (Can't cast while casting, unless it's off-GCD/interrupt? No, usually can't.)
    // Tech Doc says "Interrupt" has NO GCD.
    if (player.isCasting && skillConfig.isGcdTrigger) return; 

    // Set Cooldown
    if (skillConfig.cooldown > 0) {
        player.skillCooldowns[skillId] = now + skillConfig.cooldown;
    }

    // Execute Skill
    if (skillConfig.type === 'interrupt') {
        // Jianfei Logic
        dispatchAiLog(`玩家使用剑飞！AI状态: 读条中=${ai.isCasting} ${ai.isCasting ? `技能=[${ai.castSkill?.name}] 颜色=${ai.castSkill?.color}` : '无读条'}`);
        
        if (ai.isCasting && ai.castSkill) {
            // Check if AI is fake casting (if it is, interrupt should FAIL because it's a bait)
            // User requirement: "假读条是指他会自己打断自己读条。不是说这个读条是无效的。如果读条过程中吃到剑飞还是会被打断沉默。"
            // Wait, re-reading: "如果读条过程中吃到剑飞还是会被打断沉默。"
            // So if I interrupt a fake cast, it SHOULD succeed. 
            // The "bait" is just that if I interrupt it, I used my CD. But if I succeed, I succeed.
            // Wait, user said "来骗玩家使用剑飞，让剑飞落空".
            // If I interrupt a fake cast, does it count as "falling for it"?
            // Scenario A: AI starts fake cast -> Player Interrupts -> AI gets silenced. (Player wins exchange, but maybe used CD on low value skill?)
            // Scenario B: AI starts fake cast -> AI cancels -> Player Interrupts (Late) -> Interrupt hits nothing -> Player CD wasted.
            // The user said: "假读条是指他会自己打断自己读条... 如果读条过程中吃到剑飞还是会被打断沉默。"
            // This means the cast IS valid interruptible while it exists.
            // The "bait" works because AI cancels it EARLY. If player is slow, they hit nothing.
            
            if (ai.castSkill.color === 'yellow' || ai.castSkill.canInterrupt) {
                 // Success
                 dispatchAiLog(`剑飞成功！打断了AI的[${ai.castSkill.name}]`);
                 
                 ai.isCasting = false;
                 ai.castSkill = null;
                 ai.castProgress = 0;
                 ai.aiFakeCastStopAt = undefined; // Clear fake cast state
                 ai.silenceEndTime = now + 5000; // 5s Silence
                 
                 addFloatingText('打断!', 'interrupt', 'ai');

                 logs.push({
                     timestamp: now,
                     type: 'interrupt_success',
                     source: 'player',
                     target: 'ai',
                     skillName: skillConfig.name
                 });
            } else {
                 // Failed (Red skill or immune)
                 dispatchAiLog(`剑飞失败！AI的[${ai.castSkill.name}]是红技能，免疫打断`);
                 addFloatingText('免疫!', 'immune', 'ai');
            }
        } else {
            // Cast on nothing (missed the window)
            dispatchAiLog('剑飞落空！AI没有在读条，被骗成功！');
            addFloatingText('闪避!', 'immune', 'ai');
        }
    } else if (skillConfig.type === 'defensive') {
        // Add Buff
        player.buffs.push({
            id: `buff_${now}`,
            name: skillConfig.name,
            type: 'damage_reduction',
            duration: 2000,
            endTime: now + 2000,
            icon: skillConfig.icon || 'Shield',
            value: skillConfig.damageReduction
        });
        
        logs.push({
             timestamp: now,
             type: 'buff_applied',
             source: 'player',
             target: 'player',
             skillName: skillConfig.name
        });
    } else {
        // Normal/Charge
        if (skillConfig.castTime > 0) {
            player.isCasting = true;
            player.castSkill = skillConfig;
            player.castProgress = 0;
        } else {
            // Instant Damage
            // let damage = skillConfig.damage;
            // Apply damage to AI
            applyDamage(player, ai, skillConfig);
        }
    }

    // Trigger GCD
    if (skillConfig.isGcdTrigger) {
        player.globalCooldownEndTime = now + skillConfig.gcd;
    }

    set({ player, ai, combatLog: logs, floatingTexts });
  }
}));
