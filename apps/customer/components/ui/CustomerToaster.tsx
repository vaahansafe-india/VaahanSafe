"use client";

import { Toaster } from "sonner";
import { VaahanIcon } from "@vaahansafe/icons";

export function CustomerToaster() {
  return (
    <Toaster
      theme="light"
      position="bottom-right"
      closeButton
      duration={5000}
      visibleToasts={3}
      gap={12}
      offset={24}
      mobileOffset={{
        left: 16,
        right: 16,
        bottom: "max(24px, env(safe-area-inset-bottom))",
      }}
      containerAriaLabel="Account notifications"
      icons={{
        success: <VaahanIcon name="success" size={20} />,
        info: <VaahanIcon name="info" size={20} />,
        warning: <VaahanIcon name="warning" size={20} />,
        error: <VaahanIcon name="error" size={20} />,
        loading: (
          <VaahanIcon
            name="loading-02"
            size={20}
            className="animate-spin motion-reduce:animate-none"
          />
        ),
        close: <VaahanIcon name="close" size={16} />,
      }}
      toastOptions={{
        closeButtonAriaLabel: "Dismiss notification",
        classNames: {
          toast: "customer-toast",
          title: "customer-toast-title",
          description: "customer-toast-description",
          icon: "customer-toast-icon",
          closeButton: "customer-toast-close",
          actionButton: "customer-toast-action",
          cancelButton: "customer-toast-cancel",
        },
      }}
    />
  );
}
