import { ItemView, Notice } from "obsidian";

export abstract class VaultAlchemistView extends ItemView {
  /** children[1] を空にしてクラスを付けてから返す */
  protected getRoot(cls: string): HTMLElement {
    const root = this.containerEl.children[1] as HTMLElement;
    root.empty();
    root.addClass(cls);
    return root;
  }

  /** `va-btn` 付きボタンを生成してイベントを繋ぐ */
  protected btn(
    parent: HTMLElement,
    text: string,
    cls: string,
    onClick: () => void,
  ): HTMLButtonElement {
    const b = parent.createEl("button", { text, cls: `va-btn ${cls}` });
    b.addEventListener("click", onClick);
    return b;
  }

  /** エラーを Notice に流して null を返す共通ラッパー */
  protected async callApi<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch (e: any) {
      new Notice(`エラー: ${e.message}`);
      return null;
    }
  }
}
