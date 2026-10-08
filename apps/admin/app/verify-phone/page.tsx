import { redirect } from "next/navigation";
import Image from "next/image";
import { DOMAINS } from "@vaahansafe/config";
import { VaahanSafeLogo } from "@vaahansafe/ui/brand";
import { VaahanIcon } from "@vaahansafe/icons";
import { getAdminIdentity } from "../../lib/session";
import { PhoneVerification } from "../../components/PhoneVerification";
export default async function VerifyPhone() {
  const identity = await getAdminIdentity();
  if (!identity) redirect("/login");
  if (identity.phoneVerified) redirect("/");
  const webUrl = DOMAINS.web || "https://vaahansafe.com";
  return (
    <main className="admin-login admin-verify" id="main-content">
      <aside
        className="admin-login-art"
        aria-label="Secure administrative access"
      >
        <div className="admin-login-story">
          <div className="admin-eyebrow">
            <span aria-hidden="true" />
            VaahanSafe · Operations console
          </div>
          <h2>
            Your access.
            <br />
            <em>Protected.</em>
          </h2>
          <p>
            One extra step to protect the people, identities and everyday
            operations in your care.
          </p>
        </div>
        <div
          className="admin-login-illustration admin-verify-illustration"
          aria-hidden="true"
        >
          <Image
            src="/images/mobile-verification-paper.svg"
            width={520}
            height={400}
            sizes="(min-width: 1024px) 45vw, 1px"
            alt=""
            priority
            draggable={false}
          />
        </div>
        <div className="admin-verify-assurance">
          <VaahanIcon name="shield-check" size={20} />
          <div>
            <strong>A second layer of protection</strong>
            <p>
              Your verified mobile helps secure sign-in and sensitive
              administrative actions.
            </p>
          </div>
        </div>
        <div className="admin-login-caption">
          <span>Private access</span>
          <span aria-hidden="true" />
          <span>Verified identity</span>
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
          <form action="/api/auth/logout" method="post">
            <button className="admin-verify-signout" type="submit">
              <span>Sign out</span>
              <VaahanIcon name="logout" size={16} />
            </button>
          </form>
        </header>
        <div className="admin-login-content">
          <div className="admin-login-card admin-verify-card">
            <ol className="admin-verify-progress" aria-label="Sign-in progress">
              <li className="is-complete">
                <VaahanIcon name="check" size={16} />
                <span>Work account</span>
              </li>
              <li aria-current="step">
                <span className="admin-verify-progress-number">02</span>
                <span>Mobile verification</span>
              </li>
            </ol>
            <div className="admin-verify-mobile-art" aria-hidden="true">
              <Image
                src="/images/mobile-verification-paper.svg"
                width={220}
                height={170}
                sizes="180px"
                alt=""
                draggable={false}
              />
            </div>
            <div className="admin-eyebrow">
              <span aria-hidden="true" />
              Complete secure sign-in
            </div>
            <h1>One last step.</h1>
            <p className="admin-login-description">
              Verify your mobile number to open your operations workspace.
            </p>
            <PhoneVerification />
            <div className="admin-verify-account">
              <span className="admin-verify-account-icon" aria-hidden="true">
                <VaahanIcon name="user" size={18} />
              </span>
              <div>
                <span>Signed in as</span>
                <strong>{identity.name}</strong>
                <p>{identity.email}</p>
              </div>
              <VaahanIcon name="lock" size={15} />
            </div>
            <p className="admin-login-private">
              <VaahanIcon name="shield-check" size={15} />
              Access opens after mobile confirmation. Your role determines what
              you can manage.
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
