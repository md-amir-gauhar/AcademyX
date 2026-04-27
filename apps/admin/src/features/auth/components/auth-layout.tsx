import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthLayout({
  title,
  subtitle,
  icon,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[40%] left-[20%] h-[600px] w-[600px] rounded-full bg-primary/5 blur-[128px]" />
        <div className="absolute -bottom-[30%] right-[10%] h-[500px] w-[500px] rounded-full bg-primary/3 blur-[128px]" />
      </div>

      <Card className="relative w-full max-w-md border-border/50 bg-card/80 backdrop-blur-xl">
        <CardHeader className="text-center">
          {icon ?? (
            <h1 className="font-display text-3xl italic text-foreground">
              AcademyX
            </h1>
          )}
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </CardHeader>
        <CardContent>
          {children}
          {footer && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {footer}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
