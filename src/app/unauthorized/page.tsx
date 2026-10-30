import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "15px",
      }}
    >
      <h1>403 - Unauthorized</h1>

      <p>
        You do not have permission to access this page.
      </p>

      <Link href="/login">
        Back to Login
      </Link>
    </div>
  );
}