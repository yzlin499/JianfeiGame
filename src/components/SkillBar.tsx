import React from 'react';
import { Skill } from '../types/game';
import { Sword, Wand, Zap, Shield, HelpCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface SkillBarProps {
  skills: Skill[];
  cooldowns: Record<string, number>;
  gcdEndTime: number;
  onUseSkill: (skillId: string) => void;
  className?: string;
  isSilenced?: boolean;
}

const IconMap: Record<string, React.FC<any>> = {
  'Sword': Sword,
  'Wand': Wand,
  'Zap': Zap,
  'Shield': Shield,
};

export const SkillBar: React.FC<SkillBarProps> = ({
  skills,
  cooldowns,
  gcdEndTime,
  onUseSkill,
  className,
  isSilenced = false,
}) => {
  const now = Date.now();

  return (
    <div className={clsx("flex gap-4 p-4 bg-gray-900/80 rounded-xl backdrop-blur-sm border border-gray-700", className)}>
      {skills.map((skill) => {
        const Icon = IconMap[skill.icon || ''] || HelpCircle;
        const cdEndTime = (cooldowns && cooldowns[skill.id]) || 0;
        const isOnCd = cdEndTime > now;
        const isOnGcd = skill.isGcdTrigger && gcdEndTime > now;
        
        // Calculate remaining CD for overlay
        let remaining = 0;
        let total = 0;
        
        // Priority: Skill CD > GCD
        if (isOnCd) {
           remaining = cdEndTime - now;
           total = skill.cooldown;
        } else if (isOnGcd) {
           remaining = gcdEndTime - now;
           total = skill.gcd; // approx 1500
        }
        
        const isDisabled = isOnCd || isOnGcd || isSilenced;

        return (
          <button
            key={skill.id}
            onClick={() => onUseSkill(skill.id)}
            disabled={isDisabled}
            className={clsx(
              "relative w-16 h-16 rounded-lg flex items-center justify-center transition-all",
              "border-2",
              isDisabled ? "border-gray-600 bg-gray-800 cursor-not-allowed opacity-80" : "border-amber-500 bg-gray-700 hover:bg-gray-600 hover:scale-105 active:scale-95 cursor-pointer shadow-amber-500/20 shadow-lg"
            )}
          >
            <Icon className={clsx("w-8 h-8", isDisabled ? "text-gray-400" : "text-amber-100")} />
            
            {/* CD Overlay */}
            {remaining > 0 && (
              <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {(remaining / 1000).toFixed(1)}
                </span>
              </div>
            )}
            
            {/* Keybind hint (Optional) */}
            <div className="absolute -top-2 -right-2 bg-gray-900 text-xs text-gray-400 px-1 rounded border border-gray-700">
               {/* Could map 1, 2, 3, 4 */}
            </div>
            
            <div className="absolute -bottom-6 text-[10px] text-gray-300 w-full text-center truncate">
                {skill.name}
            </div>
          </button>
        );
      })}
    </div>
  );
};
