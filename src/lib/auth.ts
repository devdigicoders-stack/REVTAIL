/** 
    Create JWT
    Verify JWT
    Define user session payload
**/

import { SignJWT, jwtVerify } from "jose";

const secretKey = process.env.JWT_SECRET;

if (!secretKey) {
  throw new Error("JWT_SECRET is not defined");
}

const encodedKey = new TextEncoder().encode(secretKey);

export type UserRole = "ADMIN" | "BRAND" | "TESTER";

export interface JWTPayload {
  userId: number;
  role: UserRole;
  email: string;
}

export async function createToken(payload: JWTPayload) {
  const token = await new SignJWT({
    userId: payload.userId,
    role: payload.role,
    email: payload.email,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("400d")
    .sign(encodedKey);

  return token;
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });

    return payload;
  } catch (error) {
    return null;
  }
}