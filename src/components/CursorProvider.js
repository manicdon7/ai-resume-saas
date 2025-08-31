'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import EnhancedCustomCursor from './EnhancedCustomCursor';
import useCursor from '../hooks/useCursor';

const CursorContext = createContext();

export const useCursorContext = () => {
  const context = useContext(CursorContext);
  if (!context) {
    throw new Error('useCursorContext must be used within a CursorProvider');
  }
  return context;
};

export const CursorProvider = ({ 
  children, 
  enabled = true,
  effects = {
    glow: true,
    trail: false,
    ripple: true,
    scale: true,
  },
  theme = 'dark',
  performanceLevel = 'high' // 'high', 'medium', 'low'
}) => {
  const [mounted, setMounted] = useState(false);
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [currentEffects, setCurrentEffects] = useState(effects);
  const [currentTheme, setCurrentTheme] = useState(theme);
  
  const {
    cursorVariant,
    isVisible,
    position,
    isInteracting,
    targetElement,
    mounted: cursorMounted,
    setCursor,
    showCursor,
    hideCursor,
    updatePosition,
    setInteractionState,
    resetCursor,
  } = useCursor();

  // Performance-based effect adjustment
  const adjustEffectsForPerformance = useCallback((performanceLevel) => {
    switch (performanceLevel) {
      case 'low':
        return {
          glow: false,
          trail: false,
          ripple: false,
          scale: true,
        };
      case 'medium':
        return {
          glow: true,
          trail: false,
          ripple: true,
          scale: true,
        };
      case 'high':
      default:
        return effects;
    }
  }, [effects]);

  // Initialize cursor system
  useEffect(() => {
    if (!isEnabled || typeof window === 'undefined') return;

    setMounted(true);

    // Hide default cursor
    if (document.body) {
      document.body.classList.add('cursor-hidden');
    }

    // Performance monitoring (only in browser)
    if (typeof window !== 'undefined' && window.performance) {
      let frameCount = 0;
      let lastTime = performance.now();
      
      const monitorPerformance = () => {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - lastTime >= 1000) {
          const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
          
          // Adjust effects based on performance level
          if (fps < 30 && performanceLevel === 'high') {
            setCurrentEffects(adjustEffectsForPerformance('medium'));
          } else if (fps < 20) {
            setCurrentEffects(adjustEffectsForPerformance('low'));
          }
          
          frameCount = 0;
          lastTime = currentTime;
        }
        
        if (isEnabled) {
          requestAnimationFrame(monitorPerformance);
        }
      };

      requestAnimationFrame(monitorPerformance);
    }

    return () => {
      if (document.body) {
        document.body.classList.remove('cursor-hidden');
      }
    };
  }, [isEnabled, performanceLevel, adjustEffectsForPerformance]);

  // Handle cursor movement
  useEffect(() => {
    if (!isEnabled || !mounted || typeof window === 'undefined') return;

    const handleMouseMove = (e) => {
      updatePosition(e.clientX, e.clientY);
    };

    const handleMouseEnter = () => {
      showCursor();
    };

    const handleMouseLeave = () => {
      hideCursor();
    };

    // Handle interactive elements
    const handleElementEnter = (e) => {
      const element = e.target;
      const cursorType = element.getAttribute('data-cursor');
      
      if (cursorType) {
        setCursor(cursorType);
        setInteractionState(true, element);
      } else if (element.tagName === 'BUTTON' || element.tagName === 'A' || element.getAttribute('role') === 'button') {
        setCursor('pointer');
        setInteractionState(true, element);
      }
    };

    const handleElementLeave = () => {
      resetCursor();
    };

    // Add event listeners for interactive elements
    const interactiveElements = document.querySelectorAll(
      'button, a, input, textarea, select, [data-cursor], [role="button"], [tabindex]'
    );

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    interactiveElements.forEach(element => {
      element.addEventListener('mouseenter', handleElementEnter);
      element.addEventListener('mouseleave', handleElementLeave);
    });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      
      interactiveElements.forEach(element => {
        element.removeEventListener('mouseenter', handleElementEnter);
        element.removeEventListener('mouseleave', handleElementLeave);
      });
    };
  }, [isEnabled, mounted, updatePosition, showCursor, hideCursor, setCursor, setInteractionState, resetCursor]);

  // Context value
  const contextValue = {
    isEnabled,
    setIsEnabled,
    cursorVariant,
    isVisible,
    position,
    isInteracting,
    targetElement,
    effects: currentEffects,
    theme: currentTheme,
    setCursor,
    showCursor,
    hideCursor,
    setEffects: setCurrentEffects,
    setTheme: setCurrentTheme,
    resetCursor,
  };

  return (
    <CursorContext.Provider value={contextValue}>
      {children}
      {isEnabled && mounted && cursorMounted && (
        <EnhancedCustomCursor
          variant={cursorVariant}
          isVisible={isVisible}
          position={position}
          effects={currentEffects}
          theme={currentTheme}
        />
      )}
    </CursorContext.Provider>
  );
};

export default CursorProvider;