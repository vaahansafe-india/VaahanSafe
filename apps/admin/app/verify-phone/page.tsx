import { redirect } from "next/navigation";
import { getAdminIdentity } from "../../lib/session";

// Preserve old sign-in bookmarks while using email verification for Admin.
export default async function VerifyPhone() {
  const identity = await getAdminIdentity();
  redirect(
    identity ? (identity.emailVerified ? "/" : "/verify-email") : "/login",
  );
}
