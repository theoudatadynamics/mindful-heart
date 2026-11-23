import { fetchDownloadStats, validateStats } from "./download-stats.mjs";
export function renderStats(nodes, stats, saved = false) {
  const time = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(stats.asOf));
  for (const node of nodes) {
    node.querySelector("[data-download-value]").textContent = stats.totalDownloads.toLocaleString();
    node.querySelector("[data-download-status]").textContent = (saved ? "Last saved count · " : "Checked ") + time;
    for (const item of node.querySelectorAll("[data-download-channel]")) {
      const name = item.dataset.downloadChannel;
      const value = name === "GitHub" ? stats.channelTotals.GitHub + stats.channelTotals["GitHub / earlier updates"] : stats.channelTotals[name];
      item.textContent = value.toLocaleString();
    }
  }
}
export async function loadCounter(nodes, fetcher = globalThis.fetch) {
  if (!nodes.length) return;
  try {
    const stats = await fetchDownloadStats(fetcher); renderStats(nodes, stats); return stats;
  } catch {
    try {
      const response = await fetcher(new URL("./download-stats.json", import.meta.url), { credentials: "omit", cache: "no-cache" });
      if (!response.ok) throw new Error();
      const stats = validateStats(await response.json()); renderStats(nodes, stats, true); return stats;
    } catch {
      for (const node of nodes) {
        node.querySelector("[data-download-value]").textContent = "—";
        node.querySelector("[data-download-status]").textContent = "Count unavailable. Downloads still work.";
        for (const item of node.querySelectorAll("[data-download-channel]")) item.textContent = "—";
      }
    }
  }
}
if (typeof document !== "undefined") loadCounter([...document.querySelectorAll("[data-download-total]")]);
