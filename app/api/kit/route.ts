import { buildKit } from "@/lib/kit";
import { getSystem } from "@/lib/storage";
import { zip } from "@/lib/zip";
import { kitInfo } from "@/engine/kit/docs";
import { parseSystem } from "@/engine/system";
import type { DesignSystem } from "@/engine/types";

/* Agent Kit download. POST { system } (the Studio's current, possibly unsaved system) or GET ?id=<saved id>. */

async function respond(system: DesignSystem, attachment: boolean) {
  const files = await buildKit(system);
  const body = zip(files);
  const { slug } = kitInfo(system);
  return new Response(body as unknown as BodyInit, {
    headers: {
      "content-type": "application/zip",
      // Only for direct links: fetch() callers (the Studio) name the file themselves.
      ...(attachment ? { "content-disposition": `attachment; filename="${slug}-agent-kit.zip"` } : {}),
      "x-normy-files": String(Object.keys(files).length),
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return await respond(parseSystem(body.system ?? body), false);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Pass ?id=<system id>" }, { status: 400 });
  try {
    return await respond(await getSystem(id), true);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 404 });
  }
}
