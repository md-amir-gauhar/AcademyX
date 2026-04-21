const required = (value: string | undefined, name: string) => {
  if (!value) {
    throw new Error(
      `Missing env var ${name}. Copy .env.example to .env.local and fill it in.`
    );
  }
  return value;
};

export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "https://api.queztlearn.com",
  orgSlug: process.env.NEXT_PUBLIC_ORG_SLUG ?? "acme-academy",
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "AcademyX",
};

export const assertBrowserEnv = () => {
  required(env.apiUrl, "NEXT_PUBLIC_API_URL");
  required(env.orgSlug, "NEXT_PUBLIC_ORG_SLUG");
};
