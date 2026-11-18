import { listVersions } from "@/lib/storage";

export async function GET(_req: Request, ctx: RouteContext<"/api/systems/[id]/versions">) {
  const { id } = await ctx.params;
  try {
    return Response.json({ versions: await listVersions(id) });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
