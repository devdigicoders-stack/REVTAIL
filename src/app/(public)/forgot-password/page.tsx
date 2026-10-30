import Link from "next/link";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import "@/app/(public)/tester/signup/login.css";

export default function ForgotPasswordPage() {
  return (
    <div className="login-wrapper py-5">
      <div className="container d-flex justify-content-center" style={{ maxWidth: "520px" }}>
        <div className="login-card w-100 shadow-sm border">
          <div className="text-center mb-4 pb-2 border-bottom border-light-subtle">
            <span className="auth-badge">
              <i className="bi bi-key me-1"></i> Account Recovery
            </span>
            <h1 className="login-title" style={{ fontSize: "24px" }}>
              Reset Password
            </h1>
            <p className="login-subtitle mb-2">
              Enter your registered email or mobile to receive password reset instructions.
            </p>
          </div>

          <ForgotPasswordForm />

          <div className="pt-4 mt-3 border-top border-light-subtle text-center">
            <Link href="/login" className="btn-auth-switch">
              <i className="bi bi-arrow-left me-1"></i> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

