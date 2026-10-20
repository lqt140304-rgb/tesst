/** Framework-free contract shared by the mock and (later) the Supabase adapter. */
export type Session = { kind: 'customer'; accountId: string } | { kind: 'staff'; staffId: string };

export type LoginInput = { identifier: string; password: string };
export type SignupInput = {
  full_name: string; salutation?: 'anh' | 'chi' | 'ban'; phone: string; username: string; password: string; password2: string; consent: boolean;
};

export type Me =
  | { kind: 'customer'; name: string; username: string; linked: boolean; phoneMasked: string; salutation: 'anh' | 'chi' | 'ban' }
  | { kind: 'staff'; name: string; username: string; title: string; caps: import('../rules/capabilities').Cap[]; presets: string[] };

export interface AuthApi {
  login(input: LoginInput): Promise<Session>;
  signup(input: SignupInput): Promise<Session>;
  /** Live sign-up check: the error message for this username, or null when it can be used. */
  checkUsername(username: string): Promise<string | null>;
  logout(): Promise<void>;
  current(): Session | null;
  me(): Promise<Me | null>;
  /** Called after login, sign-up and logout. */
  subscribe(cb: () => void): () => void;
}

export interface SystemApi {
  resetDemo(): Promise<void>;
  storageStatus(): { persistent: boolean; needsRefresh: boolean; seededAt: string };
  now(): Date;
  subscribe(cb: () => void): () => void;
  rev(): number;
  purgeExpiredVideos(): number;
}

/** A video kept only in this browser (media_key "local:…"): the file and, when the browser could read it, its first frame. */
export type LocalMedia = { video: Blob; poster?: Blob };

export interface MediaApi {
  /** Null when the key is not a stored video or its file is gone ("Không còn tệp video"). */
  local(mediaKey: string): Promise<LocalMedia | null>;
}
