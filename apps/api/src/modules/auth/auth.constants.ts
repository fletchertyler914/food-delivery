// Pre-computed bcrypt hash of a dummy password. Used to keep login
// response time constant when the email is unknown (timing-oracle
// mitigation). Cost factor matches UsersService (12).
export const DUMMY_PASSWORD_HASH = "$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW";
