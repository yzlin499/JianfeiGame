import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

export const useGameLoop = () => {
  const tick = useGameStore(state => state.tick);
  const status = useGameStore(state => state.status);
  const lastTimeRef = useRef<number>(Date.now());
  const rafRef = useRef<number>();

  useEffect(() => {
    if (status !== 'playing') {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        return;
    }
    
    lastTimeRef.current = Date.now();

    const loop = () => {
      const now = Date.now();
      const dt = now - lastTimeRef.current;
      // Cap dt to prevent huge jumps if tab inactive
      const cappedDt = Math.min(dt, 100); 
      
      lastTimeRef.current = now;
      
      tick(cappedDt);
      
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [status, tick]);
};
