import Link from "next/link";
import Image from "next/image";
import { VaahanIcon } from "@vaahansafe/icons";
import { requireAdminPage } from "../lib/session";
import {
  checkConnections,
  dashboardMetrics,
  listAdminRecords,
} from "../lib/operations";
import { canReadModule, ADMIN_MODULES } from "../lib/modules";
import { RecordTable } from "../components/RecordTable";
export const dynamic = "force-dynamic";
export default async function AdminDashboardPage() {
  const identity = await requireAdminPage("dashboard");
  const [metrics, connections] = await Promise.all([
    dashboardMetrics(identity),
    checkConnections(),
  ]);
  const workKey = canReadModule(identity.role, "orders")
    ? "orders"
    : canReadModule(identity.role, "inventory")
      ? "inventory"
      : canReadModule(identity.role, "incidents")
        ? "incidents"
        : null;
  let work = null;
  let workError = false;
  if (workKey) {
    try {
      work = await listAdminRecords(identity, workKey);
    } catch {
      workError = true;
    }
  }
  const shortcutKeys = [
    "inventory",
    "batches",
    "shipping",
    "support",
    "articles",
    "incidents",
    "reports",
  ]
    .filter((key) => canReadModule(identity.role, key))
    .slice(0, 4);
  const now = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date());
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <div className="admin-eyebrow">
            <span className="status-dot" />
            Operations overview
          </div>
          <h1>A clearer view of every journey.</h1>
          <p>
            Monitor identities, keep operations moving, and bring care to every
            decision.
          </p>
        </div>
        <div className="admin-actions">
          <span className="admin-tag neutral">
            <VaahanIcon name="calendar" size={12} />
            {now}
          </span>
          <Link href="/" className="admin-button">
            <VaahanIcon name="refresh" size={14} />
            Refresh
          </Link>
        </div>
      </div>
      <section className="admin-hero" data-aos="fade-up">
        <div className="admin-hero-copy">
          <div className="admin-eyebrow">Safety, thoughtfully managed</div>
          <h2>Every identity. One accountable workspace.</h2>
          <p>
            From the first printed sticker to a safer journey, your team has a
            shared view of the records that matter.
          </p>
          <Link className="admin-link" href="/search">
            Find an operational record{" "}
            <VaahanIcon name="arrow-right" size={14} />
          </Link>
        </div>
        <Image
          src="/images/operations-paper.png"
          alt=""
          width={400}
          height={267}
          className="admin-hero-art"
          priority
        />
      </section>
      {metrics.length > 0 && (
        <div className="admin-metrics">
          {metrics.map((m, i) => (
            <Link
              href={m.href}
              key={m.label}
              className="admin-metric"
              data-aos="fade-up"
              data-aos-delay={i * 50}
            >
              <div className="admin-metric-top">
                <span>{m.label}</span>
                <VaahanIcon name="arrow-right" size={13} />
              </div>
              <div className="admin-metric-value">
                {m.value === null ? "—" : m.value.toLocaleString("en-IN")}
              </div>
              <p>{m.detail}</p>
            </Link>
          ))}
        </div>
      )}
      <div className="admin-grid">
        <div>
          <section className="admin-panel" data-aos="fade-up">
            <div className="admin-panel-head">
              <div>
                <h2>
                  {workKey
                    ? `Recent ${ADMIN_MODULES.find((m) => m.key === workKey)?.label.toLowerCase()}`
                    : "Your editorial workspace"}
                </h2>
                <p>Latest authoritative records</p>
              </div>
              {workKey && (
                <Link className="admin-link" href={`/${workKey}`}>
                  View all <VaahanIcon name="arrow-right" size={13} />
                </Link>
              )}
            </div>
            {workError ? (
              <div className="admin-empty">
                <VaahanIcon name="alert" size={26} />
                <h3>Records are temporarily unavailable</h3>
                <p>
                  Refresh to try again. Your workspace remains securely locked
                  to your role.
                </p>
              </div>
            ) : work?.rows.length ? (
              <RecordTable
                rows={work.rows.slice(0, 5)}
                fields={
                  ADMIN_MODULES.find((m) => m.key === workKey)
                    ?.fields?.filter(
                      (k) =>
                        ![
                          "id",
                          "batch_id",
                          "lifecycle_state",
                          "paid_at",
                        ].includes(k),
                    )
                    .slice(0, 5) || []
                }
              />
            ) : (
              <div className="admin-empty">
                <VaahanIcon name="file" size={28} />
                <h3>
                  {workKey ? "No records yet" : "Ready for your next story"}
                </h3>
                <p>
                  {workKey
                    ? "New records will appear here as they enter the platform."
                    : "Open the Blog CMS to create and manage VaahanSafe Journal content."}
                </p>
              </div>
            )}
          </section>
          <div className="admin-section-label">Workspace shortcuts</div>
          <div className="admin-detail-grid">
            {shortcutKeys.map((key) => {
              const m = ADMIN_MODULES.find((m) => m.key === key)!;
              return (
                <Link className="admin-shortcut" key={key} href={`/${key}`}>
                  <VaahanIcon name={m.icon} size={20} />
                  <span>
                    <strong>{m.label}</strong>
                    <small>Open workspace</small>
                  </span>
                  <VaahanIcon
                    name="arrow-right"
                    size={13}
                    className="ml-auto"
                  />
                </Link>
              );
            })}
          </div>
        </div>
        <div>
          <section className="admin-panel" data-aos="fade-up">
            <div className="admin-panel-head">
              <div>
                <h2>Service connections</h2>
                <p>Checked on this request</p>
              </div>
              <VaahanIcon name="server" size={16} />
            </div>
            <div className="admin-panel-body">
              {connections.slice(0, 2).map((c) => (
                <div className="admin-health-row" key={c.name}>
                  <span>
                    <strong>{c.name}</strong>
                    <small>Live connectivity check</small>
                  </span>
                  <span
                    className={`admin-tag ${c.state === "connected" ? "" : "warning"}`}
                  >
                    {c.state === "connected" ? "Connected" : "Unavailable"}
                  </span>
                </div>
              ))}
              <div className="admin-health-row">
                <span>
                  <strong>Administrative access</strong>
                  <small>Verified mobile · role enforced</small>
                </span>
                <span className="admin-tag">Protected</span>
              </div>
            </div>
          </section>
          <section
            className="admin-panel"
            style={{ marginTop: 20 }}
            data-aos="fade-up"
          >
            <div className="admin-panel-head">
              <div>
                <h2>Care in every action</h2>
                <p>Built into your workspace</p>
              </div>
              <VaahanIcon name="eye-off" size={16} />
            </div>
            <div className="admin-panel-body">
              <p
                style={{
                  fontSize: 10,
                  color: "#8a947f",
                  lineHeight: 2,
                  margin: 0,
                }}
              >
                Sensitive information is masked by default. Inventory changes
                require a preview and reason. High-risk actions require fresh
                verification.
              </p>
              {canReadModule(identity.role, "audit") && (
                <Link
                  className="admin-link"
                  href="/audit"
                  style={{ marginTop: 18 }}
                >
                  Review the audit trail{" "}
                  <VaahanIcon name="arrow-right" size={13} />
                </Link>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
