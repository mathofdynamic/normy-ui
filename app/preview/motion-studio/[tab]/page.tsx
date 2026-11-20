import { Suspense } from "react";
import { MOTION_TABS } from "@/components/preview/motion-list";
import { MotionWorkspace } from "@/components/preview/motion-workspace";

export function generateStaticParams() {
  return MOTION_TABS.map((t) => ({ tab: t.id }));
}

async function Tab({ params }: { params: Promise<{ tab: string }> }) {
  const { tab } = await params;
  return <MotionWorkspace tab={tab} />;
}

export default function MotionTabPage({ params }: { params: Promise<{ tab: string }> }) {
  return (
    <Suspense>
      <Tab params={params} />
    </Suspense>
  );
}
