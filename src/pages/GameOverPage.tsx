import React from 'react';
import { useGameStore } from '../store/gameStore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const GameOverPage: React.FC = () => {
  const { winner, combatLog, restartGame, player, ai } = useGameStore();
  const navigate = useNavigate();

  const handleRestart = () => {
    restartGame();
    navigate('/');
  };

  // Statistics
  const totalDamageDealt = combatLog
    .filter(e => e.type === 'damage_dealt' && e.source === 'player')
    .reduce((acc, curr) => acc + (curr.value || 0), 0);

  const totalDamageTaken = combatLog
    .filter(e => e.type === 'damage_dealt' && e.source === 'ai') // Should be damage_taken by player or dealt by ai
    .reduce((acc, curr) => acc + (curr.value || 0), 0);
    
  const interrupts = combatLog.filter(e => e.type === 'interrupt_success').length;

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-900 text-white p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-gray-800 border-2 border-amber-600 rounded-xl p-8 shadow-2xl flex flex-col items-center"
      >
        <h1 className="text-4xl font-bold mb-4 text-amber-500 font-serif">
          {winner === 'player' ? '大侠获胜' : '胜败乃兵家常事'}
        </h1>
        
        <div className="w-full bg-gray-900/50 rounded-lg p-4 mb-6 space-y-2">
           <div className="flex justify-between">
              <span className="text-gray-400">造成伤害</span>
              <span className="text-amber-400 font-mono">{totalDamageDealt}</span>
           </div>
           <div className="flex justify-between">
              <span className="text-gray-400">受到伤害</span>
              <span className="text-red-400 font-mono">{totalDamageTaken}</span>
           </div>
           <div className="flex justify-between">
              <span className="text-gray-400">成功打断</span>
              <span className="text-blue-400 font-mono">{interrupts} 次</span>
           </div>
           <div className="flex justify-between pt-2 border-t border-gray-700">
              <span className="text-gray-400">剩余血量</span>
              <span className="text-green-400 font-mono">{player.hp}</span>
           </div>
        </div>

        <button 
          onClick={handleRestart}
          className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow-lg transition-colors"
        >
          再战一局
        </button>
      </motion.div>
    </div>
  );
};
