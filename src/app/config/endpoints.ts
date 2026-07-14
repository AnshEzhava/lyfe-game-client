export const ENDPOINTS = {
  FIND_USER: '/user/find',
  GET_BALANCE: '/user/balance',
  ADD_USER: '/user/add',

  // AFK / session endpoints
  RESUME_SESSION: '/user/resume',
  GET_SETTINGS: '/user/settings',
  UPDATE_SETTINGS: '/user/settings',
  GET_ACTIVITY: '/user/activity',

  // Job endpoints
  GET_JOBS: '/user/jobs',
  START_JOB: '/user/jobs/start',
  QUIT_JOB: '/user/jobs/quit',
  CLAIM_WAGE: '/user/jobs/claim',

  // Education endpoints
  GET_EDUCATION: '/user/education',
  ENROLL_COURSE: '/user/education/enroll',
  COMPLETE_COURSE: '/user/education/complete',

  // News endpoints
  GET_NEWS: '/news',

  // Casino endpoints
  CASINO_PLAY: '/casino/play',

  // Stock endpoints
  GET_STOCKS: '/stocks',
  TRADE_STOCK: '/stocks/trade',
  PLACE_LIMIT_ORDER: '/stocks/limit',
  CANCEL_LIMIT_ORDER: '/stocks/limit',
  GET_LIMIT_ORDERS: '/stocks/limit',
  GET_PORTFOLIO: '/stocks/portfolio',
  CREATE_IPO: '/stocks/ipo',
  DILUTE: '/stocks',
};
