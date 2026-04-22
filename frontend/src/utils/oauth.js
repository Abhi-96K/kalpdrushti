const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const APPLE_SCRIPT_SRC = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
const GOOGLE_PROFILE_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

const scriptPromises = new Map();

const getEnvValue = (key) => import.meta.env[key]?.trim();

const createRandomValue = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  const values = new Uint32Array(4);
  window.crypto?.getRandomValues(values);
  return Array.from(values, (value) => value.toString(16)).join('-');
};

const loadScript = (src, id) => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('OAuth can only run in a browser.'));
  }

  if (scriptPromises.has(src)) {
    return scriptPromises.get(src);
  }

  const existingScript = document.getElementById(id);
  if (existingScript?.dataset.loaded === 'true') {
    const resolved = Promise.resolve();
    scriptPromises.set(src, resolved);
    return resolved;
  }

  const promise = new Promise((resolve, reject) => {
    const script = existingScript || document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => {
      scriptPromises.delete(src);
      reject(new Error(`Unable to load OAuth script: ${src}`));
    };

    if (!existingScript) {
      document.head.appendChild(script);
    }
  });

  scriptPromises.set(src, promise);
  return promise;
};

const decodeJwtPayload = (token) => {
  if (!token) return null;

  try {
    const encodedPayload = token.split('.')[1];
    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const binary = window.atob(paddedBase64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (error) {
    console.warn('Unable to decode OAuth identity token:', error);
    return null;
  }
};

const fetchGoogleProfile = async (accessToken) => {
  const response = await fetch(GOOGLE_PROFILE_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Google granted access, but the profile request failed.');
  }

  return response.json();
};

export const getOAuthStatus = () => ({
  googleConfigured: Boolean(getEnvValue('VITE_GOOGLE_CLIENT_ID')),
  appleConfigured: Boolean(getEnvValue('VITE_APPLE_CLIENT_ID')),
});

export const preloadOAuthScripts = () => {
  const { googleConfigured, appleConfigured } = getOAuthStatus();
  const jobs = [];

  if (googleConfigured) {
    jobs.push(loadScript(GOOGLE_SCRIPT_SRC, 'google-identity-services').catch(() => null));
  }

  if (appleConfigured) {
    jobs.push(loadScript(APPLE_SCRIPT_SRC, 'apple-signin-js').catch(() => null));
  }

  return Promise.all(jobs);
};

export const startGoogleOAuth = async () => {
  const clientId = getEnvValue('VITE_GOOGLE_CLIENT_ID');

  if (!clientId) {
    throw new Error('Google sign-in is not configured. Add VITE_GOOGLE_CLIENT_ID to frontend/.env.');
  }

  await loadScript(GOOGLE_SCRIPT_SRC, 'google-identity-services');

  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services did not initialize.');
  }

  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      prompt: 'select_account consent',
      callback: async (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }

        try {
          const profile = await fetchGoogleProfile(response.access_token);
          resolve({
            name: profile.name || profile.email?.split('@')[0] || 'Google Creator',
            email: profile.email || 'google-user@kalpadrushti.ai',
            avatar: profile.picture,
            externalId: profile.sub,
            provider: 'Google',
            oauthVerified: true,
            tokenScopes: response.scope,
          });
        } catch (error) {
          reject(error);
        }
      },
      error_callback: (error) => {
        reject(new Error(error?.type || 'Google permission popup was closed or blocked.'));
      },
    });

    tokenClient.requestAccessToken({ prompt: 'select_account consent' });
  });
};

export const startAppleOAuth = async () => {
  const clientId = getEnvValue('VITE_APPLE_CLIENT_ID');
  const redirectURI = getEnvValue('VITE_APPLE_REDIRECT_URI') || `${window.location.origin}/auth`;

  if (!clientId) {
    throw new Error('Apple sign-in is not configured. Add VITE_APPLE_CLIENT_ID to frontend/.env.');
  }

  if (/localhost|127\.0\.0\.1/i.test(redirectURI)) {
    throw new Error('Apple Sign in requires a registered HTTPS redirect URI, not localhost.');
  }

  await loadScript(APPLE_SCRIPT_SRC, 'apple-signin-js');

  if (!window.AppleID?.auth) {
    throw new Error('Sign in with Apple JS did not initialize.');
  }

  const state = createRandomValue();
  const nonce = createRandomValue();

  window.AppleID.auth.init({
    clientId,
    scope: 'name email',
    redirectURI,
    state,
    nonce,
    usePopup: true,
  });

  const response = await window.AppleID.auth.signIn();
  const authorization = response?.authorization || {};

  if (authorization.state && authorization.state !== state) {
    throw new Error('Apple sign-in state mismatch.');
  }

  const payload = decodeJwtPayload(authorization.id_token) || {};
  const appleUser = response?.user || {};
  const fullName = [appleUser.name?.firstName, appleUser.name?.lastName].filter(Boolean).join(' ');
  const email = payload.email || appleUser.email || 'private-apple-user@kalpadrushti.ai';

  return {
    name: fullName || email.split('@')[0] || 'Apple Creator',
    email,
    externalId: payload.sub,
    provider: 'Apple',
    oauthVerified: true,
    tokenIssuedAt: payload.iat,
  };
};
