/** Framework-free contract shared by the mock and (later) the Supabase adapter. */
export type Session = { kind: 'customer'; accountId: string } | { kind: 'staff'; staffId: string };

export type LoginInput = { identifier: string; password: string };
export type SignupInput = {
  full_name: string; salutation?: 'anh' | 'chi' | 'ban'; phone: string; username: string; password: string; password2: string; consent: boolean;
};

export interface AuthApi {
  login(input: LoginInput): Promise<Session>;
  signup(input: SignupInput): Promise<Session>;
  logout(): Promise<void>;
  current(): Session | null;
}

export interface SystemApi {
  resetDemo(): Promise<void>;
  storageStatus(): { persistent: boolean; needsRefresh: boolean; seededAt: string };
  now(): Date;
  subscribe(cb: () => void): () => void;
  rev(): number;
  purgeExpiredVideos(): number;
}
