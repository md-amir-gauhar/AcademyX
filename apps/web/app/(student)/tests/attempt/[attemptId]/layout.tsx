import { AuthGuard } from "@/features/auth/auth-guard";

export default function AttemptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
