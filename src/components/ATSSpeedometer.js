'use client';

import { useState, useEffect } from 'react';

const ATSSpeedometer = ({ 
  label, 
  score = 0, 
  maxScore = 100, 
  color = "primary", 
  icon = "▦",
  description = "",
  size = "default" 
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
          return current + Math.ceil((score - current) / 10);
        });
      }, 50);

      return () => clearInterval(interval);
    }, 300);

    return () => clearTimeout(timer);
  }, [score]);

  const getColorClasses = (colorName) => {
    const colorMap = {
      primary: {
        stroke: 'stroke-primary',
        fill: 'fill-primary',
        text: 'text-primary',
        bg: 'bg-primary/10',
        border: 'border-primary/20'
      },
      accent: {
        stroke: 'stroke-accent',
        fill: 'fill-accent',
        text: 'text-accent',
        bg: 'bg-accent/10',
        border: 'border-accent/20'
      },
      secondary: {
        stroke: 'stroke-secondary',
        fill: 'fill-secondary',
        text: 'text-secondary',
        bg: 'bg-secondary/10',
        border: 'border-secondary/20'
      },
      green: {
        stroke: 'stroke-green-500',
        fill: 'fill-green-500',
        text: 'text-green-500',
        bg: 'bg-green-500/10',
        border: 'border-green-500/20'
      },
      orange: {
        stroke: 'stroke-orange-500',
        fill: 'fill-orange-500',
        text: 'text-orange-500',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20'
      },
      red: {
        stroke: 'stroke-red-500',
        fill: 'fill-red-500',
        text: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20'
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

  const sizeConfig = {
    small: { svg: 80, stroke: 6, text: 'text-sm', title: 'text-xs' },
    default: { svg: 120, stroke: 8, text: 'text-lg', title: 'text-sm' },
    large: { svg: 160, stroke: 10, text: 'text-2xl', title: 'text-base' }
  };

  const config = sizeConfig[size];
  const radius = (config.svg - config.stroke) / 2;
  const normalizedRadius = radius - config.stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  
  // Calculate the percentage and stroke offset
  const percentage = (animatedScore / maxScore) * 100;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center space-y-3">
      {/* Speedometer */}
      <div className={`relative ${colors.bg} ${colors.border} border rounded-full p-4 shadow-lg`}>
        <svg
          height={config.svg}
          width={config.svg}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={config.stroke}
            strokeDasharray={strokeDasharray}
            style={{ strokeDashoffset: 0 }}
            r={normalizedRadius}
            cx={config.svg / 2}
            cy={config.svg / 2}
            className="text-muted/20"
          />
          
          {/* Progress circle */}
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={config.stroke}
            strokeDasharray={strokeDasharray}
            style={{ 
              strokeDashoffset: strokeDashoffset,
              transition: 'stroke-dashoffset 0.5s ease-in-out'
            }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={config.svg / 2}
            cy={config.svg / 2}
            className={colors.stroke}
          />
        </svg>
        
        {/* Score display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl mb-1">{icon}</div>
          <div className={`font-bold ${colors.text} ${config.text}`}>
            {animatedScore}
            {maxScore === 100 && '%'}
          </div>
          {maxScore !== 100 && (
            <div className={`text-xs text-muted-foreground`}>
              /{maxScore}
            </div>
          )}
        </div>
      </div>

      {/* Label and description */}
      <div className="text-center space-y-1">
        <div className={`font-semibold text-foreground ${config.title}`}>{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground max-w-24 leading-tight">
            {description}
          </div>
        )}
      </div>
    </div>
  );
};

export default ATSSpeedometer;
