export const ENDPOINTS = {
  FIND_USER: '/user/find',
  GET_BALANCE: '/user/balance',
  ADD_USER: '/user/add',

  // Job endpoints
  GET_JOBS: '/user/jobs',
  START_JOB: '/user/jobs/start',
  QUIT_JOB: '/user/jobs/quit',
  CLAIM_WAGE: '/user/jobs/claim',

  // Education endpoints
  GET_EDUCATION: '/user/education',
  ENROLL_COURSE: '/user/education/enroll',
  COMPLETE_COURSE: '/user/education/complete',

  // Stock endpoints
  GET_STOCKS: '/stocks',
  TRADE_STOCK: '/stocks/trade',
  PLACE_LIMIT_ORDER: '/stocks/limit',
  CANCEL_LIMIT_ORDER: '/stocks/limit',
  GET_LIMIT_ORDERS: '/stocks/limit',
  GET_PORTFOLIO: '/stocks/portfolio',
  CREATE_IPO: '/stocks/ipo',
};
