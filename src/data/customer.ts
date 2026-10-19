/** Facade for customer-zone code: only customer-safe DTOs. */
import { api } from './index';
export const customer = api.customer;
export type * from './contracts/customer';
