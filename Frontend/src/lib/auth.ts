import NextAuth, { AuthError } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq } from "drizzle-orm";
import type { User } from "@/lib/schema";

// https://lord.technology/2024/02/21/hashing-passwords-on-cloudflare-workers.html
export async function hashPassword(
  password: string,
  providedSalt?: Uint8Array,
): Promise<string> {
  const encoder = new TextEncoder();
  // Use provided salt if available, otherwise generate a new one
  const salt = providedSalt || crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
  const exportedKey = (await crypto.subtle.exportKey(
    "raw",
    key,
  )) as ArrayBuffer;
  const hashBuffer = new Uint8Array(exportedKey);
  const hashArray = Array.from(hashBuffer);
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${saltHex}:${hashHex}`;
}

export async function isPasswordCorrect(
  storedHash: string,
  passwordAttempt: string,
): Promise<boolean> {
  const [saltHex, originalHash] = storedHash.split(":");
  const matchResult = saltHex.match(/.{1,2}/g);
  if (!matchResult) {
    throw new Error("Invalid salt format");
  }
  const salt = new Uint8Array(matchResult.map((byte) => parseInt(byte, 16)));
  const attemptHashWithSalt = await hashPassword(passwordAttempt, salt);
  const [, attemptHash] = attemptHashWithSalt.split(":");
  return attemptHash === originalHash;
}

async function getUserFromDb(
  email: string,
  passwordAttempt: string,
): Promise<User> {
  const users = await db
    .select()
    .from(schema.users)
    .where(eq(schema.lower(schema.users.email), email.toLowerCase()));
  if (!users || users.length === 0) {
    throw new Error(`User with email "${email}" not found`);
  }
  if (users.length > 1) {
    throw new Error(`Multiple users with email "${email}" found`);
  }

  const user = users[0];

  const passwords = await db
    .select()
    .from(schema.passwords)
    .where(eq(schema.passwords.userId, user.id));
  if (!passwords || passwords.length === 0) {
    throw new Error(`Password for user with id "${user.id}" not found`);
  }
  if (passwords.length > 1) {
    throw new Error(`Multiple passwords for user with id "${user.id}" found`);
  }
  const password = passwords[0];

  if (await isPasswordCorrect(password.password, passwordAttempt)) {
    return user;
  }
  throw new Error("Incorrect password");
}

export const INVALID_CREDENTIALS_ERROR_TYPE = "CredentialsSignin";

// See https://github.com/nextauthjs/next-auth/issues/9900.
export class InvalidCredentials extends AuthError {
  public readonly kind = "signIn";

  constructor() {
    super("Invalid credentials");
    this.type = INVALID_CREDENTIALS_ERROR_TYPE;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  basePath: "/auth",
  providers: [
    Credentials({
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      credentials: {
        email: { label: "Email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (typeof credentials.email !== "string") {
          throw new InvalidCredentials();
        }

        if (typeof credentials.password !== "string") {
          throw new InvalidCredentials();
        }

        // logic to verify if user exists
        let user;
        try {
          user = await getUserFromDb(credentials.email, credentials.password);
        } catch (err: unknown) {
          throw new InvalidCredentials();
        }

        // return user object with the their profile data
        return user;
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
});
