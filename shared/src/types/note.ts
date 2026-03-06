export type SourceType = "pdf" | "md" | "chat" | "web" | "other";
export type NoteKind =
  | "note"
  | "reference"
  | "journal"
  | "letter"
  | "email"
  | "meeting"
  | "task";
export type AuthorType = "human" | "ai" | "hybrid";
export type Confidence = "high" | "medium" | "low";
export type Freshness = "high" | "medium" | "low";
export type NoteStatus =
  | "active"
  | "defunct_suspected"
  | "defunct_confirmed"
  | "archived";
export type PersonalData = "none" | "suspected" | "confirmed";
export type RedactionLevel = "metadata_only" | "masked" | "allowed";

export interface NoteFrontmatter {
  // 出所・種類
  source_type?: SourceType;
  source_ref?: string;
  source_group_id?: string;
  content_hash?: string;
  note_kind?: NoteKind;

  // 著者区分
  author_type?: AuthorType;
  title_locked?: boolean;

  // 主題・タグ（4階層）
  topic?: string;
  tags_big?: string[];
  tags_mid?: string[];
  tags_small?: string[];
  tags_micro?: string[];

  // 価値の可視化
  summary?: string;
  why_now?: string;
  confidence?: Confidence;

  // 日付・鮮度
  source_date?: string;
  release_date?: string;
  file_created_at?: string;
  file_modified_at?: string;
  freshness?: Freshness;

  // 状態
  status?: NoteStatus;

  // 個人情報
  personal_data?: PersonalData;
  redaction_level?: RedactionLevel;
  entity_ids?: string[];

  // 行動ログ
  to_entity_ids?: string[];
  action_type?: string;
  action_date?: string;
  action_summary?: string;

  // 知的メタ
  user_intents?: string[];
  user_interests?: string[];
  insight_summary?: string;
  personality_tags?: string[];

  // 関連
  related?: string[];

  // タイトル最適化
  title_original?: string;
  title_current?: string;
  title_generated_by?: "human" | "ai";
  title_confidence?: number;
  title_last_updated_at?: string;

  // フォルダ管理
  path_original?: string;
  path_current?: string;
  path_generated_by?: "human" | "ai";
  path_locked?: boolean;
  path_last_updated_at?: string;
}

export interface ParsedNote {
  path: string;
  frontmatter: NoteFrontmatter;
  body: string;
  rawContent: string;
}
