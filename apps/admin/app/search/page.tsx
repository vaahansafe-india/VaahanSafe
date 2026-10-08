import { VaahanIcon } from "@vaahansafe/icons";
import { requireAdminPage } from "../../lib/session";
import { canSearchPhone } from "../../lib/modules";
import { GlobalSearch } from "../../components/GlobalSearch";
export const dynamic = "force-dynamic";
export default async function SearchPage() {
  const identity = await requireAdminPage("search");
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <div className="admin-eyebrow">Workspace</div>
          <h1>One reference. A complete picture.</h1>
          <p>
            Search visible QR identities, batches, orders, vehicle
            registrations, customer references, support tickets and shipments.
          </p>
        </div>
        <span className="admin-tag">
          <VaahanIcon name="eye-off" size={12} />
          Permission-aware results
        </span>
      </div>
      <GlobalSearch phoneAllowed={canSearchPhone(identity.role)} />
    </>
  );
}
