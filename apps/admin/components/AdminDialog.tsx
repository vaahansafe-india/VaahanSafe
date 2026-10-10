"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@vaahansafe/ui/components/dialog";
export function AdminDialog({
  title,
  onClose,
  children,
  description,
  footer,
  className = "",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  description?: string;
  footer?: React.ReactNode;
  className?: string;
}) {
  const [returnFocus] = useState(() =>
    typeof document !== "undefined" &&
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className={`admin-dialog admin-radix-dialog ${className}`}
        {...(description ? {} : { "aria-describedby": undefined })}
        onCloseAutoFocus={(event) => {
          if (returnFocus?.isConnected) {
            event.preventDefault();
            returnFocus.focus();
          }
        }}
      >
        <header className="admin-dialog-header">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </header>
        <div
          className="admin-dialog-body"
          role="region"
          aria-label={`${title} contents`}
          tabIndex={0}
        >
          {children}
        </div>
        {footer && <footer className="admin-dialog-footer">{footer}</footer>}
      </DialogContent>
    </Dialog>
  );
}
