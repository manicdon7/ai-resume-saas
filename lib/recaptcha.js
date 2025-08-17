// reCAPTCHA Enterprise utility functions

// Client-side reCAPTCHA execution
export const executeRecaptcha = async (action = 'LOGIN') => {
  try {
    // Wait for reCAPTCHA to be ready
    await new Promise((resolve) => {
      if (typeof grecaptcha !== 'undefined' && grecaptcha.enterprise) {
        resolve();
      } else {
        const checkRecaptcha = setInterval(() => {
          if (typeof grecaptcha !== 'undefined' && grecaptcha.enterprise) {
            clearInterval(checkRecaptcha);
            resolve();
          }
        }, 100);
      }
    });

    // Execute reCAPTCHA
    const token = await grecaptcha.enterprise.execute('6LfvYagrAAAAALymrNmW7_aKDSU0CGBdQrf8HbiJ', { action });
    return token;
  } catch (error) {
    console.error('reCAPTCHA execution error:', error);
    throw new Error('Failed to execute reCAPTCHA');
  }
};

// Server-side reCAPTCHA verification
export const verifyRecaptchaToken = async (token, action = 'LOGIN') => {
  try {
    const response = await fetch('/api/verify-recaptcha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        action,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'reCAPTCHA verification failed');
    }

    return data;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    throw error;
  }
};

// reCAPTCHA configuration
export const RECAPTCHA_CONFIG = {
  siteKey: '6LfvYagrAAAAALymrNmW7_aKDSU0CGBdQrf8HbiJ',
  projectId: 'rolefit-ai-cca18',
  actions: {
    LOGIN: 'LOGIN',
    SIGNUP: 'SIGNUP',
    RESUME_GENERATION: 'RESUME_GENERATION',
  },
};
