import { requireAdminPage } from "../../lib/session";
import { MonitoringPanel } from "../../components/MonitoringPanel";
export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  await requireAdminPage("settings");
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
      <MonitoringPanel expanded />
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
            <p>10 minutes after verified email OTP</p>
          </div>
          <div className="admin-field">
            <label>Privileged identity</label>
            <p>Approved work email and password + email OTP</p>
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
