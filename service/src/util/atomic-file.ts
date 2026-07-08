import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

/**
 * Vault配下のファイルを安全に書き換える。
 *
 * ユーザーのVaultはObsidian Sync / iCloud / Google Driveミラー等で同期されている
 * ことが多く、`fs.writeFileSync` で直接上書きすると書き込み途中の状態を同期
 * クライアントが拾い、壊れた中間状態が他デバイスへ伝播しうる。
 * そこで同一ディレクトリ内に一時ファイルを書き、`fs.renameSync` で差し替える
 * （同一ファイルシステム内のrenameはPOSIX/NTFS双方でアトミック）。
 *
 * 書き込みに失敗した場合は一時ファイルを掃除し、元のファイルには一切触れない。
 */
export function atomicWriteFileSync(
  filePath: string,
  content: string,
  encoding: BufferEncoding = "utf-8"
): void {
  const dir = path.dirname(filePath);
  const tmpPath = path.join(
    dir,
    `.${path.basename(filePath)}.tmp-${process.pid}-${crypto.randomBytes(4).toString("hex")}`
  );

  try {
    fs.writeFileSync(tmpPath, content, encoding);
    fs.renameSync(tmpPath, filePath);
  } catch (e) {
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      /* 一時ファイルが存在しない場合等は無視 */
    }
    throw e;
  }
}
