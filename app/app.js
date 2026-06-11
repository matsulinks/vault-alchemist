async function refreshStatus() {
  const status = document.getElementById("service-status");
  try {
    const res = await fetch("/health");
    if (!res.ok) throw new Error("health check failed");
    const data = await res.json();
    status.textContent = data.status === "ok" ? "起動中" : "確認必要";
    status.classList.toggle("ok", data.status === "ok");
  } catch {
    status.textContent = "未接続";
    status.classList.remove("ok");
  }
}

document.getElementById("choose-folder")?.addEventListener("click", () => {
  alert("次の実装で、ローカルフォルダ選択とスキャンを追加します。");
});

refreshStatus();
