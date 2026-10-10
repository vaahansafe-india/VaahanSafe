import { VaahanIcon } from "@vaahansafe/icons";
import { requireAdminPage } from "../../lib/session";
import { canSearchPhone } from "../../lib/modules";
import { OperationsSearchWorkspace } from "../../features/global-search/components/OperationsSearchWorkspace";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const identity = await requireAdminPage("search");

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <div className="admin-eyebrow">Workspace / Global Operations Search</div>
          <h1>One reference. A complete picture.</h1>
          <p>
            Find QR identities, vehicles, customers, orders, batches and custody records
            across VaahanSafe from one permission-aware workspace.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span className="admin-tag">
            <VaahanIcon name="eye-off" size={12} />
            Permission-aware
          </span>
          <span className="admin-tag">
            <VaahanIcon name="lock" size={12} />
            Audited sensitive lookup
          </span>
        </div>
      </div>
      <OperationsSearchWorkspace phoneAllowed={canSearchPhone(identity.role)} />
    </>
  );
}
