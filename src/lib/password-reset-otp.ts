import crypto from "crypto";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET is not defined");
}

const RESET_OTP_SECRET: string = jwtSecret;

export const PASSWORD_RESET_OTP_COOKIE =
  "revtail_password_reset_otp";

export const PASSWORD_RESET_VERIFIED_COOKIE =
  "revtail_password_reset_verified";

export const PASSWORD_RESET_OTP_EXPIRY_SECONDS = 5 * 60;
export const PASSWORD_RESET_VERIFIED_EXPIRY_SECONDS = 10 * 60;
export const PASSWORD_RESET_RESEND_SECONDS = 60;

const MAX_OTP_ATTEMPTS = 5;

type ResetChannel = "EMAIL" | "WHATSAPP";

type ResetOtpPayload = {
  purpose: "PASSWORD_RESET_OTP";
  userId: number;
  role: "ADMIN" | "BRAND" | "TESTER";
  identifier: string;
  channel: ResetChannel;
  otpHash: string;
  attempts: number;
  issuedAt: number;
  expiresAt: number;
};

type ResetVerifiedPayload = {
  purpose: "PASSWORD_RESET_VERIFIED";
  userId: number;
  role: "ADMIN" | "BRAND" | "TESTER";
  identifier: string;
  issuedAt: number;
  expiresAt: number;
};

function sign(value: string) {
  return crypto
    .createHmac("sha256", RESET_OTP_SECRET)
    .update(value)
    .digest("hex");
}

function encodePayload(
  payload: ResetOtpPayload | ResetVerifiedPayload
) {
  const encoded = Buffer
    .from(JSON.stringify(payload))
    .toString("base64url");

  return `${encoded}.${sign(encoded)}`;
}

function decodePayload<T>(
  token: string | undefined
): T | null {
  try {
    if (!token) return null;

    const [encoded, signature] = token.split(".");

    if (!encoded || !signature) return null;

    const expected = sign(encoded);

    const a = Buffer.from(signature, "utf8");
    const b = Buffer.from(expected, "utf8");

    if (a.length !== b.length) return null;

    if (!crypto.timingSafeEqual(a, b)) {
      return null;
    }

    return JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as T;
  } catch {
    return null;
  }
}

function hashOtp(
  userId: number,
  otp: string
) {
  return crypto
    .createHmac("sha256", RESET_OTP_SECRET)
    .update(`${userId}:${otp}`)
    .digest("hex");
}

export function generatePasswordResetOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

export function normalizeResetIdentifier(
  value: unknown
) {
  const raw = String(value ?? "").trim();

  if (raw.includes("@")) {
    return raw.toLowerCase();
  }

  const mobile = raw.replace(/[\s-]/g, "");

  return mobile.startsWith("+91")
    ? mobile.slice(3)
    : mobile;
}

export function createPasswordResetOtpToken(params: {
  userId: number;
  role: "ADMIN" | "BRAND" | "TESTER";
  identifier: string;
  channel: ResetChannel;
  otp: string;
}) {
  const now = Date.now();

  const payload: ResetOtpPayload = {
    purpose: "PASSWORD_RESET_OTP",
    userId: params.userId,
    role: params.role,
    identifier: params.identifier,
    channel: params.channel,
    otpHash: hashOtp(params.userId, params.otp),
    attempts: 0,
    issuedAt: now,
    expiresAt:
      now + PASSWORD_RESET_OTP_EXPIRY_SECONDS * 1000,
  };

  return encodePayload(payload);
}

export function getPasswordResetResendWaitSeconds(
  token: string | undefined,
  identifier: string
) {
  const payload =
    decodePayload<ResetOtpPayload>(token);

  if (
    !payload ||
    payload.purpose !== "PASSWORD_RESET_OTP" ||
    payload.identifier !== identifier
  ) {
    return 0;
  }

  const elapsedSeconds = Math.floor(
    (Date.now() - payload.issuedAt) / 1000
  );

  return Math.max(
    0,
    PASSWORD_RESET_RESEND_SECONDS - elapsedSeconds
  );
}

export function verifyPasswordResetOtp(
  token: string | undefined,
  identifier: string,
  otp: string
):
  | {
      success: true;
      userId: number;
      role: "ADMIN" | "BRAND" | "TESTER";
    }
  | {
      success: false;
      reason:
        | "INVALID"
        | "EXPIRED"
        | "IDENTIFIER_MISMATCH"
        | "TOO_MANY_ATTEMPTS";
      newToken?: string;
    } {
  const payload =
    decodePayload<ResetOtpPayload>(token);

  if (
    !payload ||
    payload.purpose !== "PASSWORD_RESET_OTP"
  ) {
    return {
      success: false,
      reason: "INVALID",
    };
  }

  if (payload.identifier !== identifier) {
    return {
      success: false,
      reason: "IDENTIFIER_MISMATCH",
    };
  }

  if (Date.now() > payload.expiresAt) {
    return {
      success: false,
      reason: "EXPIRED",
    };
  }

  if (payload.attempts >= MAX_OTP_ATTEMPTS) {
    return {
      success: false,
      reason: "TOO_MANY_ATTEMPTS",
    };
  }

  const enteredHash =
    hashOtp(payload.userId, otp);

  const valid = crypto.timingSafeEqual(
    Buffer.from(enteredHash, "utf8"),
    Buffer.from(payload.otpHash, "utf8")
  );

  if (!valid) {
    const updatedPayload: ResetOtpPayload = {
      ...payload,
      attempts: payload.attempts + 1,
    };

    return {
      success: false,
      reason:
        updatedPayload.attempts >= MAX_OTP_ATTEMPTS
          ? "TOO_MANY_ATTEMPTS"
          : "INVALID",
      newToken: encodePayload(updatedPayload),
    };
  }

  return {
    success: true,
    userId: payload.userId,
    role: payload.role,
  };
}

export function createPasswordResetVerifiedToken(params: {
  userId: number;
  role: "ADMIN" | "BRAND" | "TESTER";
  identifier: string;
}) {
  const now = Date.now();

  const payload: ResetVerifiedPayload = {
    purpose: "PASSWORD_RESET_VERIFIED",
    userId: params.userId,
    role: params.role,
    identifier: params.identifier,
    issuedAt: now,
    expiresAt:
      now + PASSWORD_RESET_VERIFIED_EXPIRY_SECONDS * 1000,
  };

  return encodePayload(payload);
}

export function verifyPasswordResetVerifiedToken(
  token: string | undefined
) {
  const payload =
    decodePayload<ResetVerifiedPayload>(token);

  if (
    !payload ||
    payload.purpose !== "PASSWORD_RESET_VERIFIED"
  ) {
    return null;
  }

  if (Date.now() > payload.expiresAt) {
    return null;
  }

  return payload;
}
