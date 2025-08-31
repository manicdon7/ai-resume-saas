'use client';

import AnimatedCursor from 'react-animated-cursor';

const GlobalCursor = () => {
  return (
    <AnimatedCursor
      innerSize={8}
      outerSize={35}
      color='147, 51, 234'
      outerAlpha={0.3}
      innerScale={0.7}
      outerScale={2}
      clickables={[
        'a',
        'input[type="text"]',
        'input[type="email"]',
        'input[type="number"]',
        'input[type="submit"]',
        'input[type="image"]',
        'label[for]',
        'select',
        'textarea',
        'button',
        '.link',
        '.cursor-pointer'
      ]}
    />
  );
};

export default GlobalCursor;