// Check actual HTTP responses from a running admin app, including MIME types.
const origin = process.argv[2] || "http://localhost:3004";
const page = await fetch(new URL("/login", origin), {
  signal: AbortSignal.timeout(60000),
});
if (page.status !== 200)
  throw new Error(`Sign-in returned HTTP ${page.status}`);
const html = await page.text();
const paths = [
  ...new Set(
    [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
      .map((match) => match[1].replaceAll("&amp;", "&"))
      .filter(
        (path) =>
          path.startsWith("/_next/static/") &&
          /\.(?:css|js)(?:\?|$)/.test(path),
      ),
  ),
];
if (
  !paths.some((path) => /\.css(?:\?|$)/.test(path)) ||
  !paths.some((path) => /\.js(?:\?|$)/.test(path))
)
  throw new Error("The page did not reference CSS and JavaScript assets.");
const results = await Promise.all(
  paths.map(async (path) => {
    const response = await fetch(new URL(path, origin), {
      signal: AbortSignal.timeout(30000),
    });
    const mime = response.headers.get("content-type") || "";
    const valid =
      response.status === 200 &&
      (/\.css(?:\?|$)/.test(path)
        ? mime.startsWith("text/css")
        : /^(?:application|text)\/javascript/.test(mime));
    await response.arrayBuffer();
    return { path: path.split("?")[0], status: response.status, mime, valid };
  }),
);
const favicon = await fetch(new URL("/favicon.ico", origin), {
  signal: AbortSignal.timeout(10000),
});
const faviconMime = favicon.headers.get("content-type") || "";
if (
  results.some((result) => !result.valid) ||
  favicon.status !== 200 ||
  !faviconMime.startsWith("image/")
) {
  console.error(
    JSON.stringify({
      assets: results,
      favicon: { status: favicon.status, mime: faviconMime },
    }),
  );
  process.exitCode = 1;
} else
  console.log(
    JSON.stringify({
      page: 200,
      css: results.filter((r) => r.mime.startsWith("text/css")).length,
      javascript: results.filter((r) => /javascript/.test(r.mime)).length,
      allReferencedAssetsOK: true,
      favicon: { status: favicon.status, mime: faviconMime },
    }),
  );
