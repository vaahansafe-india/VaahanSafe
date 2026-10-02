import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getCustomerData } from "@/lib/customer-data-service";
import { CUSTOMER_QUERY_PARAMS, customerQuerySearch, type CustomerResource } from "@/lib/customer-query-contract";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };

export async function GET(request: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  if (!Object.hasOwn(CUSTOMER_QUERY_PARAMS, resource)) return NextResponse.json({ error: "Not found" }, { status: 404, headers });
  const started = performance.now();
  try {
    const auth = await getAuthenticatedCustomer();
    if (!auth) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401, headers });
    const authenticated = performance.now();
    const query = customerQuerySearch(resource as CustomerResource, request.nextUrl.search);
    const data = await getCustomerData(resource as CustomerResource, auth, new URLSearchParams(query));
    return NextResponse.json({ scope: `${auth.user.id}:${auth.session.id}`, data }, { headers: {
      ...headers, "Server-Timing": `auth;dur=${(authenticated - started).toFixed(1)}, data;dur=${(performance.now() - authenticated).toFixed(1)}`,
    } });
  } catch {
    console.error("[Customer data] Query failed", { resource });
    return NextResponse.json({ error: "We couldn't load this information. Please try again." }, { status: 503, headers });
  }
}
