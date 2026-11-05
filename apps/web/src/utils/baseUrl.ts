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

// 使用 jsDelivr 镜像加速静态资源加载
// 该前缀必须与 apps/web/public/ 的实际路径保持一致：
// 一旦调整 public 目录位置或重命名部署分支，必须同步修改此处与 index.html 中的首屏直链，
// 否则线上会继续命中旧资源（详见 apps/web/README.md「CDN 路径同步约束」）。
const CDN_BASE_URL =
  "https://cdn.jsdmirror.com/gh/MortisQAQ/personal-blog@master/apps/web/public/";

export const resolvePublicAsset = (assetPath: string) => {
  // 开发环境下仍使用本地路径，生产环境使用 CDN
  if (import.meta.env.DEV) {
    return `${BASE_URL}${assetPath.replace(/^\/+/, "")}`;
  }
  return `${CDN_BASE_URL}${assetPath.replace(/^\/+/, "")}`;
};
