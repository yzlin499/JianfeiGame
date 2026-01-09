import React from 'react';
import { Character } from '../types/game';
import { clsx } from 'clsx';
import { Shield, Zap, Skull } from 'lucide-react';
import { AI_SKILLS, GAME_CONFIG } from '../config/skills';

interface StatusPanelProps {
  character: Character;
  isPlayer: boolean;
  className?: string;
}

const BuffIconMap: Record<string, any> = {
  'damage_reduction': Shield,
  'immune_interrupt': Shield,
  'silence': Skull,
};

export const StatusPanel: React.FC<StatusPanelProps> = ({
  character,
  isPlayer,
  className,
}) => {
  const hpPercent = (character.hp / character.maxHp) * 100;
  
  // Calculate Silence
  const isSilenced = character.silenceEndTime > Date.now();

  // Show Skills/CDs for AI only
  const showSkills = !isPlayer;
  
  // AI决策日志（用于调试）
  const [aiLogs, setAiLogs] = React.useState<string[]>([]);
  
  React.useEffect(() => {
    if (!isPlayer && GAME_CONFIG.ENABLE_DEBUG_LOGS) {
      // 监听AI决策日志
      const handleAiLog = (event: CustomEvent) => {
        const newLog = event.detail as string;
        setAiLogs(prev => [...prev.slice(-4), newLog]); // 保持最近5条日志
      };
      
      window.addEventListener('ai-log', handleAiLog as EventListener);
      return () => window.removeEventListener('ai-log', handleAiLog as EventListener);
    }
  }, [isPlayer]);

  return (
    <div className={clsx("flex flex-col w-full max-w-md", isPlayer ? "items-start" : "items-end", className)}>
      {/* Name and Buffs */}
      <div className={clsx("flex items-center gap-2 mb-1", isPlayer ? "flex-row" : "flex-row-reverse")}>
        <span className="text-white font-bold text-lg drop-shadow-md">{character.name}</span>
        
        {/* Buff List */}
        <div className="flex gap-1">
          {isSilenced && (
            <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center animate-pulse" title="Silenced">
               <Skull className="w-4 h-4 text-white" />
            </div>
          )}
          {character.buffs.map(buff => {
             const Icon = BuffIconMap[buff.type] || Shield;
             return (
               <div key={buff.id} className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center" title={buff.name}>
                 <Icon className="w-4 h-4 text-white" />
               </div>
             );
          })}
        </div>
      </div>

      {/* HP Bar Container */}
      <div className="w-full h-4 bg-gray-800 rounded-full border border-gray-600 overflow-hidden relative mb-2">
         <div 
           className={clsx(
             "h-full transition-all duration-300 ease-out",
             isPlayer ? "bg-gradient-to-r from-green-600 to-green-400" : "bg-gradient-to-l from-red-600 to-red-400"
           )}
           style={{ width: `${hpPercent}%` }}
         />
         {/* Text Overlay */}
         <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] text-white font-mono drop-shadow-sm">
              {character.hp} / {character.maxHp}
            </span>
         </div>
      </div>
      
      {/* AI All Skills Status Monitor */}
      {showSkills && GAME_CONFIG.ENABLE_DEBUG_LOGS && (
        <div className="mt-2 p-2 bg-black/50 rounded border border-gray-600">
          <div className="text-white text-[10px] font-bold mb-1">AI技能状态:</div>
          <div className="grid grid-cols-2 gap-1 text-[9px]">
            {AI_SKILLS.map(skill => {
              const now = Date.now();
              const cooldownEnd = character.skillCooldowns[skill.id] || 0;
              const isOnCooldown = cooldownEnd > now;
              const remainingCD = isOnCooldown ? ((cooldownEnd - now) / 1000).toFixed(1) : '0.0';
              const isCurrentlyCasting = character.isCasting && character.castSkill?.id === skill.id;
              const isAvailable = !isOnCooldown && !isCurrentlyCasting && character.silenceEndTime < now && character.globalCooldownEndTime < now;
              
              let statusColor = '';
              let statusText = '';
              
              if (isCurrentlyCasting) {
                statusColor = 'bg-blue-600';
                statusText = `读条${character.castProgress.toFixed(0)}%`;
              } else if (isOnCooldown) {
                statusColor = 'bg-red-600';
                statusText = `CD:${remainingCD}s`;
              } else if (isAvailable) {
                statusColor = 'bg-green-600';
                statusText = '可用';
              } else {
                statusColor = 'bg-gray-600';
                if (character.silenceEndTime >= now) {
                  statusText = '沉默';
                } else if (character.globalCooldownEndTime >= now) {
                  statusText = 'GCD';
                } else {
                  statusText = '不可用';
                }
              }
              
              return (
                <div key={skill.id} className={`${statusColor} text-white px-1 py-0.5 rounded border border-gray-500`}>
                  <div className="font-bold truncate">{skill.name}</div>
                  <div className="text-[8px] opacity-90">
                    {statusText} | {skill.damage}伤
                    {skill.castTime > 0 && <span> | {skill.castTime/1000}s</span>}
                    {skill.color && <span className={`ml-0.5 px-0.5 rounded text-[7px] ${
                      skill.color === 'red' ? 'bg-red-800' : 
                      skill.color === 'yellow' ? 'bg-yellow-700' : 'bg-gray-700'
                    }`}>{skill.color}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* AI决策日志显示 */}
      {showSkills && aiLogs.length > 0 && (
        <div className="mt-2 p-2 bg-black/70 rounded border border-red-600 max-h-24 overflow-y-auto">
          <div className="text-red-400 text-[10px] font-bold mb-1">AI决策日志:</div>
          {aiLogs.map((log, index) => (
            <div key={index} className="text-yellow-300 text-[9px] font-mono leading-tight">
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
