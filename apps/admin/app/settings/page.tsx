import { VaahanIcon } from "@vaahansafe/icons";
import { requireAdminPage } from "../../lib/session";
import { checkConnections } from "../../lib/operations";
export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  await requireAdminPage("settings");
  const connections = await checkConnections();
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <div className="admin-eyebrow">Platform administration</div>
          <h1>System settings</h1>
          <p>
            Connection checks and access policy for the operations workspace.
          </p>
        </div>
        <span className="admin-tag">Server-side configuration</span>
      </div>
      <div className="admin-connection-list">
        {connections.map((c) => (
          <div className="admin-connection-card" key={c.name}>
            <VaahanIcon name="server" size={20} />
            <h3>{c.name}</h3>
            <span
              className={`admin-tag ${c.state === "connected" ? "" : "warning"}`}
            >
              {c.state === "connected"
                ? c.name.includes("database") || c.name.includes("R2")
                  ? "Connection verified"
                  : "Configured"
                : "Needs attention"}
            </span>
            <p>
              {c.name.includes("database") || c.name.includes("R2")
                ? "Live read-only connection probe. No production records were changed."
                : "Configuration presence check. Provider delivery is verified when the corresponding workflow runs."}
            </p>
          </div>
        ))}
      </div>
      <section className="admin-panel" style={{ marginTop: 24 }}>
        <div className="admin-panel-head">
          <h2>Administrative access policy</h2>
        </div>
        <div className="admin-panel-body admin-detail-grid">
          <div className="admin-field">
            <label>Session duration</label>
            <p>4 hours · fixed expiry · revocable</p>
          </div>
          <div className="admin-field">
            <label>Step-up window</label>
            <p>10 minutes after verified mobile OTP</p>
          </div>
          <div className="admin-field">
            <label>Privileged identity</label>
            <p>Approved email and password + verified mobile</p>
          </div>
          <div className="admin-field">
            <label>Credential storage</label>
            <p>Server configuration and HttpOnly cookies</p>
          </div>
        </div>
      </section>
    </>
  );
}
