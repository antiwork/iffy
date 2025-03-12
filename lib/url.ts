export const getAbsoluteUrl = (path?: string) => {
  let baseUrl: string;
  if (typeof window !== "undefined") {
    baseUrl = window.location.origin;
  } else if (
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production" &&
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
  ) {
    baseUrl = `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`;
  } else if (process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" && process.env.NEXT_PUBLIC_VERCEL_URL) {
    baseUrl = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  } else {
    baseUrl = "http://localhost:3000";
  }

  if (path) {
    return new URL(path, baseUrl).toString();
  }

  return baseUrl;
};

export const formatLink = (url: string) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    return url;
  }
};
