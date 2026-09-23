// Type declarations for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              width?: number;
              logo_alignment?: 'left' | 'center';
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

let scriptLoaded = false;

export function loadGoogleScript(): Promise<void> {
  if (scriptLoaded && window.google?.accounts) return Promise.resolve();

  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google?.accounts) {
      scriptLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = GSI_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Google Sign-In'));
    document.head.appendChild(script);
  });
}

export function initGoogleAuth(onCredential: (idToken: string) => void): void {
  if (!window.google?.accounts) {
    console.warn('Google Sign-In not loaded');
    return;
  }

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response) => {
      onCredential(response.credential);
    },
  });
}

export function renderGoogleButton(element: HTMLElement): void {
  if (!window.google?.accounts) {
    console.warn('Google Sign-In not loaded');
    return;
  }

  window.google.accounts.id.renderButton(element, {
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'pill',
    width: 320,
    logo_alignment: 'center',
  });
}

export function isGoogleConfigured(): boolean {
  return Boolean(GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('your-google-client-id'));
}

export { GOOGLE_CLIENT_ID };
