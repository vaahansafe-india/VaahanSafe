import { adminFailure, adminResponse } from "../../../../../lib/api";
import {
  AdminError,
  assertSameOrigin,
  requireAdmin,
} from "../../../../../lib/session";
import { canManageRetailers } from "../../../../../features/retailers/retailer.filters";
import {
  retailerRpc,
  validRetailerId,
  parseRetailerCursor,
  pageOf,
} from "../../../../../features/retailers/server/retailers";
import {
  retailSaleSchema,
  normalizeSaleCode,
  type RetailSale,
  type SaleOption,
} from "../../../../../features/retailers/retail-sale.schema";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const identity = await requireAdmin("retailers"),
      id = validRetailerId((await params).id),
      p = new URL(request.url).searchParams;
    if (p.get("section") === "history")
      return adminResponse(
        pageOf(
          await retailerRpc<RetailSale[]>(
            identity,
            "admin_retail_sale_history",
            { p_id: id, p_cursor: parseRetailerCursor(p.get("cursor")) },
          ),
          20,
        ),
      );
    if (!canManageRetailers(identity.role))
      throw new AdminError(
        403,
        "FORBIDDEN",
        "Your role can view sales but cannot record them.",
      );
    const q = normalizeSaleCode(p.get("q") || ""),
      after = p.get("after");
    if (q.length > 100 || (after && !/^VS-[A-Z0-9-]{4,90}$/.test(after)))
      throw new AdminError(
        400,
        "INVALID_REQUEST",
        "Search with a visible VaahanSafe ID.",
      );
    const rows = await retailerRpc<SaleOption[]>(
      identity,
      "admin_retail_sale_options",
      { p_id: id, p_q: q, p_after: after },
    );
    return adminResponse({
      rows: rows.slice(0, 50),
      nextCursor: rows.length > 50 ? rows[49]!.visible_code : null,
    });
  } catch (e) {
    return adminFailure(e);
  }
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin("retailers", { stepUp: true });
    if (!canManageRetailers(identity.role))
      throw new AdminError(
        403,
        "FORBIDDEN",
        "Your role cannot record retail sales.",
      );
    const raw = await request.text();
    if (raw.length > 20000)
      throw new AdminError(
        413,
        "TOO_LARGE",
        "Record up to 100 stickers per sale.",
      );
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      throw new AdminError(
        400,
        "INVALID_REQUEST",
        "Review the sale details and try again.",
      );
    }
    const parsed = retailSaleSchema.safeParse(body);
    if (!parsed.success)
      throw new AdminError(
        400,
        "INVALID_SALE",
        "Choose up to 100 unique stickers, a receipt reference and a reason of at least 10 characters.",
      );
    const b = parsed.data;
    return adminResponse(
      {
        id: await retailerRpc<string>(identity, "admin_record_retail_sale", {
          p_id: validRetailerId((await params).id),
          p_codes: b.codes,
          p_receipt: b.receipt,
          p_reason: b.reason,
          p_request: b.requestId,
        }),
      },
      201,
    );
  } catch (e) {
    return adminFailure(e);
  }
}
