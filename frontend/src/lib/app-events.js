export const APP_DATA_CHANGED_EVENT = 'localbot:data-changed';

export function notifyAppDataChanged(detail = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(APP_DATA_CHANGED_EVENT, { detail }));
}
