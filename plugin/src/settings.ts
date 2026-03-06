export interface VaultAlchemistSettings {
  servicePort: number;
  openaiApiKey: string;
  authMode: "apikey" | "oauth";
  oauthAccessToken?: string;
  oauthRefreshToken?: string;
  oauthExpiresAt?: number;
  firstLaunchDone: boolean;
}

export const DEFAULT_SETTINGS: VaultAlchemistSettings = {
  servicePort: 3000,
  openaiApiKey: "",
  authMode: "apikey",
  firstLaunchDone: false,
};
