import { exists, listSystems, saveSystem } from "@/lib/storage";
import { parseSystem } from "@/engine/system";

/** GET: list saved systems. POST: create (fails if the id exists unless ?overwrite=1). */
export async function GET() {
  return Response.json({ systems: await listSystems() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const system = parseSystem(body.system ?? body);
    const overwrite = new URL(request.url).searchParams.get("overwrite") === "1";
    if (!overwrite && (await exists(system.meta.id))) return Response.json({ error: `A system with id "${system.meta.id}" already exists.` }, { status: 409 });
    const { version } = await saveSystem(system, body.note ?? "created");
    return Response.json({ id: system.meta.id, version }, { status: 201 });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
