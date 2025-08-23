export function classNames(...arr: (string | false | undefined)[]) {
  return arr.filter(Boolean).join(" ");
}

export const toCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export function toCSV(items: any[]) {
  const header = ["id", "name", "marketPrice", "timestamp", "category", "videoId", "thumbnail", "sources"].join(",");
  const lines = items.map((i) => {
    const sources = i.sources.map((s: any) => `${s.label}: ${s.url}`).join(" | ");
    const row = [i.id, i.name, i.marketPrice, i.timestamp, i.category, i.videoId, i.thumbnail, sources]
      .map((v) => `"${String(v).replaceAll('"', '""')}"`)
      .join(",");
    return row;
  });
  return [header, ...lines].join("\n");
}

export function download(filename: string, text: string, mime = "text/plain") {
  const el = document.createElement("a");
  el.setAttribute("href", `data:${mime};charset=utf-8,` + encodeURIComponent(text));
  el.setAttribute("download", filename);
  el.style.display = "none";
  document.body.appendChild(el);
  el.click();
  document.body.removeChild(el);
}
