// export function gcsToHttps(gcsPath: string) {
export function normalizeGCSPath(gcsPath: string) {
  if (!gcsPath) return gcsPath;
  if (gcsPath.startsWith("http")) return gcsPath;
  if (!gcsPath.startsWith("gs://")) return gcsPath;
  const noScheme = gcsPath.slice("gs://".length);
  const slash = noScheme.indexOf("/");
  const bucket = noScheme.slice(0, slash);
  const object = noScheme.slice(slash + 1);
  // public domain that works in <img>
  return `https://storage.googleapis.com/${bucket}/${object}`;
}

// export function normalizeGCSPath(gcsPath: string): string {
//   return gcsPath.replace(
//     /^gs:\\/\\/(.+?)\\/(.+)$/,
//     'https://storage.googleapis.com/$1/$2'
//   );
// }