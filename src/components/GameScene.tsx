import React from 'react';
import { Character } from '../types/game';
import { StatusPanel } from './StatusPanel';
import { CastBar } from './CastBar';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

interface GameSceneProps {
  player: Character;
  ai: Character;
}

export const GameScene: React.FC<GameSceneProps> = ({ player, ai }) => {
  const floatingTexts = useGameStore(state => state.floatingTexts);

  return (
    <div className="relative w-full flex-1 bg-gradient-to-b from-slate-800 to-slate-900 overflow-hidden flex flex-col justify-between p-4 pb-24">
       {/* Background Elements (Decorative) */}
       <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-green-900 rounded-full blur-3xl" />
       </div>

       {/* AI Section (Top) */}
       <div className="flex flex-col items-center w-full z-10 mt-8">
          <StatusPanel character={ai} isPlayer={false} />
          
          {/* AI Model (Placeholder) */}
          <div className="relative mt-8 mb-4">
             <motion.div 
               animate={ai.isCasting ? { scale: [1, 1.05, 1] } : {}}
               transition={{ repeat: Infinity, duration: 1 }}
               className="w-32 h-32 bg-red-900/50 rounded-lg border-2 border-red-700 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.3)]"
             >
                <span className="text-4xl">🤖</span>
             </motion.div>
             
             {/* Hit Effect / Floating Text */}
             <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex justify-center items-center">
                 <AnimatePresence>
                    {floatingTexts.filter(t => t.targetId === 'ai').map(text => (
                        <motion.div
                            key={text.id}
                            initial={{ opacity: 0, y: 0, scale: 0.5 }}
                            animate={{ opacity: 1, y: -60, scale: 1.2 }}
                            exit={{ opacity: 0, y: -80, scale: 0.8 }}
                            transition={{ duration: 0.8 }}
                            className={`absolute font-bold text-2xl whitespace-nowrap z-50 ${
                                text.type === 'damage' ? 'text-red-500 text-shadow-red' :
                                text.type === 'heal' ? 'text-green-500' :
                                text.type === 'critical' ? 'text-yellow-400 text-3xl' :
                                text.type === 'immune' ? 'text-gray-400' :
                                text.type === 'interrupt' ? 'text-blue-400 text-3xl' : 'text-white'
                            }`}
                            style={{ 
                                left: `${text.x}%`, 
                                transform: 'translateX(-50%)',
                                textShadow: '2px 2px 0 #000'
                            }}
                        >
                            {text.text}
                        </motion.div>
                    ))}
                 </AnimatePresence>
             </div>
          </div>

          {/* AI Cast Bar */}
          <div className="h-8 w-full flex justify-center">
            <CastBar 
              isCasting={ai.isCasting}
              progress={ai.castProgress}
              skillName={ai.castSkill?.name || ''}
              color={ai.castSkill?.color}
              direction={ai.castDirection}
            />
          </div>
       </div>

       {/* Player Section (Bottom) */}
       <div className="flex flex-col items-center w-full z-10 mb-8">
          {/* Player Cast Bar */}
          <div className="h-8 w-full flex justify-center mb-4">
            <CastBar 
              isCasting={player.isCasting}
              progress={player.castProgress}
              skillName={player.castSkill?.name || ''}
              color="yellow" // Player cast usually yellow/green
              direction={player.castDirection}
            />
          </div>

          {/* Player Model (Placeholder) */}
          <div className="relative mb-8">
             <div className="w-24 h-24 bg-green-900/50 rounded-full border-2 border-green-700 flex items-center justify-center shadow-[0_0_20px_rgba(22,163,74,0.3)]">
                <span className="text-4xl">🥷</span>
             </div>

             {/* Floating Text for Player */}
             <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex justify-center items-center">
                 <AnimatePresence>
                    {floatingTexts.filter(t => t.targetId === 'player').map(text => (
                        <motion.div
                            key={text.id}
                            initial={{ opacity: 0, y: 0, scale: 0.5, x: 0 }}
                            animate={{ 
                                opacity: [0, 1, 1, 0],
                                y: -50, 
                                scale: [0.5, 1.5, 1],
                                x: Math.random() * 40 - 20 
                            }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            // onAnimationComplete logic handled by store cleaning up old texts based on timestamp
                            className={`absolute font-black text-3xl whitespace-nowrap z-50 ${
                                text.type === 'damage' ? 'text-red-600 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]' :
                                text.type === 'heal' ? 'text-green-500' :
                                text.type === 'critical' ? 'text-yellow-400 text-4xl' :
                                text.type === 'immune' ? 'text-gray-400 text-2xl' :
                                text.type === 'interrupt' ? 'text-blue-400 text-3xl' : 'text-white'
                            }`}
                            style={{ 
                                left: '120%', // Move to the right of the player
                                top: '50%',
                                transform: 'translate(0, -50%)',
                                textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
                            }}
                        >
                            {text.text}
                        </motion.div>
                    ))}
                 </AnimatePresence>
             </div>
          </div>

          <StatusPanel character={player} isPlayer={true} />
       </div>
    </div>
  );
};
