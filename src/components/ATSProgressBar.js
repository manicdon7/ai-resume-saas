'use client';

import { useState, useEffect } from 'react';

const ATSProgressBar = ({ 
  label, 
  score = 0, 
  maxScore = 100, 
  color = "primary",
  icon = "▦",
  showPercentage = true,
  className = ""
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setAnimatedScore(current => {
          if (current >= score) {
            clearInterval(interval);
            return score;
          }
          return current + Math.ceil((score - current) / 15);
        });
      }, 30);

      return () => clearInterval(interval);
    }, 200);

    return () => clearTimeout(timer);
  }, [score]);

  const getColorClasses = (colorName) => {
    const colorMap = {
      primary: {
        bg: 'bg-gradient-to-r from-primary to-primary/80',
        text: 'text-primary',
        light: 'bg-primary/10'
      },
      accent: {
        bg: 'bg-gradient-to-r from-accent to-accent/80',
        text: 'text-accent',
        light: 'bg-accent/10'
      },
      secondary: {
        bg: 'bg-gradient-to-r from-secondary to-secondary/80',
        text: 'text-secondary',
        light: 'bg-secondary/10'
      },
      green: {
        bg: 'bg-gradient-to-r from-green-500 to-green-400',
        text: 'text-green-500',
        light: 'bg-green-500/10'
      },
      orange: {
        bg: 'bg-gradient-to-r from-orange-500 to-orange-400',
        text: 'text-orange-500',
        light: 'bg-orange-500/10'
      },
      red: {
        bg: 'bg-gradient-to-r from-red-500 to-red-400',
        text: 'text-red-500',
        light: 'bg-red-500/10'
      }
    };
    return colorMap[colorName] || colorMap.primary;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'orange';
    return 'red';
  };

  const actualColor = color === 'auto' ? getScoreColor(score) : color;
  const colors = getColorClasses(actualColor);
  const percentage = (animatedScore / maxScore) * 100;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label and Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-bold ${colors.text}`}>
            {animatedScore}{showPercentage && maxScore === 100 ? '%' : `/${maxScore}`}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className={`w-full h-3 ${colors.light} rounded-full overflow-hidden`}>
          <div 
            className={`h-full ${colors.bg} rounded-full transition-all duration-1000 ease-out relative overflow-hidden`}
            style={{ width: `${percentage}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </div>
        </div>
        
        {/* Score indicator */}
        {percentage > 5 && (
          <div 
            className="absolute top-0 h-3 w-1 bg-white/60 rounded-full transition-all duration-1000 ease-out"
            style={{ left: `${Math.max(percentage - 1, 0)}%` }}
          ></div>
        )}
      </div>
    </div>
  );
};

export default ATSProgressBar;
