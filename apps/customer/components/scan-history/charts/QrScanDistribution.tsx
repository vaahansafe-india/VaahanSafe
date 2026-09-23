"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@vaahansafe/ui";
import { VaahanIcon } from "@vaahansafe/icons";
import type { QrDistributionItem } from "@/lib/scan-history-types";

interface QrScanDistributionProps {
  data: QrDistributionItem[];
  onSelectQr?: (qrPublicId: string) => void;
}

function QrTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0]?.payload as QrDistributionItem;
  if (!item) return null;

  return (
    <div className="rounded-xl border border-border bg-card/95 p-3 text-card-foreground shadow-xl text-left space-y-1 min-w-[170px] pointer-events-none backdrop-blur-md">
      <div className="font-semibold text-xs text-foreground truncate">
        {item.vehicleName}
      </div>
      <div className="font-mono text-[10px] text-muted-foreground">
        {item.publicId} &bull; {item.vehiclePlate}
      </div>
      <div className="flex items-baseline justify-between pt-1 border-t border-border/60">
        <span className="text-[11px] text-muted-foreground">Encounters:</span>
        <span className="font-mono text-sm font-bold text-primary">
          {item.scanCount} ({item.percentage}%)
        </span>
      </div>
    </div>
  );
}

export function QrScanDistribution({ data, onSelectQr }: QrScanDistributionProps) {
  // If only one QR exists, render the refined Current QR Activity summary (Rule 18)
  if (data.length <= 1) {
    const single = data[0];
    return (
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4 flex flex-col justify-between">
        <div className="space-y-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            QR Identity Context
          </div>
          <h3 className="font-serif text-lg font-medium text-foreground">
            Current QR Activity
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Single active safety pass identity linked to your vehicle account.
          </p>
        </div>

        {single ? (
          <div className="rounded-xl border border-border/80 bg-background/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <VaahanIcon name="qr-code" size={18} />
                </span>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {single.vehicleName}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {single.vehiclePlate}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/30">
                {single.publicId}
              </Badge>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs font-mono">
              <span className="text-muted-foreground">Period Encounters</span>
              <span className="text-base font-bold text-foreground">
                {single.scanCount}
              </span>
            </div>
          </div>
        ) : (
          <div className="h-[140px] flex items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 text-center p-4">
            <p className="text-xs text-muted-foreground font-mono">
              No QR distribution data available.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Multiple QRs: Horizontal BarChart
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
          Scan Distribution
        </div>
        <h3 className="font-serif text-lg font-medium text-foreground">
          QR Identity Encounters
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Relative encounter density across your registered vehicle safety passes.
        </p>
      </div>

      <div className="space-y-3">
        <div className="h-[140px] w-full outline-none focus:outline-none focus-visible:outline-none [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%" className="outline-none focus:outline-none focus-visible:outline-none">
            <BarChart
              data={data}
              className="outline-none focus:outline-none focus-visible:outline-none select-none"
              layout="vertical"
              margin={{ top: 4, right: 30, left: 10, bottom: 4 }}
              barCategoryGap="20%"
            >
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                fontSize={9}
                fontFamily="JetBrains Mono, monospace"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="vehicleName"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                fontFamily="Inter, sans-serif"
                tickLine={false}
                axisLine={false}
                width={85}
              />
              <Tooltip content={<QrTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
              <Bar
                dataKey="scanCount"
                fill="#CC785C"
                radius={[0, 4, 4, 0]}
                isAnimationActive={true}
                animationDuration={600}
                onClick={(item: any) => {
                  if (item?.rawPublicId) onSelectQr?.(item.rawPublicId);
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Identity pills list */}
        <div className="space-y-1.5 pt-2 border-t border-border/50">
          {data.map((item) => (
            <button
              key={item.qrId}
              type="button"
              onClick={() => onSelectQr?.(item.rawPublicId)}
              className="w-full flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="font-medium text-foreground truncate">{item.vehicleName}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{item.publicId}</span>
              </div>
              <span className="font-mono font-bold text-foreground shrink-0 ml-2">
                {item.scanCount}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
