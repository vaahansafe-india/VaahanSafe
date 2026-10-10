import { requireAdmin, assertSameOrigin } from "../../../../../../lib/session";
import { adminFailure } from "../../../../../../lib/api";
import { issuePrintArtifact } from "../../../../../../features/inventory/server/print-jobs";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const result = await issuePrintArtifact(
      await requireAdmin("inventory", { stepUp: true }),
      (await params).id,
    );
    return new Response(new Uint8Array(result.pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.reference}.pdf"`,
        "Cache-Control": "private, no-store, max-age=0",
        Pragma: "no-cache",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (e) {
    return adminFailure(e);
  }
}
