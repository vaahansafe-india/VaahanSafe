import { redirect } from "next/navigation";
import { getAdminIdentity } from "../../lib/session";
import { EmailVerification } from "../../components/EmailVerification";
import { VaahanSafeLogo } from "@vaahansafe/ui/brand";

export default async function VerifyEmail() {
  const identity = await getAdminIdentity();
  if (!identity) redirect("/login");
  if (identity.emailVerified) redirect("/");
  return (
    <main className="admin-login admin-verify" id="main-content">
      <aside
        className="admin-login-art"
        aria-label="Secure administrative access"
      >
        <div className="admin-login-story">
          <div className="admin-eyebrow">VaahanSafe · Operations console</div>
          <h2>
            Your workspace.
            <br />
            <em>Protected.</em>
          </h2>
          <p>
            Confirm your work email to access vehicle identities, customer care
            and everyday operations.
          </p>
        </div>
      </aside>
      <section className="admin-login-form">
        <header className="admin-login-header">
          <a href="https://vaahansafe.com" aria-label="VaahanSafe home">
            <VaahanSafeLogo size="md" variant="brand" showTagline={false} />
          </a>
          <form action="/api/auth/logout" method="post">
            <button className="admin-verify-signout" type="submit">
              Sign out
            </button>
          </form>
        </header>
        <div className="admin-login-content">
          <div className="admin-login-card admin-verify-card">
            <div className="admin-eyebrow">Complete secure sign-in</div>
            <h1>Check your inbox.</h1>
            <p className="admin-login-description">
              Your password is confirmed. Verify your email code to open the
              operations workspace.
            </p>
            <EmailVerification />
            <p className="admin-login-private">
              Your role determines what you can manage.
            </p>
          </div>
        </div>
        <footer className="admin-login-footer">
          <span>© VaahanSafe</span>
          <a href="https://vaahansafe.com/privacy">Privacy</a>
          <span>admin.vaahansafe.com</span>
        </footer>
      </section>
    </main>
  );
}
