/** Facade for public-site and auth code. */
import { api } from './index';
export const auth = api.auth;
export const system = api.system;
export type { Session, LoginInput, SignupInput } from './contracts/api';
