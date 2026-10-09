"use client";

import { Switch } from "@vaahansafe/ui";
import { SettingsSection } from "../primitives/SettingsSection";
import { SettingStatus } from "../primitives/SettingStatus";
import { updateNotificationPrefAction } from "@/lib/settings-actions";
import type {
  SettingsData,
  NotificationMatrixCategory,
  NotificationDeliveryChannel,
} from "@/lib/settings-types";
import { toast } from "sonner";
import { useCustomerMutation } from "@/lib/use-customer-mutation";

interface NotificationSettingsProps {
  data: SettingsData;
}

export function NotificationSettings({ data }: NotificationSettingsProps) {
  const categories = data.notifications;
  const mutation = useCustomerMutation(
    ({
      category,
      channel,
      enabled,
    }: {
      category: NotificationMatrixCategory;
      channel: NotificationDeliveryChannel;
      enabled: boolean;
    }) => updateNotificationPrefAction(category, channel, enabled),
    ["settings", "notifications", "shell"],
  );

  const handleToggle = async (
    categoryKey: NotificationMatrixCategory,
    channel: NotificationDeliveryChannel,
    currentValue: boolean,
  ) => {
    if (mutation.isPending) return;
    try {
      await mutation.mutateAsync({
        category: categoryKey,
        channel,
        enabled: !currentValue,
      });
      toast.success("Notification preference updated.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "We couldn't update this preference.",
      );
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground">
          Notifications
        </h1>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          Configure how you receive time-sensitive alerts, shipping milestones,
          and safety updates.
        </p>
      </div>

      <SettingsSection
        title="Delivery Channel Matrix"
        description="Choose preferred channels for each category. Required security messages cannot be disabled."
        cardClassName="p-4 sm:p-6"
        noDivide
      >
        {/* Table / Matrix Header */}
        <div className="hidden sm:grid grid-cols-12 gap-4 pb-2 border-b border-border/60 text-muted-foreground">
          <div className="col-span-6 font-mono text-[10px] uppercase tracking-wider">
            Category & Purpose
          </div>
          <div className="col-span-2 text-center font-mono text-[10px] uppercase tracking-wider">
            In-App
          </div>
          <div className="col-span-2 text-center font-mono text-[10px] uppercase tracking-wider">
            WhatsApp
          </div>
          <div className="col-span-2 text-center font-mono text-[10px] uppercase tracking-wider">
            Email
          </div>
        </div>

        {/* Matrix Rows */}
        <div className="divide-y divide-border/40">
          {categories.map((cat) => (
            <div
              key={cat.key}
              className="py-4 flex flex-col sm:grid sm:grid-cols-12 sm:items-center gap-4 transition-colors"
            >
              {/* Category Info */}
              <div className="sm:col-span-6 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {cat.label}
                  </span>
                  {cat.key === "SECURITY" && (
                    <SettingStatus status="REQUIRED" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {cat.description}
                </p>
              </div>

              {/* In-App Channel */}
              <div className="sm:col-span-2 flex sm:justify-center items-center justify-between">
                <span className="sm:hidden font-mono text-xs text-muted-foreground">
                  In-App:
                </span>
                <Switch
                  checked={cat.channels.IN_APP.enabled}
                  disabled={
                    mutation.isPending ||
                    cat.channels.IN_APP.disabledReason === "REQUIRED_SECURITY"
                  }
                  onCheckedChange={() =>
                    handleToggle(cat.key, "IN_APP", cat.channels.IN_APP.enabled)
                  }
                  aria-label={`${cat.label} In-App notifications`}
                />
              </div>

              {/* WhatsApp Channel */}
              <div className="sm:col-span-2 flex sm:justify-center items-center justify-between">
                <span className="sm:hidden font-mono text-xs text-muted-foreground">
                  WhatsApp:
                </span>
                <Switch
                  checked={cat.channels.WHATSAPP.enabled}
                  disabled={mutation.isPending}
                  onCheckedChange={() =>
                    handleToggle(
                      cat.key,
                      "WHATSAPP",
                      cat.channels.WHATSAPP.enabled,
                    )
                  }
                  aria-label={`${cat.label} WhatsApp notifications`}
                />
              </div>

              {/* Email Channel */}
              <div className="sm:col-span-2 flex sm:justify-center items-center justify-between">
                <span className="sm:hidden font-mono text-xs text-muted-foreground">
                  Email:
                </span>
                <Switch
                  checked={cat.channels.EMAIL.enabled}
                  disabled={
                    mutation.isPending ||
                    cat.channels.EMAIL.disabledReason === "REQUIRED_SECURITY"
                  }
                  onCheckedChange={() =>
                    handleToggle(cat.key, "EMAIL", cat.channels.EMAIL.enabled)
                  }
                  aria-label={`${cat.label} Email notifications`}
                />
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}
