import { SettingsSkeleton } from "@/components/settings/states/SettingsSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-pulse motion-reduce:animate-none">
      {/* Editorial Header */}
      <div className="pb-2 space-y-2">
        <Skeleton className="h-2.5 w-32 bg-[#cc785c]/30 rounded-sm" />
        <Skeleton className="h-8 w-44 bg-muted rounded-md" />
        <Skeleton className="h-3.5 w-80 max-w-full bg-muted/60 rounded-sm" />
      </div>

      <SettingsSkeleton />
    </div>
  );
}
