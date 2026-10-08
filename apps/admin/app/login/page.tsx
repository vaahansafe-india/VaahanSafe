import Image from "next/image";
import { redirect } from "next/navigation";
import { DOMAINS } from "@vaahansafe/config";
import { VaahanSafeLogo } from "@vaahansafe/ui/brand";
import { VaahanIcon } from "@vaahansafe/icons";
import { EmailPasswordSignIn } from "../../components/EmailPasswordSignIn";
import { getAdminIdentity } from "../../lib/session";
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const identity = await getAdminIdentity();
  if (identity) redirect(identity.phoneVerified ? "/" : "/verify-phone");
  const { error } = await searchParams;
  const webUrl = DOMAINS.web || "https://vaahansafe.com";
  return (
    <main className="admin-login" id="main-content">
      <aside className="admin-login-art" aria-label="Operations console">
        <div className="admin-login-story">
          <div className="admin-eyebrow">
            <span aria-hidden="true" />
            VaahanSafe · Operations console
          </div>
          <h2>
            Every detail.
            <br />
            <em>A safer journey.</em>
          </h2>
          <p>
            A shared workspace for the people managing vehicle identities,
            customer care and everyday operations.
          </p>
        </div>
        <div className="admin-login-illustration" aria-hidden="true">
          <Image
            src="/images/operations-paper.png"
            width={600}
            height={400}
            sizes="(min-width: 1024px) 48vw, 1px"
            alt=""
            priority
            draggable={false}
          />
        </div>
        <div className="admin-login-caption">
          <span>Care in every action</span>
          <span aria-hidden="true" />
          <span>Safety in every journey</span>
        </div>
      </aside>
      <section className="admin-login-form">
        <header className="admin-login-header">
          <a href={webUrl} aria-label="VaahanSafe home">
            <VaahanSafeLogo
              size="md"
              variant="brand"
              showTagline={false}
              aria-hidden="true"
            />
          </a>
          <a
            className="admin-login-back"
            href={webUrl}
            aria-label="Back to VaahanSafe website"
          >
            <span>Back to website</span>
            <VaahanIcon name="external-link" size={15} />
          </a>
        </header>
        <div className="admin-login-content">
          <div className="admin-login-card">
            <div className="admin-eyebrow">
              <span aria-hidden="true" />
              Administrative access
            </div>
            <h1>Welcome back.</h1>
            <p className="admin-login-description">
              Sign in to your operations workspace with your approved work email
              and password.
            </p>
            {error && (
              <div className="admin-notice error" role="alert">
                We couldn&apos;t complete sign-in right now. Please try again or
                contact your platform administrator.
              </div>
            )}
            <EmailPasswordSignIn />
            <p className="admin-login-account-note">
              Use your organization&apos;s authorized account.
            </p>
            <div className="admin-login-verification">
              <div className="admin-login-verification-heading">
                <VaahanIcon name="lock" size={15} />
                <span>Secure access, in two steps</span>
              </div>
              <ol>
                <li>
                  <span className="admin-login-step" aria-hidden="true">
                    01
                  </span>
                  <span>Email and password</span>
                </li>
                <li>
                  <span className="admin-login-step" aria-hidden="true">
                    02
                  </span>
                  <span>Verify your mobile number</span>
                </li>
              </ol>
            </div>
            <p className="admin-login-private">
              <VaahanIcon name="eye-off" size={14} />
              Private workspace. Access is limited to your role.
            </p>
          </div>
        </div>
        <footer className="admin-login-footer">
          <span>© VaahanSafe</span>
          <a href={`${webUrl}/privacy`}>Privacy</a>
          <span className="admin-login-domain">admin.vaahansafe.com</span>
        </footer>
      </section>
    </main>
  );
}
