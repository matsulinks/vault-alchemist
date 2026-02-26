export interface VaultAlchemistSettings {
  servicePort: number;
  openaiApiKey: string;
  firstLaunchDone: boolean;
}

export const DEFAULT_SETTINGS: VaultAlchemistSettings = {
  servicePort: 3000,
  openaiApiKey: "",
  firstLaunchDone: false,
};
