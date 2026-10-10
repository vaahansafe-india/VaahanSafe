"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useCustomerScope } from "@/components/query/CustomerQueryProvider";
import { VaahanIcon } from "@vaahansafe/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@vaahansafe/ui/lib/utils";
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
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { VaultIconButton } from "./VaultIconButton";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@vaahansafe/ui/components/alert-dialog";
import {
  CATEGORIES,
  sizeLabel,
  validity,
  type VaultPage,
  type VaultDocument,
  type DocumentDetail,
} from "./model";
import { vaultRequest } from "./client";
import { UploadDocumentDialog } from "./UploadDocumentDialog";
import { DocumentActivityTimeline } from "./DocumentActivityTimeline";
const Viewer = dynamic(
  () => import("./DocumentViewer").then((m) => m.DocumentViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[300px] sm:min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl border border-border/80 bg-background shadow-xs mb-3">
          <VaahanIcon
            name="loading-02"
            size={28}
            className="animate-spin text-[#cc785c] motion-reduce:animate-none"
          />
        </div>
        <p className="text-sm font-medium text-foreground">
          Preparing preview…
        </p>
      </div>
    ),
  },
);
export function DocumentVault({
  initialData,
  vehicleId,
  documentId,
  fullScreen = false,
}: {
  initialData: VaultPage;
  vehicleId?: string;
  documentId?: string;
  fullScreen?: boolean;
}) {
  const analyticsClient = useQueryClient(), analyticsScope = useCustomerScope();
  const invalidateStorage = useCallback(() => {
    void analyticsClient.invalidateQueries({ predicate: query => query.queryKey[0] === "customer-analytics" && query.queryKey[1] === analyticsScope && ["documents", "storage-history", "storage-details", "storage-access", "activity", "vehicles"].includes(String(query.queryKey[2])), refetchType: "none" });
  }, [analyticsClient, analyticsScope]);
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState({
    search: "",
    vehicle: vehicleId || "",
    category: "",
    validity: "",
    protection: "",
    file: "",
    from: "",
    until: "",
    sort: "recent",
  });
  const [view, setView] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [replacement, setReplacement] = useState<VaultDocument | undefined>();
  const [selected, setSelected] = useState<VaultDocument | null>(null);
  const [detail, setDetail] = useState<DocumentDetail | null>(null);
  const [preview, setPreview] = useState<{ url: string; mime: string } | null>(
    null,
  );
  const [detailBusy, setDetailBusy] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [pendingAction, setPendingAction] = useState<
    (() => Promise<void>) | null
  >(null);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  const [setupPin, setSetupPin] = useState(false);
  const [unlockScope, setUnlockScope] = useState("vault");
  const [lockBusy, setLockBusy] = useState(false);
  const lockInFlight = useRef(false);
  const [pinMinutes, setPinMinutes] = useState("5");
  const [shareOpen, setShareOpen] = useState(false);
  const [shareSeconds, setShareSeconds] = useState("3600");
  const [shareDownload, setShareDownload] = useState(false);
  const [shareViews, setShareViews] = useState("");
  const [sharePassword, setSharePassword] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [shareBusy, setShareBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editExpires, setEditExpires] = useState("");
  const [editIssuer, setEditIssuer] = useState("");
  const [securityOpen, setSecurityOpen] = useState(false);
  const [securityMode, setSecurityMode] = useState("ACCOUNT");
  const [securityPassword, setSecurityPassword] = useState("");
  const generation = useRef(0);
  const selectionGeneration = useRef(0);
  const previewGeneration = useRef(0);
  const cursor = useRef(data.cursor);
  useEffect(() => {
    cursor.current = data.cursor;
  }, [data.cursor]);
  const firstLoad = useRef(true);
  const query = useCallback(() => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v) q.set(k, v);
    return q;
  }, [filters]);
  const refresh = useCallback(
    async (more = false) => {
      if (lockInFlight.current) return;
      const current = more ? generation.current : ++generation.current;
      if (more) setLoadingMore(true);
      else setLoading(true);
      setError("");
      try {
        const q = query();
        if (more && cursor.current) q.set("cursor", cursor.current);
        const response = await fetch("/api/documents?" + q, {
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        if (current !== generation.current || lockInFlight.current) return;
        setData((old) =>
          more
            ? {
                ...result,
                documents: [
                  ...old.documents,
                  ...result.documents.filter(
                    (d: VaultDocument) =>
                      !old.documents.some((o) => o.id === d.id),
                  ),
                ],
              }
            : result,
        );
      } catch (e) {
        if (current === generation.current)
          setError(e instanceof Error ? e.message : "Please try again.");
      } finally {
        if (current === generation.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [query],
  );
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    ++generation.current;
    const timer = setTimeout(() => void refresh(), 300);
    return () => clearTimeout(timer);
  }, [refresh]); // View mode and cursor updates never trigger a data fetch.
  useEffect(() => {
    const stored = document.cookie
      .split("; ")
      .find((c) => c.startsWith("vs_vault_view="))
      ?.split("=")[1];
    if (stored === "list") setView("list");
  }, []);
  const clearContent = useCallback(() => {
    ++selectionGeneration.current;
    ++previewGeneration.current;
    setPreview(null);
    setSelected(null);
    setDetail(null);
    setPassword("");
    setPendingAction(null);
    setUnlockOpen(false);
    setShareOpen(false);
    setShareLink("");
    setSharePassword("");
    setSecurityPassword("");
    setSecurityOpen(false);
    setEditOpen(false);
    setDeleteOpen(false);
    setUploadOpen(false);
    setReplacement(undefined);
    setData((old) => ({
      ...old,
      documents: old.documents.map((doc) => ({
        ...doc,
        thumbnail_token: undefined,
      })),
    }));
  }, []);
  const lock = useCallback(async () => {
    if (lockInFlight.current) return;
    lockInFlight.current = true;
    setLockBusy(true);
    ++generation.current;
    clearContent();
    try {
      await vaultRequest("lock");
      setData((old) => ({
        ...old,
        vault: {
          ...old.vault,
          locked: old.vault.enabled,
          unlockExpiresAt: null,
        },
      }));
      toast.success("Protected access locked");
    } finally {
      lockInFlight.current = false;
      setLockBusy(false);
    }
    await refresh();
  }, [clearContent, refresh]);
  useEffect(() => {
    if (!data.vault.unlockExpiresAt) return;
    const duration = Math.max(
      0,
      Date.parse(data.vault.unlockExpiresAt) - Date.now(),
    );
    const timer = setTimeout(() => {
      void lock().catch((e) => toast.error(e.message));
    }, duration);
    return () => clearTimeout(timer);
  }, [data.vault.unlockExpiresAt, lock]);
  useEffect(() => {
    if (data.vault.locked) clearContent();
  }, [data.vault.locked, clearContent]);
  useEffect(() => {
    const check = () => {
      if (document.visibilityState !== "visible") return;
      if (
        data.vault.unlockExpiresAt &&
        Date.parse(data.vault.unlockExpiresAt) <= Date.now()
      )
        void lock().catch((e) => toast.error(e.message));
      else void refresh();
    };
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [data.vault.unlockExpiresAt, lock, refresh]);
  function requestVaultUnlock(action?: () => Promise<void>) {
    setSetupPin(false);
    setUnlockScope("vault");
    setPendingAction(action ? () => action : null);
    setPassword("");
    setUnlockError("");
    setUnlockOpen(true);
  }
  const protectedAction = useCallback(async function runProtected(
    doc: VaultDocument,
    action: () => Promise<void>,
    current = selectionGeneration.current,
  ) {
    if (lockInFlight.current || current !== selectionGeneration.current) return;
    try {
      await action();
    } catch (e) {
      if (current !== selectionGeneration.current) return;
      if ((e as { code?: string }).code === "LOCKED") {
        setSelected(doc);
        setPendingAction(() => () => runProtected(doc, action, current));
        setUnlockScope(
          (e as { scope?: string }).scope ||
            (doc.security_mode === "DOCUMENT_PASSWORD" ? doc.id : "vault"),
        );
        setPassword("");
        setUnlockError("");
        setSetupPin(false);
        setUnlockOpen(true);
      } else {
        const message = e instanceof Error ? e.message : "Please try again.";
        setDetailError(message);
        toast.error(message);
      }
    }
  }, []);
  const openPreview = useCallback(
    async (doc: VaultDocument, versionId?: string) => {
      const current = ++previewGeneration.current;
      const selection = selectionGeneration.current;
      setPreview(null);
      await protectedAction(doc, async () => {
        const access = await vaultRequest<{ url: string; mime: string }>(
          "access",
          { id: doc.id, kind: "preview", versionId },
        );
        invalidateStorage();
        if (
          current === previewGeneration.current &&
          selection === selectionGeneration.current
        )
          setPreview(access);
      });
    },
    [protectedAction, invalidateStorage],
  );
  useEffect(() => {
    if (!documentId) return;
    const selectionCounter = selectionGeneration;
    const previewCounter = previewGeneration;
    const current = ++selectionGeneration.current;
    void vaultRequest<DocumentDetail>("detail", { id: documentId })
      .then((value) => {
        if (current !== selectionGeneration.current) return;
        setSelected(value.document);
        setDetail(value);
        void openPreview(value.document);
      })
      .catch((e) => {
        if (current === selectionGeneration.current) setError(e.message);
      });
    return () => {
      ++selectionCounter.current;
      ++previewCounter.current;
    };
  }, [documentId, openPreview]);
  async function select(doc: VaultDocument) {
    if (lockInFlight.current) return;
    const current = ++selectionGeneration.current;
    ++previewGeneration.current;
    setSelected(doc);
    setDetail(null);
    setDetailError("");
    setDetailBusy(true);
    setPreview(null);
    try {
      const details = await vaultRequest<DocumentDetail>("detail", {
        id: doc.id,
      });
      if (current !== selectionGeneration.current) return;
      setDetail(details);
      await openPreview(doc);
    } catch (e) {
      if (current === selectionGeneration.current)
        setDetailError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      if (current === selectionGeneration.current) setDetailBusy(false);
    }
  }
  async function download(doc: VaultDocument, versionId?: string) {
    const current = selectionGeneration.current;
    await protectedAction(doc, async () => {
      const access = await vaultRequest<{ url: string }>("access", {
        id: doc.id,
        kind: "download",
        versionId,
      });
      invalidateStorage();
      const a = document.createElement("a");
      if (current !== selectionGeneration.current || lockInFlight.current)
        return;
      a.href = access.url;
      a.rel = "noreferrer";
      a.click();
      toast.success("Download started");
    });
  }
  async function unlock() {
    const current = selectionGeneration.current;
    setUnlockBusy(true);
    setUnlockError("");
    try {
      if (setupPin) {
        await vaultRequest("configure_pin", {
          password,
          minutes: Number(pinMinutes),
        });
        if (current !== selectionGeneration.current || lockInFlight.current)
          return;
        clearContent();
        setUnlockOpen(false);
        setPassword("");
        await refresh();
        toast.success("Vault PIN updated");
      } else {
        await vaultRequest("unlock", {
          scope: unlockScope,
          password,
        });
        if (current !== selectionGeneration.current || lockInFlight.current)
          return;
        setPassword("");
        setUnlockOpen(false);
        const action = pendingAction;
        setPendingAction(null);
        await refresh();
        if (
          current === selectionGeneration.current &&
          !lockInFlight.current &&
          action
        )
          await action();
      }
    } catch (e) {
      setUnlockError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setUnlockBusy(false);
    }
  }
  async function detailRefresh() {
    invalidateStorage();
    const current = selectionGeneration.current;
    if (selected) {
      const value = await vaultRequest<DocumentDetail>("detail", {
        id: selected.id,
      });
      if (current === selectionGeneration.current) setDetail(value);
    }
    await refresh();
  }
  function chooseView(value: "grid" | "list") {
    setView(value);
    document.cookie = `vs_vault_view=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  }
  const selectControl = (
    key: keyof typeof filters,
    label: string,
    options: Array<[string, string]>,
  ) => {
    const rawVal = filters[key];
    const internalVal = rawVal === "" ? "__all__" : rawVal;
    return (
      <div
        className="grid min-w-0 gap-1.5 text-xs text-muted-foreground"
        key={key}
      >
        <span>{label}</span>
        <Select
          value={internalVal}
          onValueChange={(val) =>
            setFilters((f) => ({ ...f, [key]: val === "__all__" ? "" : val }))
          }
        >
          <SelectTrigger className="h-10 text-xs sm:text-sm bg-background border-border focus:ring-[#cc785c]">
            <SelectValue placeholder={`All ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {options.map(([optVal, optTitle]) => (
              <SelectItem
                key={optVal || "__all__"}
                value={optVal === "" ? "__all__" : optVal}
                className="text-xs sm:text-sm"
              >
                {optTitle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };
  const filterControls = (
    <div className="grid gap-4">
      {!vehicleId &&
        selectControl("vehicle", "Vehicle", [
          ["", "All vehicles"],
          ...data.vehicles.map((v) => [v.id, v.label] as [string, string]),
        ])}
      {selectControl("category", "Document type", [
        ["", "All types"],
        ...Object.entries(CATEGORIES),
      ])}
      {selectControl("validity", "Validity", [
        ["", "All validity"],
        ["VALID", "Valid"],
        ["EXPIRING_SOON", "Expiring soon"],
        ["EXPIRED", "Expired"],
        ["NO_EXPIRY", "No expiry"],
      ])}
      {selectControl("protection", "Protection", [
        ["", "All protection"],
        ["ACCOUNT", "Account"],
        ["VAULT_PIN", "Vault PIN"],
        ["DOCUMENT_PASSWORD", "Document password"],
      ])}
      {selectControl("file", "File type", [
        ["", "All files"],
        ["pdf", "PDF"],
        ["image", "Image"],
      ])}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5 text-xs text-muted-foreground">
          <span>Uploaded from</span>
          <DatePicker
            value={filters.from}
            placeholder="From date"
            onChange={(val) => setFilters((f) => ({ ...f, from: val }))}
          />
        </div>
        <div className="grid gap-1.5 text-xs text-muted-foreground">
          <span>Until</span>
          <DatePicker
            value={filters.until}
            placeholder="Until date"
            onChange={(val) => setFilters((f) => ({ ...f, until: val }))}
          />
        </div>
      </div>
    </div>
  );
  const docCard = (doc: VaultDocument) => {
    const state = validity(doc.expires_at);
    return (
      <article
        key={doc.id}
        className="group min-w-0 overflow-hidden rounded-md border border-border bg-card transition-colors hover:border-[#cc785c]/50"
      >
        <button
          className="block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#cc785c]"
          onClick={() => void select(doc)}
        >
          <div className="relative flex aspect-[4/3] items-center justify-center border-b border-border bg-muted/40 p-4">
            {doc.thumbnail_token && !data.vault.locked && !lockBusy ? (
              // Private, expiring URLs must bypass the Next.js image optimizer cache.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                loading="lazy"
                src={`${data.workerUrl}/access/${doc.thumbnail_token}`}
                className="h-full w-full object-contain"
                alt={`Preview of ${doc.title}`}
                onError={(e) => {
                  e.currentTarget.style.visibility = "hidden";
                }}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <VaahanIcon
                  name={
                    doc.security_mode === "ACCOUNT" && !data.vault.locked
                      ? "file"
                      : "lock"
                  }
                  size={32}
                />
                <span className="text-xs">
                  {data.vault.locked
                    ? "Vault locked"
                    : doc.security_mode === "ACCOUNT"
                      ? "Stored copy"
                      : doc.security_mode === "VAULT_PIN"
                        ? "Vault PIN required"
                        : "Password required"}
                </span>
              </div>
            )}
            <span className="absolute bottom-2 left-3 rounded bg-background/90 px-2 py-1 text-[10px] uppercase tracking-wider">
              {doc.mime_type === "application/pdf" ? "PDF" : "Image"} ·{" "}
              {sizeLabel(doc.file_size_bytes)}
            </span>
          </div>
          <div className="space-y-2 p-4">
            <h3 className="truncate font-medium" title={doc.title}>
              {doc.title}
            </h3>
            <p className="truncate text-xs text-muted-foreground">
              {doc.vehicle_label || "Account document"}
            </p>
            <p
              className={`text-xs ${state.key === "EXPIRED" ? "text-destructive" : state.key === "EXPIRING_SOON" ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"}`}
            >
              {state.label}
            </p>
          </div>
        </button>
        <div className="flex items-center justify-between border-t border-border px-4 py-1">
          <span className="text-[11px] text-muted-foreground">
            Uploaded document
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Manage ${doc.title}`}
            onClick={() => void select(doc)}
          >
            <VaahanIcon name="more" size={18} />
          </Button>
        </div>
      </article>
    );
  };
  const documentActions = selected && (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <VaultIconButton icon="more-vertical" label="Document actions" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52"
        onCloseAutoFocus={(event) => {
          if (shareOpen || editOpen || uploadOpen || securityOpen || deleteOpen)
            event.preventDefault();
        }}
      >
        <DropdownMenuLabel>Document actions</DropdownMenuLabel>
        <DropdownMenuItem
          className="min-h-11"
          onSelect={() => void openPreview(selected)}
        >
          <VaahanIcon name="eye" />
          Preview
        </DropdownMenuItem>
        <DropdownMenuItem
          className="min-h-11"
          onSelect={() => {
            setShareOpen(true);
            setShareLink("");
            setSharePassword("");
          }}
        >
          <VaahanIcon name="share" />
          Share securely
        </DropdownMenuItem>
        <DropdownMenuItem
          className="min-h-11"
          onSelect={() => void download(selected)}
        >
          <VaahanIcon name="download" />
          Download original
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="min-h-11"
          onSelect={() => {
            setReplacement(selected);
            setUploadOpen(true);
          }}
        >
          <VaahanIcon name="refresh" />
          Replace file
        </DropdownMenuItem>
        <DropdownMenuItem
          className="min-h-11"
          onSelect={() => {
            setEditTitle(selected.title);
            setEditExpires(selected.expires_at || "");
            setEditIssuer(selected.issuer_name || "");
            setEditOpen(true);
          }}
        >
          <VaahanIcon name="edit" />
          Edit details
        </DropdownMenuItem>
        <DropdownMenuItem
          className="min-h-11"
          onSelect={() => {
            setSecurityMode(selected.security_mode);
            setSecurityPassword("");
            setSecurityOpen(true);
          }}
        >
          <VaahanIcon name="lock" />
          Security
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="min-h-11 text-destructive focus:bg-destructive/10 focus:text-destructive"
          onSelect={() => setDeleteOpen(true)}
        >
          <VaahanIcon name="trash" />
          Delete document
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  const detailContent = selected && (
    <div className="space-y-5 pb-6">
      {detailBusy && (
        <div className="flex items-center justify-center gap-2.5 rounded-lg border border-border/60 bg-muted/20 py-2.5 px-4 text-xs font-medium text-muted-foreground">
          <VaahanIcon
            name="loading-02"
            size={16}
            className="animate-spin text-[#cc785c] shrink-0 motion-reduce:animate-none"
          />
          <span>Loading document details…</span>
        </div>
      )}
      {detailError && (
        <p role="alert" className="text-sm text-destructive">
          {detailError}
        </p>
      )}
      {preview ? (
        <Viewer
          title={selected.title}
          url={preview.url}
          mime={preview.mime}
          download={() => void download(selected)}
          onExpired={() => void openPreview(selected)}
        />
      ) : (
        <div className="flex min-h-[320px] sm:min-h-[380px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 p-8 text-center">
          {selected.security_mode === "ACCOUNT" && !data.vault.locked ? (
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-border/80 bg-background shadow-xs">
                <VaahanIcon
                  name="loading-02"
                  size={28}
                  className="animate-spin text-[#cc785c] motion-reduce:animate-none"
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Preparing preview…
                </p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Decrypting and loading document securely
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center space-y-3 max-w-xs">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-border/80 bg-background shadow-xs text-muted-foreground">
                <VaahanIcon name="lock" size={26} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Protected Document
                </p>
                <p className="text-xs text-muted-foreground">
                  {selected.security_mode === "VAULT_PIN"
                    ? "Enter your Vault PIN to preview this document."
                    : "Enter document password to preview."}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-1"
                onClick={() => void openPreview(selected)}
              >
                Unlock to preview
              </Button>
            </div>
          )}
        </div>
      )}
      {!detail && detailBusy && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-16 animate-pulse rounded bg-muted/60" />
              <div className="h-4 w-28 animate-pulse rounded bg-muted/40" />
            </div>
          ))}
        </div>
      )}
      {detail && (
        <>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            {[
              ["Type", CATEGORIES[selected.category]],
              ["Vehicle", selected.vehicle_label || "Account"],
              ["Reference", selected.document_number_masked || "Not added"],
              ["Issuer", selected.issuer_name || "Not added"],
              ["Issued", selected.issued_at || "Not added"],
              ["Valid until", selected.expires_at || "No expiry"],
              [
                "Security",
                selected.security_mode === "ACCOUNT"
                  ? "Account protected"
                  : selected.security_mode === "VAULT_PIN"
                    ? "Vault PIN required"
                    : "Password required",
              ],
              ["Size", sizeLabel(selected.file_size_bytes)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 break-words">{value}</dd>
              </div>
            ))}
          </dl>
          {selected.metadata.notes && (
            <p className="whitespace-pre-wrap text-sm">
              {selected.metadata.notes}
            </p>
          )}
          <section className="space-y-2 border-t border-border pt-4">
            <h3 className="font-medium">Version history</h3>
            {detail.versions.map((v) => (
              <div
                key={v.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="break-all">
                    v{v.version_number} · {v.original_filename}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sizeLabel(v.file_size_bytes)} ·{" "}
                    {new Date(v.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void openPreview(selected, v.id)}
                >
                  View
                </Button>
              </div>
            ))}
          </section>
          <section className="space-y-2 border-t border-border pt-4">
            <h3 className="font-medium">Sharing</h3>
            {!detail.shares.length && (
              <p className="text-sm text-muted-foreground">No links created.</p>
            )}
            {detail.shares.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-xs"
              >
                <div>
                  <p>
                    {s.revoked_at
                      ? "Revoked"
                      : Date.parse(s.expires_at) < Date.now()
                        ? "Expired"
                        : "Link expires " +
                          new Date(s.expires_at).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                          }) +
                          " IST"}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {s.view_count}
                    {s.max_views ? ` / ${s.max_views}` : ""} views · Downloads{" "}
                    {s.allow_download ? "allowed" : "disabled"}
                  </p>
                </div>
                {!s.revoked_at && Date.parse(s.expires_at) > Date.now() && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void protectedAction(selected, async () => {
                        await vaultRequest("revoke", {
                          id: selected.id,
                          shareId: s.id,
                        });
                        toast.success("Share revoked");
                        await detailRefresh();
                      })
                    }
                  >
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </section>
          <DocumentActivityTimeline events={detail.events} />
        </>
      )}
    </div>
  );
  const activeFilterCount = [
    Boolean(filters.vehicle && filters.vehicle !== vehicleId),
    Boolean(filters.category),
    Boolean(filters.validity),
    Boolean(filters.protection),
    Boolean(filters.file),
    Boolean(filters.from || filters.until),
  ].filter(Boolean).length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 sm:space-y-6 px-3.5 sm:px-6 py-2 min-w-0">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between sm:pb-6">
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-[11px] sm:text-xs uppercase tracking-[.18em] text-muted-foreground font-mono">
            Private vehicle records
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight">
            Document Vault
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Securely keep important vehicle documents in one place.
          </p>
          <p className="mt-2 text-[11px] sm:text-xs text-muted-foreground">
            {data.summary.count} documents · {data.summary.expiring} expiring
            soon
            {vehicleId
              ? " · " +
                (data.vehicles.find((v) => v.id === vehicleId)?.label ||
                  "Selected vehicle")
              : ""}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
          <Button variant="outline" size="sm" className="h-9 sm:h-10 gap-1.5" asChild><Link href="/analytics/storage"><VaahanIcon name="database" size={15} />Storage Analytics</Link></Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 sm:h-10 flex-1 sm:flex-initial text-xs sm:text-sm gap-1.5"
            disabled={lockBusy || unlockBusy}
            onClick={() => {
              if (!data.vault.enabled) {
                setSetupPin(true);
                setPassword("");
                setUnlockError("");
                setPendingAction(null);
                setUnlockOpen(true);
              } else if (data.vault.locked) requestVaultUnlock();
              else void lock().catch((e) => toast.error(e.message));
            }}
          >
            <VaahanIcon name="lock" size={15} />
            <span>
              {lockBusy
                ? "Locking…"
                : !data.vault.enabled
                  ? "Set up vault lock"
                  : data.vault.locked
                    ? "Unlock vault"
                    : "Lock vault"}
            </span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 sm:h-10 flex-1 sm:flex-initial text-xs sm:text-sm"
            onClick={() => {
              setSetupPin(true);
              setPendingAction(null);
              setPinMinutes(String(data.vault.autoLockMinutes));
              setUnlockError("");
              setPassword("");
              setUnlockOpen(true);
            }}
          >
            <span>{data.vault.enabled ? "PIN settings" : "Set Vault PIN"}</span>
          </Button>
          <Button
            size="sm"
            className="h-9 sm:h-10 w-full sm:w-auto text-xs sm:text-sm gap-1.5 shadow-xs"
            onClick={() => {
              const add = async () => {
                setReplacement(undefined);
                setUploadOpen(true);
              };
              if (data.vault.locked) requestVaultUnlock(add);
              else void add();
            }}
            disabled={lockBusy}
          >
            <VaahanIcon name="plus" size={16} />
            <span>Add document</span>
          </Button>
        </div>
      </header>
      {data.vault.locked && (
        <p
          role="status"
          className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground"
        >
          Your vault is locked. Unlock with your Vault PIN to preview, download,
          share or upload files.
        </p>
      )}
      {vehicleId && (
        <Link
          className="inline-flex min-h-11 items-center text-sm text-[#cc785c]"
          href="/documents"
        >
          View all documents
        </Link>
      )}
      {/* Search, Filter, Sort & View Controls Bar */}
      <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:gap-3">
        {/* Mobile Row 1 / Desktop Left: Search + Mobile Filters + Mobile View Toggle */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Search documents */}
          <div className="relative flex-1 min-w-0">
            <VaahanIcon
              name="search"
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              type="search"
              placeholder="Search documents…"
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              className="h-10 pl-9 pr-9 text-xs sm:text-sm bg-background border-border focus-visible:ring-[#cc785c]"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => setFilters((f) => ({ ...f, search: "" }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-sm transition-colors"
                aria-label="Clear search"
              >
                <VaahanIcon name="close" size={13} />
              </button>
            )}
          </div>

          {/* Filters Button on Mobile */}
          <Button
            variant="outline"
            onClick={() => setFilterOpen(true)}
            className="md:hidden h-10 px-2.5 sm:px-3 text-xs border-border bg-background hover:bg-muted shrink-0 gap-1.5"
          >
            <VaahanIcon
              name="filter"
              size={14}
              className="text-muted-foreground"
            />
            <span className="hidden xs:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-[#cc785c] text-[10px] font-mono text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* Grid / Row view switcher on Mobile */}
          <div
            className="md:hidden flex h-10 items-center rounded-md border border-input bg-muted/20 p-1 shrink-0"
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              aria-label="Grid view"
              title="Grid view"
              aria-pressed={view === "grid"}
              onClick={() => chooseView("grid")}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-sm transition-colors",
                view === "grid"
                  ? "bg-background text-[#cc785c] shadow-xs font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <VaahanIcon name="grid" size={16} />
            </button>
            <button
              type="button"
              aria-label="Row / List view"
              title="Row / List view"
              aria-pressed={view === "list"}
              onClick={() => chooseView("list")}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-sm transition-colors",
                view === "list"
                  ? "bg-background text-[#cc785c] shadow-xs font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <VaahanIcon name="row" size={16} />
            </button>
          </div>
        </div>

        {/* Mobile Row 2 / Desktop Right: Vehicle, Sort, Desktop Filters + Desktop View Switcher */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 w-full md:w-auto">
          {!vehicleId && (
            <div className="flex-1 min-w-0 md:w-40 lg:w-48 shrink-0">
              <Select
                value={filters.vehicle === "" ? "__all__" : filters.vehicle}
                onValueChange={(val) =>
                  setFilters((f) => ({
                    ...f,
                    vehicle: val === "__all__" ? "" : val,
                  }))
                }
              >
                <SelectTrigger className="h-10 text-xs sm:text-sm bg-background border-border focus:ring-[#cc785c]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-muted-foreground font-normal shrink-0">
                      Vehicle:
                    </span>
                    <SelectValue placeholder="All vehicles" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="__all__" className="text-xs sm:text-sm">
                    All vehicles
                  </SelectItem>
                  {data.vehicles.map((v) => (
                    <SelectItem
                      key={v.id}
                      value={v.id}
                      className="text-xs sm:text-sm"
                    >
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div
            className={cn(
              "shrink-0",
              !vehicleId
                ? "flex-1 min-w-0 md:w-36 lg:w-44"
                : "w-full md:w-44 lg:w-48",
            )}
          >
            <Select
              value={filters.sort}
              onValueChange={(val) => setFilters((f) => ({ ...f, sort: val }))}
            >
              <SelectTrigger className="h-10 text-xs sm:text-sm bg-background border-border focus:ring-[#cc785c]">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-muted-foreground font-normal shrink-0">
                    Sort:
                  </span>
                  <SelectValue placeholder="Sort" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent" className="text-xs sm:text-sm">
                  Recently added
                </SelectItem>
                <SelectItem value="updated" className="text-xs sm:text-sm">
                  Recently updated
                </SelectItem>
                <SelectItem value="expiry" className="text-xs sm:text-sm">
                  Expiry soon
                </SelectItem>
                <SelectItem value="oldest" className="text-xs sm:text-sm">
                  Oldest
                </SelectItem>
                <SelectItem value="name" className="text-xs sm:text-sm">
                  Name A–Z
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Filters Button */}
          <Button
            variant="outline"
            onClick={() => setFilterOpen(true)}
            className="hidden md:inline-flex h-10 gap-1.5 px-3 text-xs sm:text-sm border-border bg-background hover:bg-muted shrink-0"
          >
            <VaahanIcon
              name="filter"
              size={15}
              className="text-muted-foreground"
            />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-[#cc785c] text-[10px] font-mono text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* Desktop Grid / Row view switcher with Hugeicons */}
          <div
            className="hidden md:flex h-10 items-center rounded-md border border-input bg-muted/20 p-1 shrink-0"
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              aria-label="Grid view"
              title="Grid view"
              aria-pressed={view === "grid"}
              onClick={() => chooseView("grid")}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-sm transition-colors",
                view === "grid"
                  ? "bg-background text-[#cc785c] shadow-xs font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <VaahanIcon name="grid" size={16} />
            </button>
            <button
              type="button"
              aria-label="Row / List view"
              title="Row / List view"
              aria-pressed={view === "list"}
              onClick={() => chooseView("list")}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-sm transition-colors",
                view === "list"
                  ? "bg-background text-[#cc785c] shadow-xs font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <VaahanIcon name="row" size={16} />
            </button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 min-w-0">
        {(
          [
            "DRIVING_LICENCE",
            "REGISTRATION_CERTIFICATE",
            "INSURANCE",
            "PUC",
          ] as const
        ).map((c) => (
          <button
            key={c}
            className={`min-h-16 min-w-0 overflow-hidden rounded-md border p-2.5 sm:p-3 text-left transition-colors ${
              filters.category === c
                ? "border-[#cc785c] bg-[#cc785c]/5"
                : "border-border hover:bg-muted/50"
            }`}
            onClick={() =>
              setFilters((f) => ({ ...f, category: f.category === c ? "" : c }))
            }
          >
            <span
              className="block truncate text-xs sm:text-sm font-medium"
              title={CATEGORIES[c]}
            >
              {CATEGORIES[c]}
            </span>
            <span className="mt-1 block truncate text-[11px] sm:text-xs text-muted-foreground">
              {data.summary.categories[c] || 0} documents
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-md border border-destructive/20 p-4 text-sm"
        >
          <span>{error}</span>
          <Button variant="outline" onClick={() => void refresh()}>
            Try again
          </Button>
        </div>
      )}
      {loading && (
        <p
          role="status"
          aria-live="polite"
          className="text-xs text-muted-foreground"
        >
          Updating documents…
        </p>
      )}
      {!data.documents.length && !loading ? (
        <div className="flex min-h-[300px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/30 p-8 sm:p-12 text-center">
          <div className="mx-auto flex max-w-md flex-col items-center justify-center text-center space-y-4">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-border/80 bg-background shadow-xs text-muted-foreground">
              <VaahanIcon name="document" size={26} />
            </div>
            <div className="space-y-1.5 text-center">
              <h2 className="font-serif text-xl sm:text-2xl font-medium text-foreground text-center">
                {Object.entries(filters).some(
                  ([k, v]) => v && k !== "sort" && k !== "vehicle",
                )
                  ? "No documents match these filters"
                  : "Keep important vehicle documents together"}
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground text-center max-w-sm mx-auto">
                {Object.entries(filters).some(
                  ([k, v]) => v && k !== "sort" && k !== "vehicle",
                )
                  ? "Try clearing or adjusting your active filters to see stored documents."
                  : "Store private copies of registration, insurance, PUC, licence and service records. Uploaded copies are not government verified."}
              </p>
            </div>
            {Object.entries(filters).some(
              ([k, v]) => v && k !== "sort" && k !== "vehicle",
            ) ? (
              <Button
                variant="outline"
                className="mt-1 h-10 px-4"
                onClick={() =>
                  setFilters({
                    search: "",
                    vehicle: vehicleId || "",
                    category: "",
                    validity: "",
                    protection: "",
                    file: "",
                    from: "",
                    until: "",
                    sort: "recent",
                  })
                }
              >
                Clear all filters
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setReplacement(undefined);
                  setUploadOpen(true);
                }}
                className="mt-1 h-10 gap-2 px-5 font-medium shadow-xs"
              >
                <VaahanIcon name="plus" size={16} />
                <span>Add your first document</span>
              </Button>
            )}
          </div>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {data.documents.map(docCard)}
          {loadingMore &&
            Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="aspect-[4/5] animate-pulse rounded-md bg-muted motion-reduce:animate-none"
              />
            ))}
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {data.documents.map(docCard)}
          </div>
          <div className="hidden overflow-x-auto rounded-md border border-border md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  {[
                    "Document",
                    "Vehicle",
                    "Type",
                    "Validity",
                    "Size",
                    "Actions",
                  ].map((c) => (
                    <th key={c} className="p-3 font-normal">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="max-w-72 p-3">
                      <button
                        className="block min-h-11 w-full text-left focus-visible:underline"
                        onClick={() => void select(doc)}
                      >
                        <span className="block truncate font-medium">
                          {doc.title}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {doc.original_filename}
                        </span>
                      </button>
                    </td>
                    <td className="p-3 text-xs">
                      {doc.vehicle_label || "Account"}
                    </td>
                    <td className="p-3 text-xs">
                      {doc.mime_type === "application/pdf" ? "PDF" : "Image"}
                    </td>
                    <td className="p-3 text-xs">
                      {validity(doc.expires_at).label}
                    </td>
                    <td className="p-3 text-xs">
                      {sizeLabel(doc.file_size_bytes)}
                    </td>
                    <td className="p-3">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Manage ${doc.title}`}
                        onClick={() => void select(doc)}
                      >
                        <VaahanIcon name="more" size={18} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {data.cursor && (
        <div className="text-center">
          <Button
            variant="outline"
            disabled={loadingMore || loading}
            onClick={() => void refresh(true)}
          >
            {loadingMore ? "Loading more…" : "Load more documents"}
          </Button>
        </div>
      )}
      <footer className="border-t border-border pt-4 text-xs text-muted-foreground">
        Allocated storage, including versions: {sizeLabel(data.usage.bytes)} of{" "}
        {sizeLabel(data.usage.maxBytes)} · Up to {data.usage.maxDocuments}{" "}
        documents. Private originals are not available offline.
      </footer>
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Filter documents</SheetTitle>
            <SheetDescription>
              Find a stored copy by vehicle, type or validity.
            </SheetDescription>
          </SheetHeader>
          <div className="my-5 flex-1">{filterControls}</div>
          <div className="sticky bottom-0 flex gap-2 border-t border-border bg-background pt-4">
            <Button
              variant="outline"
              onClick={() =>
                setFilters({
                  search: "",
                  vehicle: vehicleId || "",
                  category: "",
                  validity: "",
                  protection: "",
                  file: "",
                  from: "",
                  until: "",
                  sort: "recent",
                })
              }
            >
              Reset
            </Button>
            <Button onClick={() => setFilterOpen(false)}>Show results</Button>
          </div>
        </SheetContent>
      </Sheet>
      <UploadDocumentDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        data={data}
        vehicleId={vehicleId}
        replace={replacement}
        onDone={() => {
          invalidateStorage();
          void refresh();
          if (selected) void detailRefresh();
        }}
      />
      {fullScreen && selected ? (
        <section className="space-y-4 border-t border-border pt-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="min-w-0 break-words font-serif text-2xl">
              {selected.title}
            </h2>
            {documentActions}
          </div>
          {detailContent}
        </section>
      ) : (
        <Sheet
          open={!!selected}
          onOpenChange={(value) => {
            if (!value) {
              ++selectionGeneration.current;
              ++previewGeneration.current;
              setSelected(null);
              setDetail(null);
              setPreview(null);
              setShareLink("");
              setPendingAction(null);
              setPassword("");
              setUnlockOpen(false);
              if (data.vault.autoLockMinutes === 0)
                void lock().catch((e) => toast.error(e.message));
            }
          }}
        >
          <SheetContent
            showCloseButton={false}
            className="vault-document-sheet flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
          >
            <SheetHeader className="vault-document-header shrink-0 border-b border-border p-4 text-left sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 py-1">
                  <SheetTitle className="line-clamp-2">
                    {selected?.title || "Document"}
                  </SheetTitle>
                  <SheetDescription className="mt-1 truncate">
                    Private stored copy ·{" "}
                    {selected?.vehicle_label || "Account document"}
                  </SheetDescription>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {documentActions}
                  <SheetClose asChild>
                    <VaultIconButton icon="close" label="Close document" />
                  </SheetClose>
                </div>
              </div>
            </SheetHeader>
            <div className="vault-document-body min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
              {detailContent}
            </div>
          </SheetContent>
        </Sheet>
      )}
      <Dialog
        open={unlockOpen}
        onOpenChange={(v) => {
          setUnlockOpen(v);
          if (!v) {
            setPassword("");
            setPendingAction(null);
          }
        }}
      >
        <DialogContent className="rounded-md sm:rounded-md">
          <DialogHeader>
            <DialogTitle>
              {setupPin
                ? "Document Vault PIN"
                : unlockScope !== "vault"
                  ? "Unlock document"
                  : "Unlock Document Vault"}
            </DialogTitle>
            <DialogDescription>
              {setupPin
                ? "Use 6–12 digits to protect all files in your vault. A forgotten PIN can be reset after signing in again."
                : "Enter the additional PIN or password to authorize access."}
            </DialogDescription>
          </DialogHeader>
          <label className="grid gap-2 text-sm">
            {setupPin || unlockScope === "vault"
              ? "Vault PIN"
              : "Document password"}
            <Input
              autoComplete="off"
              type="password"
              inputMode={
                setupPin || unlockScope === "vault" ? "numeric" : "text"
              }
              value={password}
              maxLength={128}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !unlockBusy) void unlock();
              }}
            />
          </label>
          {setupPin && (
            <div className="grid gap-2 text-sm text-muted-foreground">
              <span>Auto lock</span>
              <Select value={pinMinutes} onValueChange={setPinMinutes}>
                <SelectTrigger className="h-10 text-xs sm:text-sm bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0" className="text-xs sm:text-sm">
                    On close (access expires within 1 minute)
                  </SelectItem>
                  <SelectItem value="5" className="text-xs sm:text-sm">
                    5 minutes
                  </SelectItem>
                  <SelectItem value="15" className="text-xs sm:text-sm">
                    15 minutes
                  </SelectItem>
                  <SelectItem value="30" className="text-xs sm:text-sm">
                    30 minutes
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {unlockError && (
            <p role="alert" className="text-sm text-destructive">
              {unlockError}
            </p>
          )}
          <Button
            disabled={unlockBusy || !password}
            onClick={() => void unlock()}
          >
            {unlockBusy ? "Authorizing…" : setupPin ? "Save PIN" : "Unlock"}
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={shareOpen}
        onOpenChange={(value) => {
          setShareOpen(value);
          if (!value) {
            setSharePassword("");
            setShareLink("");
          }
        }}
      >
        <DialogContent className="rounded-md sm:rounded-md">
          <DialogHeader>
            <DialogTitle>Share document</DialogTitle>
            <DialogDescription>
              Anyone with this link can access this stored copy under the
              settings below. Share only with someone you trust.
            </DialogDescription>
          </DialogHeader>
          {shareLink ? (
            <div className="space-y-3">
              <p className="text-sm">
                Secure link created. Copy it now; VaahanSafe stores only its
                hash.
              </p>
              <Input
                aria-label="Secure share link"
                value={shareLink}
                readOnly
              />
              <Button
                onClick={() =>
                  void navigator.clipboard
                    .writeText(shareLink)
                    .then(() => toast.success("Link copied"))
                    .catch(() =>
                      toast.error("Select and copy the link manually."),
                    )
                }
              >
                Copy link
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium">
                {selected?.title} ·{" "}
                {selected?.vehicle_label || "Account document"}
              </p>
              <div className="grid gap-2 text-sm text-muted-foreground">
                <span>Access expires</span>
                <Select value={shareSeconds} onValueChange={setShareSeconds}>
                  <SelectTrigger className="h-10 text-xs sm:text-sm bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="900" className="text-xs sm:text-sm">
                      15 minutes
                    </SelectItem>
                    <SelectItem value="3600" className="text-xs sm:text-sm">
                      1 hour
                    </SelectItem>
                    <SelectItem value="86400" className="text-xs sm:text-sm">
                      24 hours
                    </SelectItem>
                    <SelectItem value="604800" className="text-xs sm:text-sm">
                      7 days
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={shareDownload}
                  onChange={(e) => setShareDownload(e.target.checked)}
                />
                Allow download
              </label>
              <label className="grid gap-2 text-sm">
                Maximum viewer opens (optional)
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={shareViews}
                  onChange={(e) => setShareViews(e.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm">
                Access passcode (optional, 10+ characters)
                <Input
                  type="password"
                  autoComplete="off"
                  value={sharePassword}
                  maxLength={128}
                  onChange={(e) => setSharePassword(e.target.value)}
                />
              </label>
              <p className="text-xs text-muted-foreground">
                Downloads {shareDownload ? "allowed" : "disabled"}. Visible
                content can still be saved or photographed. Each preview
                authorization lasts up to one minute.
              </p>
              <Button
                disabled={shareBusy}
                onClick={() => {
                  if (!selected) return;
                  const current = selectionGeneration.current;
                  setShareBusy(true);
                  void protectedAction(selected, async () => {
                    const link = await vaultRequest<{ url: string }>("share", {
                      id: selected.id,
                      seconds: Number(shareSeconds),
                      download: shareDownload,
                      maxViews: shareViews,
                      password: sharePassword,
                    });
                    if (
                      current !== selectionGeneration.current ||
                      lockInFlight.current
                    )
                      return;
                    setShareLink(link.url);
                    setSharePassword("");
                    toast.success("Secure link created");
                    await detailRefresh();
                  }).finally(() => setShareBusy(false));
                }}
              >
                {shareBusy ? "Creating…" : "Create secure link"}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-md sm:rounded-md">
          <DialogHeader>
            <DialogTitle>Edit document details</DialogTitle>
            <DialogDescription>
              Update the stored copy’s name, issuer and validity.
            </DialogDescription>
          </DialogHeader>
          <label className="grid gap-1 text-sm">
            Name
            <Input
              value={editTitle}
              maxLength={120}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Issuer
            <Input
              value={editIssuer}
              maxLength={120}
              onChange={(e) => setEditIssuer(e.target.value)}
            />
          </label>
          <div className="grid gap-1.5 text-sm">
            <label>Valid until</label>
            <DatePicker
              value={editExpires}
              placeholder="Valid until date"
              onChange={setEditExpires}
            />
          </div>
          <Button
            onClick={() => {
              const current = selectionGeneration.current;
              if (selected)
                void protectedAction(selected, async () => {
                  await vaultRequest("edit", {
                    id: selected.id,
                    title: editTitle,
                    expires: editExpires,
                    issuer: editIssuer,
                    metadata: selected.metadata,
                  });
                  invalidateStorage();
                  setEditOpen(false);
                  const next = await vaultRequest<DocumentDetail>("detail", {
                    id: selected.id,
                  });
                  if (
                    current !== selectionGeneration.current ||
                    lockInFlight.current
                  )
                    return;
                  setSelected(next.document);
                  setDetail(next);
                  await refresh();
                  toast.success("Document updated");
                });
            }}
          >
            Save details
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={securityOpen}
        onOpenChange={(value) => {
          setSecurityOpen(value);
          if (!value) setSecurityPassword("");
        }}
      >
        <DialogContent className="rounded-md sm:rounded-md">
          <DialogHeader>
            <DialogTitle>Document security</DialogTitle>
            <DialogDescription>
              Changing protection revokes existing share links and file access.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 text-sm text-muted-foreground">
            <span>Protection</span>
            <Select value={securityMode} onValueChange={setSecurityMode}>
              <SelectTrigger className="h-10 text-xs sm:text-sm bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACCOUNT" className="text-xs sm:text-sm">
                  Account
                </SelectItem>
                <SelectItem value="VAULT_PIN" className="text-xs sm:text-sm">
                  Vault PIN
                </SelectItem>
                <SelectItem
                  value="DOCUMENT_PASSWORD"
                  className="text-xs sm:text-sm"
                >
                  Document password
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {securityMode === "DOCUMENT_PASSWORD" && (
            <label className="grid gap-2 text-sm">
              New password (10–128 characters)
              <Input
                type="password"
                value={securityPassword}
                maxLength={128}
                autoComplete="off"
                onChange={(e) => setSecurityPassword(e.target.value)}
              />
            </label>
          )}
          <Button
            onClick={() => {
              const current = selectionGeneration.current;
              if (selected)
                void protectedAction(selected, async () => {
                  await vaultRequest("security", {
                    id: selected.id,
                    mode: securityMode,
                    password: securityPassword,
                  });
                  invalidateStorage();
                  setSecurityPassword("");
                  setSecurityOpen(false);
                  setPreview(null);
                  const next = await vaultRequest<DocumentDetail>("detail", {
                    id: selected.id,
                  });
                  if (
                    current !== selectionGeneration.current ||
                    lockInFlight.current
                  )
                    return;
                  setSelected(next.document);
                  setDetail(next);
                  await refresh();
                  toast.success("Security updated");
                });
            }}
          >
            Update protection
          </Button>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {selected?.title} and its versions from your vault
              and revokes sharing. Files are removed by the cleanup Worker;
              activity metadata is retained. There is no restore option.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selected)
                  void protectedAction(selected, async () => {
                    await vaultRequest("delete", { id: selected.id });
                    invalidateStorage();
                    setSelected(null);
                    setPreview(null);
                    await refresh();
                    toast.success("Document deleted");
                  });
              }}
            >
              Delete document
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
