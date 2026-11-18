import { PreviewFrame } from "@/components/preview/shells";

export default function PreviewLayout({ children }: LayoutProps<"/preview">) {
  return <PreviewFrame>{children}</PreviewFrame>;
}
