export const REPOSITORY = "theoudatadynamics/mindful-heart";
export const CHANNELS = ["Website", "GitHub", "In-app updates", "GitHub / earlier updates"];
const prefix = "https://github.com/" + REPOSITORY + "/releases/";
function downloadChannel(name, build) {
  if (/-website\.(zip|dmg|pkg)$/i.test(name)) return "Website";
  if (/-update\.(zip|dmg|pkg)$/i.test(name)) return "In-app updates";
  return build !== null && build > 47 ? "GitHub" : "GitHub / earlier updates";
}
export function archiveRows(releases) {
  if (!Array.isArray(releases)) throw new Error("Expected a GitHub release list.");
  const rows = new Map();
  for (const release of releases) {
    if (release.draft) continue;
    if (!Array.isArray(release.assets) || typeof release.tag_name !== "string") throw new Error("Invalid release metadata.");
    const match = /^v([0-9.]+)-(beta|stable)\.(\d+)$/.exec(release.tag_name);
    const build = match ? Number(match[3]) : null;
    for (const asset of release.assets) {
      if (!/\.(zip|dmg|pkg)$/i.test(asset.name)) continue;
      if (!Number.isSafeInteger(asset.id) || !Number.isSafeInteger(asset.download_count) || asset.download_count < 0) throw new Error("Invalid archive count.");
      rows.set(asset.id, { assetId: asset.id, release: release.tag_name, version: match ? match[1] : release.tag_name,
        build, channel: release.prerelease ? "Beta" : "Stable", downloadChannel: downloadChannel(asset.name, build),
        asset: asset.name, downloads: asset.download_count, publishedAt: release.published_at,
        releaseUrl: prefix + "tag/" + encodeURIComponent(release.tag_name) });
    }
  }
  return [...rows.values()];
}
export function summarize(rows, asOf = new Date().toISOString()) {
  const totals = Object.fromEntries(CHANNELS.map(name => [name, 0]));
  const seen = new Set();
  for (const row of rows) {
    if (seen.has(row.assetId) || !Number.isSafeInteger(row.downloads) || row.downloads < 0 || !(row.downloadChannel in totals)) throw new Error("Invalid or duplicate archive.");
    seen.add(row.assetId);
    totals[row.downloadChannel] += row.downloads;
  }
  const totalDownloads = Object.values(totals).reduce((sum, count) => sum + count, 0);
  if (!Number.isSafeInteger(totalDownloads) || !Number.isFinite(Date.parse(asOf))) throw new Error("Invalid total or timestamp.");
  return { schemaVersion: 1, repository: REPOSITORY, asOf, totalDownloads, channelTotals: totals, releases: rows };
}
export function validateStats(value) {
  if (value?.schemaVersion !== 1 || value.repository !== REPOSITORY || !Array.isArray(value.releases)) throw new Error("Invalid download snapshot.");
  const expected = summarize(value.releases, value.asOf);
  if (expected.totalDownloads !== value.totalDownloads || CHANNELS.some(channel => expected.channelTotals[channel] !== value.channelTotals?.[channel])) throw new Error("Download totals do not reconcile.");
  return expected;
}
export async function fetchDownloadStats(fetcher = globalThis.fetch, now = () => new Date().toISOString()) {
  const releases = [];
  for (let page = 1; page <= 10; page++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let response, data;
    try {
      response = await fetcher("https://api.github.com/repos/" + REPOSITORY + "/releases?per_page=100&page=" + page,
        { headers: { Accept: "application/vnd.github+json" }, signal: controller.signal, credentials: "omit" });
      if (!response.ok) throw new Error("GitHub download counts are temporarily unavailable.");
      data = await response.json();
    } finally { clearTimeout(timeout); }
    if (!Array.isArray(data)) throw new Error("Invalid GitHub response.");
    releases.push(...data);
    if (data.length < 100) return summarize(archiveRows(releases), now());
  }
  throw new Error("Release history exceeds the reviewed pagination limit.");
}
