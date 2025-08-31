'use client';

import { useState } from 'react';
import { CursorProvider } from './CursorProvider';
import { useCursorHover, useCursorClick, useCursorMagnetism } from '../hooks/useCursorInteraction';

const TestButton = ({ children, variant = 'pointer' }) => {
  const { cursorRef } = useCursorHover(variant);
  
  return (
    <button
      ref={cursorRef}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      data-cursor={variant}
    >
      {children}
    </button>
  );
};

const TestCard = ({ children }) => {
  const { cursorRef } = useCursorMagnetism(0.3, 'pointer');
  
  return (
    <div
      ref={cursorRef}
      className="p-6 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
      data-cursor="pointer"
    >
      {children}
    </div>
  );
};

const TestInput = () => {
  const { cursorRef } = useCursorHover('text');
  
  return (
    <input
      ref={cursorRef}
      type="text"
      placeholder="Test input field"
      className="px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
      data-cursor="text"
    />
  );
};

const CursorTest = () => {
  const [effectsEnabled, setEffectsEnabled] = useState({
    glow: true,
    trail: false,
    ripple: true,
    scale: true,
  });

  return (
    <CursorProvider
      enabled={true}
      effects={effectsEnabled}
      theme="dark"
      performance="high"
    >
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold text-center mb-8">
            Custom Cursor System Test
          </h1>

          {/* Effect Controls */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Cursor Effects</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(effectsEnabled).map(([effect, enabled]) => (
                <label key={effect} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEffectsEnabled(prev => ({
                      ...prev,
                      [effect]: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <span className="capitalize">{effect}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Test Elements */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TestCard>
              <h3 className="text-lg font-semibold mb-2">Magnetic Card</h3>
              <p className="text-gray-300">
                Hover over this card to see the magnetism effect.
              </p>
            </TestCard>

            <TestCard>
              <h3 className="text-lg font-semibold mb-2">Another Card</h3>
              <p className="text-gray-300">
                This card also has cursor magnetism enabled.
              </p>
            </TestCard>

            <TestCard>
              <h3 className="text-lg font-semibold mb-2">Third Card</h3>
              <p className="text-gray-300">
                Test the cursor interactions across multiple elements.
              </p>
            </TestCard>
          </div>

          {/* Button Tests */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Button Interactions</h2>
            <div className="flex flex-wrap gap-4">
              <TestButton variant="pointer">Primary Button</TestButton>
              <TestButton variant="loading">Loading Button</TestButton>
              <button
                className="px-6 py-3 bg-gray-600 text-gray-400 rounded-lg cursor-not-allowed"
                disabled
                data-cursor="disabled"
              >
                Disabled Button
              </button>
            </div>
          </div>

          {/* Input Tests */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Input Fields</h2>
            <div className="space-y-3">
              <TestInput />
              <textarea
                placeholder="Test textarea"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none resize-none"
                rows="3"
                data-cursor="text"
              />
            </div>
          </div>

          {/* Draggable Test */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Draggable Element</h2>
            <div
              className="w-32 h-32 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center cursor-move"
              draggable
              data-cursor="drag"
            >
              <span className="text-white font-semibold">Drag Me</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
            <ul className="space-y-2 text-gray-300">
              <li>• Move your mouse around to see the custom cursor</li>
              <li>• Hover over buttons to see the pointer cursor variant</li>
              <li>• Hover over input fields to see the text cursor</li>
              <li>• Try the magnetism effect on cards</li>
              <li>• Click elements to see ripple effects (if enabled)</li>
              <li>• Toggle effects using the controls above</li>
            </ul>
          </div>
        </div>
      </div>
    </CursorProvider>
  );
};

export default CursorTest;