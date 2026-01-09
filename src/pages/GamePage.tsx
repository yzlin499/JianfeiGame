import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useGameLoop } from '../hooks/useGameLoop';
import { GameScene } from '../components/GameScene';
import { SkillBar } from '../components/SkillBar';
import { PLAYER_SKILLS } from '../config/skills';
import { useNavigate } from 'react-router-dom';

export const GamePage: React.FC = () => {
  const { player, ai, startGame, status, playerUseSkill } = useGameStore();
  const navigate = useNavigate();

  // Initialize Game Loop
  useGameLoop();

  // Start game on mount if idle
  useEffect(() => {
    if (status === 'idle') {
        startGame();
    }
  }, [status, startGame]);

  // Navigate to Game Over
  useEffect(() => {
    if (status === 'ended') {
        navigate('/game-over');
    }
  }, [status, navigate]);

  return (
    <div className="h-screen w-full bg-black flex justify-center items-center">
      {/* Mobile Container */}
      <div className="h-full w-full max-w-md bg-gray-900 flex flex-col relative shadow-2xl border-x border-gray-800 overflow-hidden">
        
        {/* Top Bar: Timer / Title */}
        <div className="h-12 bg-gray-900 border-b border-gray-800 flex items-center justify-center relative z-20 shrink-0">
            <span className="font-bold text-amber-500 text-xl tracking-widest">剑网三·练剑飞</span>
        </div>

        {/* Main Scene */}
        <GameScene player={player} ai={ai} />

        {/* Controls Layer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 flex justify-center z-30 pointer-events-none">
            {/* Skill Bar (Enable pointer events) */}
            <div className="pointer-events-auto">
              <SkillBar 
                skills={PLAYER_SKILLS} 
                cooldowns={player.skillCooldowns}
                gcdEndTime={player.globalCooldownEndTime}
                onUseSkill={playerUseSkill}
                isSilenced={player.silenceEndTime > Date.now()}
              />
            </div>
        </div>
        
      </div>
    </div>
  );
};
