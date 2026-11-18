import { deleteSystem, getSystem, saveSystem } from "@/lib/storage";
import { parseSystem } from "@/engine/system";

export async function GET(_req: Request, ctx: RouteContext<"/api/systems/[id]">) {
  const { id } = await ctx.params;
  try {
    return Response.json({ system: await getSystem(id) });
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
}

/** Save (and snapshot) a system. Body: { system, note? } */
export async function PUT(request: Request, ctx: RouteContext<"/api/systems/[id]">) {
  const { id } = await ctx.params;
  try {
    const body = await request.json();
    const system = parseSystem(body.system ?? body);
    if (system.meta.id !== id) return Response.json({ error: "Id mismatch" }, { status: 400 });
    const { version } = await saveSystem(system, body.note);
    return Response.json({ id, version });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/systems/[id]">) {
  const { id } = await ctx.params;
  try {
    await deleteSystem(id);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
