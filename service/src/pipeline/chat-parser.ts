export type Role = "user" | "assistant" | "system" | "unknown";

export interface ChatMessage {
  msg_id: string;
  role: Role;
  text: string;
  timestamp: Date | null;
  lineIndex: number;
}

// 対応フォーマット
// 1) "**User:** text" / "**Assistant:** text"
// 2) "User: text" / "Assistant: text"
// 3) "[2024-01-01 12:00] User: text"
// 4) "Human: text" / "AI: text"

const ROLE_PATTERNS: { pattern: RegExp; role: Role }[] = [
  { pattern: /^\*{0,2}(User|Human|You)\*{0,2}\s*:/i, role: "user" },
  { pattern: /^\*{0,2}(Assistant|AI|Claude|GPT|Bot)\*{0,2}\s*:/i, role: "assistant" },
  { pattern: /^\*{0,2}(System)\*{0,2}\s*:/i, role: "system" },
];

const TIMESTAMP_RE =
  /\[(\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:?\d{2})?)?)\]\s*/;

export function parseChatMarkdown(content: string): ChatMessage[] {
  const lines = content.split("\n");
  const messages: ChatMessage[] = [];
  let current: ChatMessage | null = null;
  let msgCounter = 0;

  const flush = () => {
    if (current) {
      current.text = current.text.trimEnd();
      messages.push(current);
      current = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let rest = line;
    let timestamp: Date | null = null;

    // タイムスタンプを先に剥がす
    const tsMatch = rest.match(TIMESTAMP_RE);
    if (tsMatch) {
      timestamp = new Date(tsMatch[1]);
      rest = rest.slice(tsMatch[0].length);
    }

    let matched = false;
    for (const { pattern, role } of ROLE_PATTERNS) {
      if (pattern.test(rest)) {
        flush();
        const text = rest.replace(pattern, "").replace(/^\*+\s*/, "").trim();
        current = {
          msg_id: `msg_${++msgCounter}`,
          role,
          text,
          timestamp,
          lineIndex: i,
        };
        matched = true;
        break;
      }
    }

    if (!matched && current) {
      current.text += "\n" + line;
    }
  }

  flush();
  return messages;
}
