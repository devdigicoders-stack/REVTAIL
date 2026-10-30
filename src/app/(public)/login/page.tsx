import Link from "next/link";
import "@/app/(public)/tester/signup/login.css";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="login-wrapper py-5">
      <div className="container d-flex justify-content-center" style={{ maxWidth: "520px" }}>
        <div className="login-card w-100 shadow-sm border">
          <div className="text-center mb-4 pb-2 border-bottom border-light-subtle">
            <span className="auth-badge">
              <i className="bi bi-shield-check me-1"></i> Member Login
            </span>
            <h1 className="login-title" style={{ fontSize: "24px" }}>
              Welcome Back
            </h1>
            <p className="login-subtitle mb-2">
              Sign in with your registered email or mobile to access your account.
            </p>
          </div>

          {/* Login Form Component */}
          <LoginForm />

          {/* Onboarding Switch Links */}
          <div className="pt-4 mt-3 border-top border-light-subtle">
            <p className="text-muted text-center mb-3" style={{ fontSize: "13px" }}>
              Don&apos;t have an account yet?
            </p>
            <div className="auth-switch-grid">
              <Link href="/tester/signup" className="btn-auth-switch">
                <span className="d-flex align-items-center">
                  <i className="bi bi-person-check me-2 fs-15 text-primary"></i>
                  <span>Join as Tester</span>
                </span>
                <i className="bi bi-arrow-right text-muted"></i>
              </Link>
              <Link href="/brand/signup" className="btn-auth-switch">
                <span className="d-flex align-items-center">
                  <i className="bi bi-briefcase me-2 fs-15 text-success"></i>
                  <span>Register Brand</span>
                </span>
                <i className="bi bi-arrow-right text-muted"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

