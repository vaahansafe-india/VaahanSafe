import React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { ADMIN_MODULES, canReadModule, type AdminRole } from "../../../lib/modules";

export interface QuickAccessProps {
  role: AdminRole;
}

export function QuickAccess({ role }: QuickAccessProps) {
  const allowedModules = [
    "inventory",
    "batches",
    "shipping",
    "orders",
    "support",
    "vehicles",
    "customers",
    "reports",
    "incidents",
    "audit",
  ]
    .filter((key) => canReadModule(role, key))
    .map((key) => ADMIN_MODULES.find((m) => m.key === key)!)
    .filter(Boolean);

  if (allowedModules.length === 0) return null;

  return (
    <section className="command-panel quick-access-panel" aria-label="Quick Access Workspaces">
      <div className="command-panel-head">
        <div className="panel-head-title-wrap">
          <h2 className="command-panel-title">QUICK ACCESS WORKSPACES</h2>
          <span className="panel-head-subtitle">One-click operational navigation</span>
        </div>
      </div>

      <div className="command-panel-body quick-access-body">
        <div className="quick-access-grid">
          {allowedModules.map((m) => (
            <Link
              key={m.key}
              href={`/${m.key}`}
              className="quick-access-chip"
              title={m.description}
            >
              <div className="quick-chip-icon" aria-hidden="true">
                <VaahanIcon name={m.icon} size={16} />
              </div>
              <div className="quick-chip-info">
                <strong className="quick-chip-title">{m.label}</strong>
              </div>
              <span className="quick-chip-arrow" aria-hidden="true">
                <VaahanIcon name="arrow-right" size={12} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
