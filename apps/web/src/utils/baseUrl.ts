const normalizeBaseUrl = (baseUrl: string) => {
  if (!baseUrl) {
    return "/";
  }
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
};

const resolveRuntimeBaseUrl = (configuredBaseUrl: string) => {
  if (typeof window === "undefined") {
    return configuredBaseUrl;
  }
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.endsWith(".github.io")) {
    return configuredBaseUrl;
  }
  if (configuredBaseUrl === "/") {
    return "/";
  }
  return window.location.pathname.startsWith(configuredBaseUrl)
    ? configuredBaseUrl
    : "/";
};

export const BASE_URL = resolveRuntimeBaseUrl(
  normalizeBaseUrl(import.meta.env.BASE_URL),
);

// 站内静态资源一律同源解析（GitHub Pages 的子路径由 BASE_URL 提供）。
// 这里不要写死任何 CDN 前缀：一旦 URL 里带上 GitHub 所有者/仓库名或自定义域名，
// 换账号、改仓库名、换部署域名都会让全站图片静默 404，而代码里看不出问题。
// 需要加速时应在部署层（自定义域名 / CDN 回源）解决，不要写进构建期常量。
export const resolvePublicAsset = (assetPath: string) =>
  `${BASE_URL}${assetPath.replace(/^\/+/, "")}`;
