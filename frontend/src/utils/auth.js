const AUTH_STORAGE_KEY = 'kalpdrushti:user';

export const AUTH_EVENT = 'kalpdrushti-auth-change';

const emitAuthChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_EVENT));
  }
};

export const getStoredUser = () => {
  if (typeof window === 'undefined') return null;

  try {
    const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.warn('Unable to read auth state:', error);
    return null;
  }
};

export const setStoredUser = (user) => {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  emitAuthChange();
};

export const clearStoredUser = () => {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  emitAuthChange();
};
