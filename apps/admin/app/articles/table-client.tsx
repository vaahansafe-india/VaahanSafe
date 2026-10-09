"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { AdminDialog } from "../../components/AdminDialog";
import { EmailVerification } from "../../components/EmailVerification";
import { StatusTag } from "../../components/RecordTable";
import { AdminSelect } from "../../components/AdminSelect";
import { useQuery } from "@tanstack/react-query";
import { getAdminData } from "../../lib/client-api";
interface ArticleItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categorySlug: string;
  status?: string;
  readingTime?: string;
  author?: { name: string; role?: string };
}
export function ArticlesTableClient({
  initialArticles,
  categories,
}: {
  initialArticles: ArticleItem[];
  categories: Array<{ id: string; slug: string; name: string; count: number }>;
}) {
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState(""),
    [status, setStatus] = useState(""),
    [action, setAction] = useState<{
      article: ArticleItem;
      kind: "publish" | "archive";
    } | null>(null),
    [reason, setReason] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [stepUp, setStepUp] = useState(false);
  const editorial = useQuery({
    queryKey: ["admin-articles"],
    queryFn: ({ signal }) =>
      getAdminData<{ articles: ArticleItem[] }>("/api/articles", signal),
    initialData: { articles: initialArticles },
  });
  const articles = editorial.isError ? [] : editorial.data.articles;
  const close = useCallback(() => {
    setAction(null);
    setError("");
    setReason("");
    setConfirmed(false);
    setStepUp(false);
  }, []);
  const apply = async () => {
    if (!action) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/articles/${action.article.id}${action.kind === "publish" ? "/publish" : ""}`,
        {
          method: action.kind === "publish" ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publish: action.article.status !== "PUBLISHED",
            reason,
            confirmed,
          }),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        if (result.error?.code === "STEP_UP_REQUIRED") {
          setStepUp(true);
          return;
        }
        throw new Error(
          result.error?.message || "We couldn't change this article.",
        );
      }
      await editorial.refetch();
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const filtered = articles.filter(
    (a) =>
      (!category || a.categorySlug === category) &&
      (!status || a.status === status) &&
      (!search ||
        `${a.title} ${a.slug} ${a.author?.name || ""}`
          .toLowerCase()
          .includes(search.toLowerCase())),
  );
  return (
    <section className="admin-panel">
      <div className="admin-toolbar">
        <input
          aria-label="Search articles"
          placeholder="Search by title or URL key…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <AdminSelect
          label="Article category"
          value={category}
          onValueChange={setCategory}
          options={[
            { value: "", label: "All categories" },
            ...categories.map((c) => ({ value: c.slug, label: c.name })),
          ]}
        />
        <AdminSelect
          label="Publication status"
          value={status}
          onValueChange={setStatus}
          options={[
            { value: "", label: "All statuses" },
            ...["DRAFT", "PUBLISHED", "ARCHIVED"].map((s) => ({
              value: s,
              label: s,
            })),
          ]}
        />
        <button
          className="admin-button"
          disabled={editorial.isFetching}
          onClick={() => void editorial.refetch()}
        >
          Refresh
        </button>
      </div>
      {editorial.isError && (
        <div className="admin-notice error" role="alert">
          Editorial records are temporarily unavailable. Use Refresh to try
          again.
        </div>
      )}
      {filtered.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Article</th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong style={{ fontWeight: 500 }}>{a.title}</strong>
                    <small
                      style={{
                        display: "block",
                        marginTop: 5,
                        color: "#929b88",
                      }}
                    >
                      {a.slug}
                    </small>
                  </td>
                  <td>{a.category}</td>
                  <td>
                    <StatusTag value={a.status} />
                  </td>
                  <td>
                    <div className="admin-actions">
                      <Link
                        className="admin-link"
                        href={`/articles/${a.id}/edit`}
                      >
                        Edit
                      </Link>
                      <button
                        className="admin-link"
                        onClick={() =>
                          setAction({ article: a, kind: "publish" })
                        }
                      >
                        {a.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                      </button>
                      {a.status !== "ARCHIVED" && (
                        <button
                          className="admin-link"
                          onClick={() =>
                            setAction({ article: a, kind: "archive" })
                          }
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-empty">
          <h3>No matching articles</h3>
          <p>Create a story or try another filter.</p>
        </div>
      )}
      <div className="admin-table-foot">
        <span>{filtered.length} articles</span>
        <span>Public changes require fresh verification</span>
      </div>
      {action && (
        <AdminDialog
          title={
            action.kind === "archive"
              ? "Archive article"
              : "Change publication status"
          }
          onClose={close}
        >
          {stepUp ? (
            <EmailVerification stepUp onVerified={() => setStepUp(false)} />
          ) : (
            <>
              <p>
                Review the change for “{action.article.title}”. Archiving
                preserves the article and its audit history.
              </p>
              <label htmlFor="article-reason">Reason</label>
              <textarea
                id="article-reason"
                value={reason}
                maxLength={500}
                onChange={(e) => setReason(e.target.value)}
              />
              <label>
                <input
                  type="checkbox"
                  style={{ width: "auto", marginRight: 8 }}
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                I confirm this publication change.
              </label>
              <div className="admin-actions">
                <button className="admin-button" onClick={close}>
                  Cancel
                </button>
                <button
                  className="admin-button primary"
                  disabled={busy || !confirmed || reason.trim().length < 10}
                  onClick={() => void apply()}
                >
                  Confirm change
                </button>
              </div>
            </>
          )}
          {error && (
            <div className="admin-notice error" role="alert">
              {error}
            </div>
          )}
        </AdminDialog>
      )}
    </section>
  );
}
