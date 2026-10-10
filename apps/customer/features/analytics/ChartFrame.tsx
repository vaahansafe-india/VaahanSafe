"use client";
import { Component, useEffect, useState, type ReactNode } from "react";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
export type DataRow = Record<string, string | number | null>;
export function IconAction({
  icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: VaahanIconName;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={label}
          onClick={onClick}
          disabled={disabled}
        >
          <VaahanIcon name={icon} size={15} />
        </Button>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent>{label}</TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );
}
export function Help({ text }: { text: string }) {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="About this metric"
            >
              <VaahanIcon name="info" size={15} />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent className="max-w-72">{text}</TooltipContent>
        </TooltipPortal>
      </Tooltip>
      <PopoverContent className="max-w-[calc(100vw-2rem)] text-sm">
        {text}
      </PopoverContent>
    </Popover>
  );
}
class ChartBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div role="alert" className="analytics-empty">
        This visualization couldn’t be displayed. The data table is still
        available.
        <Button
          variant="outline"
          onClick={() => this.setState({ failed: false })}
        >
          Try again
        </Button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export function ChartFrame({
  title,
  description,
  summary,
  source,
  loading,
  error,
  retry,
  empty,
  rows = [],
  action,
  skeleton,
  mobileExpand = false,
  expandedClassName = "",
  children,
}: {
  title: string;
  description: string;
  summary?: string;
  source: string;
  loading?: boolean;
  error?: boolean;
  retry?: () => void;
  empty?: string;
  rows?: DataRow[];
  action?: ReactNode;
  skeleton?: ReactNode;
  mobileExpand?: boolean;
  expandedClassName?: string;
  children?: ReactNode;
}) {
  const [table, setTable] = useState(false),
    [expanded, setExpanded] = useState(false);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    if (!mobileExpand) return;
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [mobileExpand]);
  return (
    <TooltipProvider delayDuration={200}>
      <section
        className="analytics-frame"
        aria-label={title}
        aria-busy={loading}
      >
        <header className="analytics-chart-header">
          <div className="analytics-chart-header-top">
            <div className="analytics-chart-header-left">
              <h2 className="analytics-chart-title">{title}</h2>
            </div>
            <div className="analytics-chart-actions">
              {action && (
                <div className="analytics-chart-action-control">
                  {action}
                </div>
              )}
              <div className="analytics-chart-icon-actions">
                <Help text={source} />
                {rows.length > 0 && (
                  <>
                    <IconAction
                      icon="list"
                      label={`View ${title} data`}
                      onClick={() => setTable(true)}
                    />
                    <IconAction
                      icon="fullscreen"
                      label={`Expand ${title}`}
                      onClick={() => setExpanded(true)}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
          {description && (
            <p className="analytics-chart-description">{description}</p>
          )}
          {summary && <p className="analytics-chart-summary">{summary}</p>}
        </header>
        {error ? (
          <div role="alert" className="analytics-empty">
            We couldn’t load this activity.
            <Button variant="outline" onClick={retry}>
              Retry
            </Button>
          </div>
        ) : loading && !rows.length ? (
          skeleton || (
            <div className="analytics-chart-skeleton" role="status">
              Loading {title.toLowerCase()}…
            </div>
          )
        ) : empty ? (
          <div className="analytics-empty">{empty}</div>
        ) : (
          <div
            className={`analytics-chart-body${loading ? " opacity-60" : ""}`}
          >
            <ChartBoundary>{children}</ChartBoundary>
          </div>
        )}
        <Dialog open={table} onOpenChange={setTable}>
          <DialogContent className="sm:max-w-3xl max-h-[85dvh] overflow-auto">
            <DialogHeader>
              <DialogTitle>{title} data</DialogTitle>
              <DialogDescription>{source}</DialogDescription>
            </DialogHeader>
            <div className="overflow-x-auto">
              <table className="analytics-table">
                <caption className="sr-only">{description}</caption>
                <thead>
                  <tr>
                    {Object.keys(rows[0] || {}).map((k) => (
                      <th key={k}>{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((v, j) => (
                        <td key={j}>{v ?? "Not recorded"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>
        {mobileExpand && mobile ? (
          <Sheet open={expanded} onOpenChange={setExpanded}>
            <SheetContent
              className={`analytics-expanded-sheet ${expandedClassName}`}
            >
              <SheetHeader>
                <SheetTitle>{title}</SheetTitle>
                <SheetDescription>
                  {description} {summary}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-5">
                <ChartBoundary>{children}</ChartBoundary>
              </div>
              <p className="text-xs text-muted-foreground mt-5">{source}</p>
            </SheetContent>
          </Sheet>
        ) : (
          <Dialog open={expanded} onOpenChange={setExpanded}>
            <DialogContent
              className={`sm:max-w-6xl max-h-[95dvh] overflow-auto ${expandedClassName}`}
            >
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>
                  {description} {summary}
                </DialogDescription>
              </DialogHeader>
              <ChartBoundary>{children}</ChartBoundary>
              <p className="text-xs text-muted-foreground">{source}</p>
            </DialogContent>
          </Dialog>
        )}
      </section>
    </TooltipProvider>
  );
}
