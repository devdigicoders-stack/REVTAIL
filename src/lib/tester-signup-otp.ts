import {
  createHmac,
  randomInt,
  timingSafeEqual,
} from "crypto";

export const TESTER_SIGNUP_OTP_COOKIE =
  "tester_signup_otp";

export const TESTER_SIGNUP_VERIFIED_COOKIE =
  "tester_signup_verified";

export const OTP_EXPIRY_SECONDS =
  5 * 60;

export const OTP_RESEND_SECONDS =
  60;

export const VERIFIED_EXPIRY_SECONDS =
  10 * 60;

export const MAX_OTP_ATTEMPTS =
  5;

type OtpChallengePayload = {
  type: "otp";

  mobile: string;

  otpHash: string;

  sentAt: number;

  expiresAt: number;

  attempts: number;
};

type VerifiedPayload = {
  type: "verified";

  mobile: string;

  expiresAt: number;
};


// ============================================================
// SECRET
// ============================================================

function getSecret() {
  const secret =
    process.env
      .TESTER_SIGNUP_OTP_SECRET;

  if (!secret) {
    throw new Error(
      "TESTER_SIGNUP_OTP_SECRET is not configured."
    );
  }

  return secret;
}


// ============================================================
// BASE64 URL
// ============================================================

function encodeBase64Url(
  value: string
) {
  return Buffer.from(
    value,
    "utf8"
  ).toString(
    "base64url"
  );
}


function decodeBase64Url(
  value: string
) {
  return Buffer.from(
    value,
    "base64url"
  ).toString(
    "utf8"
  );
}


// ============================================================
// SIGN TOKEN
// ============================================================

function signPayload(
  payload: object
) {
  const encodedPayload =
    encodeBase64Url(
      JSON.stringify(
        payload
      )
    );

  const signature =
    createHmac(
      "sha256",
      getSecret()
    )
      .update(
        encodedPayload
      )
      .digest(
        "base64url"
      );

  return `${encodedPayload}.${signature}`;
}


// ============================================================
// VERIFY SIGNATURE
// ============================================================

function readSignedPayload<T>(
  token:
    | string
    | undefined
    | null
): T | null {
  if (!token) {
    return null;
  }

  const parts =
    token.split(".");

  if (
    parts.length !== 2
  ) {
    return null;
  }

  const [
    encodedPayload,
    suppliedSignature,
  ] = parts;

  const expectedSignature =
    createHmac(
      "sha256",
      getSecret()
    )
      .update(
        encodedPayload
      )
      .digest(
        "base64url"
      );

  const suppliedBuffer =
    Buffer.from(
      suppliedSignature
    );

  const expectedBuffer =
    Buffer.from(
      expectedSignature
    );

  if (
    suppliedBuffer.length !==
    expectedBuffer.length
  ) {
    return null;
  }

  if (
    !timingSafeEqual(
      suppliedBuffer,
      expectedBuffer
    )
  ) {
    return null;
  }

  try {
    return JSON.parse(
      decodeBase64Url(
        encodedPayload
      )
    ) as T;
  } catch {
    return null;
  }
}


// ============================================================
// NORMALIZE TESTER MOBILE
// ============================================================

export function normalizeTesterMobile(
  mobile: string
) {
  const rawMobile =
    String(mobile)
      .trim()
      .replace(
        /[\s-]/g,
        ""
      );

  return rawMobile.startsWith(
    "+91"
  )
    ? rawMobile.slice(3)
    : rawMobile;
}


// ============================================================
// GENERATE OTP
// ============================================================

export function generateSignupOtp() {
  return String(
    randomInt(
      100000,
      1000000
    )
  );
}


// ============================================================
// HASH OTP
// ============================================================

function hashOtp(
  mobile: string,
  otp: string
) {
  return createHmac(
    "sha256",
    getSecret()
  )
    .update(
      `${mobile}:${otp}`
    )
    .digest(
      "hex"
    );
}


// ============================================================
// CREATE OTP CHALLENGE
// ============================================================

export function createOtpChallenge(
  mobile: string,
  otp: string
) {
  const now =
    Date.now();

  const payload:
    OtpChallengePayload = {
      type:
        "otp",

      mobile,

      otpHash:
        hashOtp(
          mobile,
          otp
        ),

      sentAt:
        now,

      expiresAt:
        now +
        OTP_EXPIRY_SECONDS *
          1000,

      attempts:
        0,
    };

  return signPayload(
    payload
  );
}


// ============================================================
// READ OTP CHALLENGE
// ============================================================

export function readOtpChallenge(
  token:
    | string
    | undefined
    | null
) {
  const payload =
    readSignedPayload<
      OtpChallengePayload
    >(
      token
    );

  if (
    !payload ||
    payload.type !==
      "otp"
  ) {
    return null;
  }

  return payload;
}


// ============================================================
// RESEND WAIT
// ============================================================

export function getOtpResendWaitSeconds(
  token:
    | string
    | undefined
    | null,
  mobile: string
) {
  const payload =
    readOtpChallenge(
      token
    );

  if (
    !payload ||
    payload.mobile !==
      mobile
  ) {
    return 0;
  }

  const elapsedSeconds =
    Math.floor(
      (
        Date.now() -
        payload.sentAt
      ) /
        1000
    );

  return Math.max(
    0,
    OTP_RESEND_SECONDS -
      elapsedSeconds
  );
}


// ============================================================
// VERIFY OTP
// ============================================================

export function verifyOtpChallenge(
  token:
    | string
    | undefined
    | null,
  mobile: string,
  otp: string
) {
  const payload =
    readOtpChallenge(
      token
    );

  if (!payload) {
    return {
      success:
        false,

      reason:
        "INVALID" as const,

      newToken:
        null,
    };
  }

  if (
    payload.mobile !==
    mobile
  ) {
    return {
      success:
        false,

      reason:
        "MOBILE_MISMATCH" as const,

      newToken:
        null,
    };
  }

  if (
    Date.now() >
    payload.expiresAt
  ) {
    return {
      success:
        false,

      reason:
        "EXPIRED" as const,

      newToken:
        null,
    };
  }

  if (
    payload.attempts >=
    MAX_OTP_ATTEMPTS
  ) {
    return {
      success:
        false,

      reason:
        "TOO_MANY_ATTEMPTS" as const,

      newToken:
        null,
    };
  }

  const expectedHash =
    hashOtp(
      mobile,
      otp
    );

  const actualBuffer =
    Buffer.from(
      payload.otpHash
    );

  const expectedBuffer =
    Buffer.from(
      expectedHash
    );

  const matches =
    actualBuffer.length ===
      expectedBuffer.length &&
    timingSafeEqual(
      actualBuffer,
      expectedBuffer
    );

  if (matches) {
    return {
      success:
        true,

      reason:
        "VERIFIED" as const,

      newToken:
        null,
    };
  }

  const updatedPayload:
    OtpChallengePayload = {
      ...payload,

      attempts:
        payload.attempts +
        1,
    };

  return {
    success:
      false,

    reason:
      "INCORRECT" as const,

    newToken:
      signPayload(
        updatedPayload
      ),
  };
}


// ============================================================
// CREATE VERIFIED TOKEN
// ============================================================

export function createVerifiedToken(
  mobile: string
) {
  const payload:
    VerifiedPayload = {
      type:
        "verified",

      mobile,

      expiresAt:
        Date.now() +
        VERIFIED_EXPIRY_SECONDS *
          1000,
    };

  return signPayload(
    payload
  );
}


// ============================================================
// CHECK VERIFIED MOBILE
// ============================================================

export function verifySignupVerifiedToken(
  token:
    | string
    | undefined
    | null,
  mobile: string
) {
  const payload =
    readSignedPayload<
      VerifiedPayload
    >(
      token
    );

  if (
    !payload ||
    payload.type !==
      "verified"
  ) {
    return false;
  }

  if (
    payload.mobile !==
    mobile
  ) {
    return false;
  }

  if (
    Date.now() >
    payload.expiresAt
  ) {
    return false;
  }

  return true;
}