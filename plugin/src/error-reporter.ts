import { Notice } from "obsidian";

const GITHUB_REPO = "matsulinks/vault-alchemist";
const ISSUE_URL = `https://github.com/${GITHUB_REPO}/issues/new`;

/** エラーをキャプチャして GitHub Issue 作成URLを開くかどうかをユーザーに尋ねる */
export function reportError(context: string, error: unknown): void {
  const err = error instanceof Error ? error : new Error(String(error));
  const message = err.message;
  const stack = err.stack ?? "(no stack)";

  console.error(`[vault-alchemist] ${context}:`, err);

  // Obsidian Notice でエラーを表示し、GitHub へのリンクを促す
  const notice = new Notice(
    `Vault Alchemist でエラーが発生しました。\n${message}\n\nクリックして GitHub にレポートを送る →`,
    0 // 自動で消えない
  );

  notice.noticeEl.style.cursor = "pointer";
  notice.noticeEl.addEventListener("click", () => {
    openGitHubIssue(context, message, stack);
    notice.hide();
  });
}

function openGitHubIssue(context: string, message: string, stack: string): void {
  const title = encodeURIComponent(`[crash] ${context}: ${message}`.slice(0, 100));
  const body = encodeURIComponent(
    [
      "## エラー内容",
      `**発生場所**: ${context}`,
      `**メッセージ**: ${message}`,
      "",
      "## スタックトレース",
      "```",
      stack.slice(0, 2000),
      "```",
      "",
      "## 環境",
      `- Vault Alchemist: 0.1.0`,
      `- OS: ${navigator.platform}`,
      `- Obsidian: ${(window as any).require?.("electron")?.remote?.app?.getVersion() ?? "unknown"}`,
    ].join("\n")
  );

  const url = `${ISSUE_URL}?title=${title}&body=${body}&labels=bug`;
  const { shell } = require("electron") as { shell: { openExternal: (url: string) => void } };
  shell.openExternal(url);
}
