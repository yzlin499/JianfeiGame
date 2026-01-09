import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface CastBarProps {
  isCasting: boolean;
  progress: number; // 0-100
  skillName: string;
  color?: 'yellow' | 'red';
  direction?: 'forward' | 'reverse';
  className?: string;
}

export const CastBar: React.FC<CastBarProps> = ({
  isCasting,
  progress,
  skillName,
  color = 'yellow',
  direction = 'forward',
  className,
}) => {
  if (!isCasting) return null;

  // Visual width calculation
  // If direction is reverse, bar shrinks from 100 to 0? Or fills from right?
  // Usually in games:
  // Forward: 0 -> 100 (Left to Right)
  // Reverse: 100 -> 0 (Right to Left or simply shrinking)
  // Let's implement Forward as growing, Reverse as shrinking for variety, 
  // or simply keep it consistent 0->100 but maybe different visual cue.
  // The PRD says "正向/逆向", let's stick to standard Left-to-Right filling for simplicity unless Reverse implies "Channeled".
  // Let's make "Reverse" start full and shrink.
  
  const width = direction === 'forward' ? `${progress}%` : `${100 - progress}%`;

  return (
    <div className={clsx("w-64 h-6 bg-gray-800 rounded-full border-2 border-gray-600 overflow-hidden relative shadow-lg", className)}>
      {/* Background/Track */}
      
      {/* Bar */}
      <motion.div
        className={clsx(
          "h-full absolute top-0 left-0 transition-all duration-75 ease-linear",
          color === 'yellow' ? "bg-yellow-500" : "bg-red-600"
        )}
        style={{ width }}
      />

      {/* Text Overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <span className="text-xs font-bold text-white drop-shadow-md">
          {skillName}
        </span>
      </div>
      
      {/* Shine effect (optional) */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
    </div>
  );
};
