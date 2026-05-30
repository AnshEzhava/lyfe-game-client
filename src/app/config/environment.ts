const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const CONFIG = {
  API_URL: isLocal ? 'http://localhost:8080/api' : `${window.location.origin}/api`,
  WS_URL: isLocal ? 'ws://localhost:8080' : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`,
};
