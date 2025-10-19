// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

// User Roles
const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// Rate limiting
const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100, // 100 requests per window
};

// Password requirements
const PASSWORD = {
  MIN_LENGTH: 6,
  SALT_ROUNDS: 12,
};

// JWT settings
const JWT = {
  DEFAULT_EXPIRES_IN: "1d",
  UUID_LENGTH: 32,
};

module.exports = {
  HTTP_STATUS,
  USER_ROLES,
  PAGINATION,
  RATE_LIMIT,
  PASSWORD,
  JWT,
};
