"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
} from "@vaahansafe/ui";
import { updateUserNameAction } from "@/lib/settings-actions";
import { toast } from "sonner";

interface EditNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  onSuccess: (newName: string) => void;
}

export function EditNameDialog({
  open,
  onOpenChange,
  currentName,
  onSuccess,
}: EditNameDialogProps) {
  const [name, setName] = React.useState(currentName);
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setName(currentName);
    setError(null);
  }, [currentName, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }

    startTransition(async () => {
      const res = await updateUserNameAction(trimmed);
      if (res.success) {
        toast.success("Name updated.");
        onSuccess(trimmed);
        onOpenChange(false);
      } else {
        setError(res.error);
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg font-medium text-foreground">
            Edit Full Name
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Your name is displayed on your account and can optionally appear in your public vehicle safety view.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="full-name-input" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Full Name
            </Label>
            <Input
              id="full-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              disabled={isPending}
              maxLength={80}
              className="h-9 text-sm"
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || name.trim() === currentName}
              className="bg-[#cc785c] hover:bg-[#b8674d] text-white"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
