"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { VaahanIcon } from "@vaahansafe/icons";
import {
  CATEGORIES,
  MAX_FILE_BYTES,
  MIME_TYPES,
  detectMime,
  sizeLabel,
  type VaultPage,
  type VaultDocument,
} from "./model";
import { vaultRequest } from "./client";
import { thumbnail } from "./pdf";
export function UploadDocumentDialog({
  open,
  onOpenChange,
  data,
  vehicleId,
  replace,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: VaultPage;
  vehicleId?: string;
  replace?: VaultDocument;
  onDone: () => void;
}) {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [canRetry, setCanRetry] = useState(false);
  const [intent, setIntent] = useState<{
    id: string;
    uploadUrl: string;
  } | null>(null);
  const xhr = useRef<XMLHttpRequest | null>(null);
  const [details, setDetails] = useState({
    category: "REGISTRATION_CERTIFICATE",
    vehicleId: vehicleId || "",
    title: "Registration Certificate",
    number: "",
    issued: "",
    validFrom: "",
    expires: "",
    issuer: "",
    notes: "",
    mode: "ACCOUNT",
    password: "",
  });
  const update = (key: keyof typeof details, value: string) =>
    setDetails((d) => ({ ...d, [key]: value }));
  useEffect(() => {
    if (!open) {
      xhr.current?.abort();
      setFile(null);
      setStep(0);
      setDetails((current) => ({ ...current, password: "" }));
    }
  }, [open]);
  async function choose(candidate: File | undefined) {
    if (!candidate) return;
    setError("");
    if (candidate.size > MAX_FILE_BYTES || candidate.size < 12) {
      setError("Choose a document up to 20 MB.");
      return;
    }
    const mime = detectMime(
      new Uint8Array(await candidate.slice(0, 20).arrayBuffer()),
    );
    if (!mime || !MIME_TYPES.includes(mime)) {
      setError("Choose a PDF, JPG, PNG or WebP file.");
      return;
    }
    setFile(new File([candidate], candidate.name, { type: mime }));
    setIntent(null);
    setCanRetry(false);
  }
  async function checkStatus() {
    if (!intent) return;
    setBusy(true);
    setCanRetry(false);
    try {
      const response = await fetch(intent.uploadUrl, { cache: "no-store" });
      const state = await response.json();
      if (state.ready) {
        toast.success("Document ready");
        onDone();
        onOpenChange(false);
      } else if (state.status === "PENDING_UPLOAD") {
        setCanRetry(true);
        setError("No file data was received. You can retry this upload.");
      } else if (state.status === "FAILED" || state.error === "EXPIRED") {
        setIntent(null);
        setError(
          "This upload did not complete. You can retry; its reserved storage will be cleaned up.",
        );
      } else
        setError(
          state.error
            ? "This upload could not be completed. Its reserved storage will be cleaned up."
            : "The upload is still pending. Please check again before adding another copy.",
        );
    } catch {
      setError("We couldn’t check the upload. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function submit(resume = false) {
    if (!file || (resume && !intent)) return;
    setBusy(true);
    setProgress(null);
    setError("");
    setCanRetry(false);
    try {
      if (!replace && details.mode === "VAULT_PIN")
        await vaultRequest("unlock", {
          scope: "vault",
          password: details.password,
        });
      const cover = await thumbnail(file);
      const upload = resume
        ? intent!
        : await vaultRequest<{ id: string; uploadUrl: string }>("upload", {
            ...details,
            metadata: {
              notes: details.notes,
              ...(details.category === "INSURANCE"
                ? { provider: details.issuer }
                : {}),
              ...(details.category === "SERVICE_RECORD"
                ? { serviceCentre: details.issuer }
                : {}),
            },
            size: file.size,
            mime: file.type,
            filename: file.name,
            ...(replace ? { documentId: replace.id } : {}),
          });
      setIntent(upload);
      const form = new FormData();
      form.set("file", file);
      if (cover) form.set("thumbnail", cover, "cover.webp");
      await new Promise<void>((resolve, reject) => {
        const request = new XMLHttpRequest();
        xhr.current = request;
        request.open("PUT", upload.uploadUrl);
        request.upload.onprogress = (e) => {
          if (e.lengthComputable)
            setProgress(Math.round((e.loaded / e.total) * 100));
        };
        request.onload = () => {
          if (request.status >= 200 && request.status < 300) {
            try {
              if (JSON.parse(request.responseText).ready) {
                resolve();
                return;
              }
            } catch {}
          }
          reject(
            new Error(
              "We couldn’t confirm the upload. Check its status before trying again.",
            ),
          );
        };
        request.onerror = () =>
          reject(
            new Error(
              "Upload interrupted. Check its status before trying again.",
            ),
          );
        request.onabort = () =>
          reject(
            new Error(
              "Upload cancelled. Check its status to confirm whether it completed.",
            ),
          );
        request.send(form);
      });
      toast.success(replace ? "New document version added" : "Document ready");
      onDone();
      onOpenChange(false);
      setFile(null);
      setStep(0);
      setIntent(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
      xhr.current = null;
    }
  }
  const field = (label: string, key: keyof typeof details, type = "text") => {
    if (type === "date") {
      return (
        <div className="grid gap-1.5 text-sm" key={key}>
          <label>
            <span>{label}</span>
          </label>
          <DatePicker
            value={details[key]}
            placeholder={`Select ${label.toLowerCase().replace(" *", "")}`}
            onChange={(val) => update(key, val)}
          />
        </div>
      );
    }
    return (
      <label className="grid gap-1.5 text-sm" key={key}>
        <span>{label}</span>
        <Input
          value={details[key]}
          type={type}
          maxLength={key === "title" ? 120 : 128}
          onChange={(e) => update(key, e.target.value)}
        />
      </label>
    );
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!busy) onOpenChange(v);
      }}
    >
      <DialogContent className="rounded-md sm:rounded-md sm:max-w-xl max-sm:top-0 max-sm:bottom-0 max-sm:max-h-none max-sm:rounded-none">
        <DialogHeader>
          <DialogTitle>{replace ? "Replace file" : "Add document"}</DialogTitle>
          <DialogDescription>
            {replace
              ? "The current copy stays in your version history."
              : "Store a private copy of an important vehicle document."}
          </DialogDescription>
        </DialogHeader>
        {!replace && (
          <ol
            className="flex flex-wrap gap-3 border-b border-border pb-3 text-xs"
            aria-label="Upload steps"
          >
            {["Document", "Details", "Security", "Review"].map((s, i) => (
              <li
                key={s}
                aria-current={i === step ? "step" : undefined}
                className={
                  i === step
                    ? "font-semibold text-[#cc785c]"
                    : "text-muted-foreground"
                }
              >
                {i + 1}. {s}
              </li>
            ))}
          </ol>
        )}
        {(step === 0 || replace) && (
          <div className="space-y-4">
            <label
              className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/30 p-4 text-center focus-within:ring-2 focus-within:ring-ring"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void choose(e.dataTransfer.files[0]);
              }}
            >
              <VaahanIcon name="chevron-up" size={26} />
              <span className="font-medium">
                {file ? file.name : "Browse or drag a document here"}
              </span>
              <span className="text-xs text-muted-foreground">
                PDF, JPG, PNG, WebP · Up to 20 MB · Original preserved
              </span>
              <input
                className="sr-only"
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => void choose(e.target.files?.[0])}
              />
            </label>
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md text-sm focus-within:ring-2 focus-within:ring-ring">
              <VaahanIcon name="camera" size={18} />
              Take photo
              <input
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={(e) => void choose(e.target.files?.[0])}
              />
            </label>
            {file && (
              <p className="text-xs text-muted-foreground">
                {sizeLabel(file.size)} ·{" "}
                {file.type === "application/pdf" ? "PDF" : "Image"}
              </p>
            )}
          </div>
        )}
        {step === 1 && !replace && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5 text-sm">
              <label>Document type</label>
              <Select
                value={details.category}
                onValueChange={(val) => {
                  update("category", val);
                  update("title", CATEGORIES[val as keyof typeof CATEGORIES]);
                }}
              >
                <SelectTrigger className="h-10 text-xs sm:text-sm bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {Object.entries(CATEGORIES).map(([v, l]) => (
                    <SelectItem
                      value={v}
                      key={v}
                      className="text-xs sm:text-sm"
                    >
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5 text-sm">
              <label>
                Vehicle
                {["DRIVING_LICENCE", "OTHER"].includes(details.category)
                  ? " (optional)"
                  : " *"}
              </label>
              <Select
                value={details.vehicleId || "__none__"}
                onValueChange={(val) =>
                  update("vehicleId", val === "__none__" ? "" : val)
                }
                disabled={!!vehicleId}
              >
                <SelectTrigger className="h-10 text-xs sm:text-sm bg-background border-border">
                  <SelectValue placeholder="Account document" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="__none__" className="text-xs sm:text-sm">
                    Account document
                  </SelectItem>
                  {data.vehicles.map((v) => (
                    <SelectItem
                      value={v.id}
                      key={v.id}
                      className="text-xs sm:text-sm"
                    >
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {field("Document name *", "title")}
            {field(
              details.category === "INSURANCE"
                ? "Policy number (stored masked)"
                : "Reference number (stored masked)",
              "number",
            )}
            {field("Issued on", "issued", "date")}
            {details.category === "INSURANCE" &&
              field("Cover starts", "validFrom", "date")}
            {field("Valid until (optional)", "expires", "date")}
            {field(
              details.category === "INSURANCE"
                ? "Insurance provider"
                : details.category === "SERVICE_RECORD"
                  ? "Service centre"
                  : "Issuer",
              "issuer",
            )}
            <label className="grid gap-1.5 text-sm sm:col-span-2">
              Notes
              <textarea
                className="vault-select min-h-20"
                value={details.notes}
                maxLength={1000}
                onChange={(e) => update("notes", e.target.value)}
              />
            </label>
          </div>
        )}
        {step === 2 && !replace && (
          <div className="space-y-4">
            <fieldset className="space-y-3">
              <legend className="mb-3 font-medium">
                Who can open this document?
              </legend>
              {[
                ["ACCOUNT", "My VaahanSafe account"],
                ["VAULT_PIN", "Require Document Vault PIN"],
                ["DOCUMENT_PASSWORD", "Require this document’s password"],
              ].map(([v, l]) => (
                <label
                  key={v}
                  className="flex min-h-11 items-center gap-3 rounded-md border border-border p-3 text-sm"
                >
                  <input
                    type="radio"
                    name="security"
                    checked={details.mode === v}
                    onChange={() => update("mode", v!)}
                  />
                  {l}
                </label>
              ))}
            </fieldset>
            {details.mode === "DOCUMENT_PASSWORD" &&
              field("Password (10–128 characters)", "password", "password")}
            {details.mode === "VAULT_PIN" &&
              data.vault.enabled &&
              field("Vault PIN", "password", "password")}
            {details.mode === "VAULT_PIN" && !data.vault.enabled && (
              <p className="text-sm text-muted-foreground">
                Set up a Vault PIN from the vault header before choosing this
                option.
              </p>
            )}
            <p className="text-xs leading-relaxed text-muted-foreground">
              Additional passwords control access through VaahanSafe. They do
              not encrypt the original with your password. No malware or
              government verification is claimed.
            </p>
          </div>
        )}
        {step === 3 && !replace && (
          <div className="space-y-3 rounded-md border border-border p-4 text-sm">
            <h3 className="font-medium">{details.title}</h3>
            <p>
              {file?.name} · {file && sizeLabel(file.size)}
            </p>
            <p>
              {data.vehicles.find((v) => v.id === details.vehicleId)?.label ||
                "Account document"}
            </p>
            <p>
              {details.mode === "ACCOUNT"
                ? "Protected by your account"
                : details.mode === "VAULT_PIN"
                  ? "Vault PIN required"
                  : "Document password required"}
            </p>
            <p className="text-xs text-muted-foreground">
              Only the last four characters of the reference number are stored.
            </p>
          </div>
        )}
        {busy && (
          <div role="status" aria-live="polite" className="space-y-2 text-sm">
            <p>
              {progress === null
                ? "Preparing a preview…"
                : progress === 100
                  ? "Confirming upload…"
                  : `Uploading ${progress}%`}
            </p>
            {progress !== null && (
              <progress
                className="w-full accent-[#cc785c]"
                max={100}
                value={progress}
              />
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => xhr.current?.abort()}
              disabled={!xhr.current}
            >
              Cancel upload
            </Button>
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          {intent && !busy ? (
            <>
              <Button variant="outline" onClick={() => void checkStatus()}>
                Check upload status
              </Button>
              {canRetry && (
                <Button onClick={() => void submit(true)}>Retry upload</Button>
              )}
            </>
          ) : (
            <>
              {step > 0 && !replace && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => setStep((s) => s - 1)}
                >
                  Back
                </Button>
              )}
              <Button
                disabled={
                  busy ||
                  !file ||
                  (!replace &&
                    step === 1 &&
                    (!details.title.trim() ||
                      (!["DRIVING_LICENCE", "OTHER"].includes(
                        details.category,
                      ) &&
                        !details.vehicleId))) ||
                  (!replace &&
                    step === 2 &&
                    details.mode === "VAULT_PIN" &&
                    !data.vault.enabled)
                }
                onClick={() => {
                  if (replace || step === 3) void submit();
                  else setStep((s) => s + 1);
                }}
              >
                {replace
                  ? "Upload replacement"
                  : step === 3
                    ? "Add document"
                    : "Continue"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
