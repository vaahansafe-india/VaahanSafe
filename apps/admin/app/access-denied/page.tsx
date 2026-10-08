import Link from "next/link";
export default function AccessDenied() {
  return (
    <div className="admin-empty">
      <h3>This workspace requires another role.</h3>
      <p>
        Your account does not have permission to view these records. Contact
        your platform administrator if you need access.
      </p>
      <Link href="/" className="admin-button" style={{ marginTop: 20 }}>
        Return to dashboard
      </Link>
    </div>
  );
}
