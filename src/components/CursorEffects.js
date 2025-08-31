'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Cursor Glow Effect Component
export const CursorGlow = ({ 
  isActive = false, 
  position = { x: 0, y: 0 }, 
  intensity = 0.8,
  color = 'rgba(59, 130, 246, 0.6)',
  size = 100 
}) => {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="cursor-glow"
          style={{
            position: 'fixed',
            top: position.y,
            left: position.x,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            backdropFilter: 'blur(10px)',
            pointerEvents: 'none',
            zIndex: 9998,
            transform: 'translate(-50%, -50%)',
            mixBlendMode: 'screen',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: intensity,
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            type: 'spring',
            damping: 20,
            stiffness: 300,
          }}
        />
      )}
    </AnimatePresence>
  );
};

// Cursor Trail Effect Component
export const CursorTrail = ({ 
  isActive = false, 
  trailLength = 8,
  fadeSpeed = 0.8,
  color = 'rgba(255, 255, 255, 0.6)',
  size = 4 
}) => {
  const [trail, setTrail] = useState([]);
  const trailRef = useRef([]);

  const addTrailPoint = useCallback((x, y) => {
    const newPoint = {
      x,
      y,
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
    };

    trailRef.current = [newPoint, ...trailRef.current.slice(0, trailLength - 1)];
    setTrail([...trailRef.current]);
  }, [trailLength]);

  useEffect(() => {
    if (!isActive) {
      setTrail([]);
      trailRef.current = [];
      return;
    }

    const handleMouseMove = (e) => {
      addTrailPoint(e.clientX, e.clientY);
    };

    document.addEventListener('mousemove', handleMouseMove);

    // Fade out trail points
    const fadeInterval = setInterval(() => {
      const now = Date.now();
      trailRef.current = trailRef.current.filter(
        point => now - point.timestamp < 1000
      );
      setTrail([...trailRef.current]);
    }, 50);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearInterval(fadeInterval);
    };
  }, [isActive, addTrailPoint]);

  return (
    <div className="cursor-trail">
      {trail.map((point, index) => {
        const age = (Date.now() - point.timestamp) / 1000;
        const opacity = Math.max(0, 1 - age * fadeSpeed);
        const scale = Math.max(0.1, 1 - age * 0.5);

        return (
          <motion.div
            key={point.id}
            className="trail-point"
            style={{
              position: 'fixed',
              top: point.y,
              left: point.x,
              width: size,
              height: size,
              borderRadius: '50%',
              backgroundColor: color,
              pointerEvents: 'none',
              zIndex: 9997 - index,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale,
              opacity,
            }}
            transition={{
              duration: 0.1,
            }}
          />
        );
      })}
    </div>
  );
};

// Cursor Scale Animation Component
export const CursorScaleEffect = ({ 
  children, 
  scaleAmount = 1.1, 
  duration = 0.2,
  className = '' 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`cursor-scale-effect ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{
        scale: isHovered ? scaleAmount : 1,
      }}
      transition={{
        duration,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.div>
  );
};

// Cursor Ripple Effect Component
export const CursorRipple = ({ 
  isActive = false, 
  position = { x: 0, y: 0 },
  color = 'rgba(59, 130, 246, 0.3)',
  maxSize = 200,
  duration = 0.6 
}) => {
  const [ripples, setRipples] = useState([]);

  const createRipple = useCallback((x, y) => {
    const newRipple = {
      id: Date.now() + Math.random(),
      x,
      y,
      timestamp: Date.now(),
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, duration * 1000);
  }, [duration]);

  useEffect(() => {
    if (!isActive) return;

    const handleClick = (e) => {
      createRipple(e.clientX, e.clientY);
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [isActive, createRipple]);

  return (
    <div className="cursor-ripple">
      {ripples.map((ripple) => (
        <motion.div
          key={ripple.id}
          className="ripple"
          style={{
            position: 'fixed',
            top: ripple.y,
            left: ripple.x,
            width: 0,
            height: 0,
            borderRadius: '50%',
            border: `2px solid ${color}`,
            pointerEvents: 'none',
            zIndex: 9996,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ 
            width: 0, 
            height: 0, 
            opacity: 1 
          }}
          animate={{ 
            width: maxSize, 
            height: maxSize, 
            opacity: 0 
          }}
          transition={{
            duration,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
};

// Cursor Blend Mode Component
export const CursorBlendMode = ({ 
  children, 
  blendMode = 'difference',
  className = '' 
}) => {
  return (
    <div 
      className={`cursor-blend-mode ${className}`}
      style={{ mixBlendMode: blendMode }}
    >
      {children}
    </div>
  );
};

// Enhanced Custom Cursor with all effects
export const EnhancedCustomCursor = ({ 
  variant = 'default',
  isVisible = true,
  position = { x: 0, y: 0 },
  effects = {
    glow: false,
    trail: false,
    ripple: false,
    scale: true,
  },
  theme = 'light'
}) => {
  const [isInteracting, setIsInteracting] = useState(false);
  const [currentBlendMode, setCurrentBlendMode] = useState('difference');

  // Determine blend mode based on background context
  useEffect(() => {
    const updateBlendMode = () => {
      const elementUnderCursor = document.elementFromPoint(position.x, position.y);
      if (elementUnderCursor) {
        const bgColor = window.getComputedStyle(elementUnderCursor).backgroundColor;
        const isDark = bgColor.includes('rgb(0, 0, 0)') || 
                      bgColor.includes('rgba(0, 0, 0') ||
                      elementUnderCursor.classList.contains('dark') ||
                      elementUnderCursor.closest('.dark');
        
        setCurrentBlendMode(isDark ? 'screen' : 'difference');
      }
    };

    updateBlendMode();
  }, [position]);

  // Listen for interaction events
  useEffect(() => {
    const handleInteraction = (e) => {
      if (e.type === 'cursorEnter') {
        setIsInteracting(true);
      } else if (e.type === 'cursorLeave') {
        setIsInteracting(false);
      }
    };

    document.addEventListener('cursorEnter', handleInteraction);
    document.addEventListener('cursorLeave', handleInteraction);

    return () => {
      document.removeEventListener('cursorEnter', handleInteraction);
      document.removeEventListener('cursorLeave', handleInteraction);
    };
  }, []);

  const cursorConfig = {
    default: {
      size: 20,
      color: theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
      border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}`,
    },
    pointer: {
      size: 32,
      color: 'rgba(59, 130, 246, 0.8)',
      border: '2px solid rgba(59, 130, 246, 1)',
    },
    text: {
      size: 2,
      color: theme === 'dark' ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)',
      border: 'none',
    },
    loading: {
      size: 24,
      color: 'rgba(168, 85, 247, 0.8)',
      border: '2px solid rgba(168, 85, 247, 1)',
    },
    disabled: {
      size: 20,
      color: 'rgba(156, 163, 175, 0.6)',
      border: '1px solid rgba(156, 163, 175, 0.8)',
    },
    drag: {
      size: 28,
      color: 'rgba(34, 197, 94, 0.8)',
      border: '2px solid rgba(34, 197, 94, 1)',
    },
  };

  const config = cursorConfig[variant] || cursorConfig.default;

  if (!isVisible) return null;

  return (
    <>
      {/* Main cursor */}
      <motion.div
        className="enhanced-custom-cursor"
        style={{
          position: 'fixed',
          top: position.y,
          left: position.x,
          width: config.size,
          height: config.size,
          borderRadius: '50%',
          backgroundColor: config.color,
          border: config.border,
          mixBlendMode: currentBlendMode,
          pointerEvents: 'none',
          zIndex: 9999,
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          scale: isInteracting ? 1.2 : 1,
        }}
        transition={{
          type: 'spring',
          damping: 20,
          stiffness: 300,
        }}
      />

      {/* Glow effect */}
      {effects.glow && (
        <CursorGlow
          isActive={isInteracting}
          position={position}
          color={config.color}
        />
      )}

      {/* Trail effect */}
      {effects.trail && (
        <CursorTrail
          isActive={true}
          color={config.color}
        />
      )}

      {/* Ripple effect */}
      {effects.ripple && (
        <CursorRipple
          isActive={true}
          color={config.color}
        />
      )}
    </>
  );
};

export default EnhancedCustomCursor;