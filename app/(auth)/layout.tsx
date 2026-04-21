import Image from "next/image";
import { GradientOrb } from "@/components/brand/gradient-orb";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { GuestGuard } from "@/features/auth/guest-guard";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GuestGuard>
    <div className="relative min-h-screen lg:grid lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-gradient-brand lg:block">
        <GradientOrb color="violet" size="xl" className="-top-20 left-1/2 -translate-x-1/2 opacity-80" />
        <GradientOrb color="sky" size="lg" className="-bottom-20 -right-10 opacity-60" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div>
            <Logo textClassName="text-white" />
          </div>

          <div className="space-y-8">
            <blockquote className="space-y-5">
              <p className="text-balance text-2xl font-semibold leading-snug xl:text-3xl">
                &ldquo;I used to juggle five apps. AcademyX replaced all of them and my rank jumped 2,000 places in one term.&rdquo;
              </p>
              <footer className="flex items-center gap-3 text-sm">
                <Image
                  src="https://i.pravatar.cc/80?img=47"
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full border-2 border-white/30 object-cover"
                  unoptimized
                />
                <div>
                  <div className="font-semibold">Aditi Sharma</div>
                  <div className="text-white/70">JEE Advanced aspirant</div>
                </div>
              </footer>
            </blockquote>

            <div className="grid grid-cols-3 gap-4 text-sm">
              {[
                { value: "240k+", label: "Active learners" },
                { value: "4.9★", label: "App rating" },
                { value: "1,200+", label: "Live mentors" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl bg-white/10 p-4 backdrop-blur"
                >
                  <div className="text-xl font-semibold">{s.value}</div>
                  <div className="text-xs text-white/75">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex min-h-screen flex-col">
        <header className="flex items-center justify-between p-5 lg:p-6">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center px-5 pb-12 pt-4 sm:px-8">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
    </GuestGuard>
  );
}
