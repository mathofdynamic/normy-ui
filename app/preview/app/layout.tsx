import { AppShell } from "@/components/preview/shells";

export default function AppLayout({ children }: LayoutProps<"/preview/app">) {
  return <AppShell>{children}</AppShell>;
}
