export interface OrgTheme {
  primary?: string;
  secondary?: string;
  accent?: string;
  mode?: "light" | "dark";
}

export interface OrgFeaturesEnabled {
  testSeries?: boolean;
  liveClasses?: boolean;
  community?: boolean;
  practice?: boolean;
  subscriptions?: boolean;
  [key: string]: boolean | undefined;
}

export interface OrgConfig {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  domain?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  supportEmail?: string | null;
  currency?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  bannerUrls?: string[] | null;
  theme?: OrgTheme | null;
  motto?: string | null;
  description?: string | null;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  features?: Array<{ title: string; description?: string; icon?: string }> | null;
  testimonials?: Array<{
    name: string;
    role?: string;
    quote: string;
    avatarUrl?: string;
  }> | null;
  faq?: Array<{ q: string; a: string }> | null;
  socialLinks?: Record<string, string> | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
  featuresEnabled?: OrgFeaturesEnabled | null;
  maintenanceMode?: boolean;
  customCSS?: string | null;
  customJS?: string | null;
}
