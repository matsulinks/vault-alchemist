import * as fs from "fs";
import * as path from "path";
import type { LLMProvider, FeatureFlags } from "@vault-alchemist/shared";
import { DEFAULT_FEATURE_FLAGS } from "@vault-alchemist/shared";
import { OpenAIProvider } from "./openai.js";

let _flags: FeatureFlags | null = null;

export function loadFeatureFlags(vaultPath: string): FeatureFlags {
  if (_flags) return _flags;
  const flagsPath = path.join(vaultPath, "_alchemy", "features.json");
  if (fs.existsSync(flagsPath)) {
    try {
      _flags = {
        ...DEFAULT_FEATURE_FLAGS,
        ...JSON.parse(fs.readFileSync(flagsPath, "utf-8")),
      };
    } catch {
      _flags = { ...DEFAULT_FEATURE_FLAGS };
    }
  } else {
    _flags = { ...DEFAULT_FEATURE_FLAGS };
    fs.mkdirSync(path.dirname(flagsPath), { recursive: true });
    fs.writeFileSync(flagsPath, JSON.stringify(_flags, null, 2));
  }
  return _flags!;
}

/** リクエストごとに新しいプロバイダーを返す（OAuthトークン更新に対応するためキャッシュしない） */
export function getProvider(apiKey: string): LLMProvider {
  return new OpenAIProvider(apiKey);
}
