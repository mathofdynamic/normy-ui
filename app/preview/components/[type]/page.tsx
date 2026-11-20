import { Suspense } from "react";
import { ComponentDetail } from "@/components/preview/component-views";
import { COMPONENTS } from "@/engine/components";

export function generateStaticParams() {
  return COMPONENTS.map((c) => ({ type: c.type }));
}

async function Detail({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  return <ComponentDetail type={type} />;
}

export default function ComponentPage({ params }: { params: Promise<{ type: string }> }) {
  return (
    <Suspense>
      <Detail params={params} />
    </Suspense>
  );
}
