import Link from "next/link";
export default function NotFound() {
  return (
    <div className="admin-empty">
      <h3>This workspace does not exist.</h3>
      <p>Choose a module from the navigation or return to the dashboard.</p>
      <Link className="admin-button" href="/" style={{ marginTop: 18 }}>
        Return to dashboard
      </Link>
    </div>
  );
}
