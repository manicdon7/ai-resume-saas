'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';

const CURSOR_VARIANTS = {
  default: {
    size: 20,
    scale: 1,
    opacity: 0.8,
    mixBlendMode: 'difference',
    backgroundColor: 'rgba(168, 85, 247, 0.6)',
    border: '2px solid rgba(168, 85, 247, 0.8)',
    borderRadius: '50%',
  },
  pointer: {
    size: 32,
    scale: 1.2,
    opacity: 1,
    mixBlendMode: 'normal',
    backgroundColor: 'rgba(168, 85, 247, 0.8)',
    border: '2px solid rgba(168, 85, 247, 1)',
    borderRadius: '50%',
  },
  text: {
    size: 2,
    scale: 1,
    opacity: 1,
    mixBlendMode: 'difference',
    backgroundColor: 'rgba(255, 255, 255, 1)',
    border: 'none',
    borderRadius: '1px',
  },
  loading: {
    size: 24,
    scale: 1,
    opacity: 0.9,
    mixBlendMode: 'normal',
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    border: '2px solid rgba(59, 130, 246, 1)',
    borderRadius: '50%',
  },
  disabled: {
    size: 20,
    scale: 0.8,
    opacity: 0.4,
    mixBlendMode: 'normal',
    backgroundColor: 'rgba(156, 163, 175, 0.6)',
    border: '1px solid rgba(156, 163, 175, 0.8)',
    borderRadius: '50%',
  },
  drag: {
    size: 28,
    scale: 1.1,
    opacity: 0.9,
    mixBlendMode: 'normal',
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
    border: '2px solid rgba(34, 197, 94, 1)',
    borderRadius: '50%',
  },
};

const EnhancedCustomCursor = ({
  variant = 'default',
  isVisible = true,
  position = { x: 0, y: 0 },
  effects = {
    glow: true,
    trail: false,
    ripple: true,
    scale: true,
  },
  theme = 'dark'
}) => {
  const [mounted, setMounted] = useState(false);
  const [trailPoints, setTrailPoints] = useState([]);
  const [ripples, setRipples] = useState([]);
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });

  const cursorRef = useRef(null);
  const trailRef = useRef([]);

  // Motion values for smooth cursor movement
  const cursorX = useMotionValue(position.x);
  const cursorY = useMotionValue(position.y);

  // Spring configuration for smooth movement
  const springConfig = { damping: 25, stiffness: 700, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  // Update cursor position
  useEffect(() => {
    if (position.x !== 0 || position.y !== 0) {
      cursorX.set(position.x);
      cursorY.set(position.y);
      setCurrentPosition(position);
    }
  }, [position.x, position.y, cursorX, cursorY]);

  // Initialize cursor position on mount
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      const handleMouseMove = (e) => {
        cursorX.set(e.clientX);
        cursorY.set(e.clientY);
        setCurrentPosition({ x: e.clientX, y: e.clientY });
      };

      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
    }
  }, [mounted, cursorX, cursorY]);

  // Trail effect
  useEffect(() => {
    if (!effects.trail || !mounted) return;

    const updateTrail = () => {
      const newPoint = { x: currentPosition.x, y: currentPosition.y, id: Date.now() };

      setTrailPoints(prev => {
        const updated = [newPoint, ...prev.slice(0, 8)];
        return updated;
      });
    };

    const interval = setInterval(updateTrail, 16); // ~60fps
    return () => clearInterval(interval);
  }, [currentPosition.x, currentPosition.y, effects.trail, mounted]);

  // Ripple effect on click
  useEffect(() => {
    if (!effects.ripple || !mounted) return;

    const handleClick = (e) => {
      const newRipple = {
        x: e.clientX,
        y: e.clientY,
        id: Date.now(),
      };

      setRipples(prev => [...prev, newRipple]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [effects.ripple, mounted]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render on server
  if (!mounted) {
    return null;
  }

  // Always render but control visibility with opacity
  if (!isVisible) {
    return (
      <motion.div
        className="enhanced-custom-cursor fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{
          width: 20,
          height: 20,
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
          opacity: 0,
        }}
      />
    );
  }

  const variantConfig = CURSOR_VARIANTS[variant] || CURSOR_VARIANTS.default;

  return (
    <>
      {/* Trail Effect */}
      {effects.trail && (
        <div className="fixed top-0 left-0 pointer-events-none z-[9998]">
          <AnimatePresence>
            {trailPoints.map((point, index) => (
              <motion.div
                key={point.id}
                className="absolute"
                style={{
                  left: point.x,
                  top: point.y,
                  width: Math.max(4, variantConfig.size * 0.3),
                  height: Math.max(4, variantConfig.size * 0.3),
                  backgroundColor: variantConfig.backgroundColor,
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
                initial={{ opacity: 0.6, scale: 1 }}
                animate={{
                  opacity: 0.6 - (index * 0.08),
                  scale: 1 - (index * 0.1)
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Main Cursor */}
      <motion.div
        ref={cursorRef}
        className="enhanced-custom-cursor fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{
          width: variantConfig.size,
          height: variantConfig.size,
          backgroundColor: variantConfig.backgroundColor,
          border: variantConfig.border,
          borderRadius: variantConfig.borderRadius,
          mixBlendMode: variantConfig.mixBlendMode,
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: effects.scale ? variantConfig.scale : 1,
          opacity: variantConfig.opacity,
        }}
        transition={{
          type: 'spring',
          damping: 20,
          stiffness: 300,
          mass: 0.8,
        }}
      >
        {/* Glow Effect */}
        {effects.glow && variant === 'pointer' && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              backgroundColor: variantConfig.backgroundColor,
              filter: 'blur(8px)',
              transform: 'scale(1.5)',
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Loading Animation */}
        {variant === 'loading' && (
          <motion.div
            className="absolute inset-0 border-2 border-transparent border-t-current rounded-full"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}
      </motion.div>

      {/* Ripple Effects */}
      {effects.ripple && (
        <div className="fixed top-0 left-0 pointer-events-none z-[9997]">
          <AnimatePresence>
            {ripples.map((ripple) => (
              <motion.div
                key={ripple.id}
                className="absolute border-2 border-purple-400 rounded-full"
                style={{
                  left: ripple.x,
                  top: ripple.y,
                  transform: 'translate(-50%, -50%)',
                }}
                initial={{ width: 0, height: 0, opacity: 0.8 }}
                animate={{
                  width: 100,
                  height: 100,
                  opacity: 0
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  );
};

export default EnhancedCustomCursor;