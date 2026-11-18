import { LandingShell } from "@/components/preview/shells";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <LandingShell>{children}</LandingShell>;
}
