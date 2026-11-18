import { getVersion } from "@/lib/storage";

export async function GET(_req: Request, ctx: RouteContext<"/api/systems/[id]/versions/[version]">) {
  const { id, version } = await ctx.params;
  try {
    return Response.json({ system: await getVersion(id, version) });
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
}
