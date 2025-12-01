import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { storage } from "./storage";
import type { User } from "@shared/schema";

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY_HOURS = 24;
const PASSWORD_RESET_EXPIRY_HOURS = 1;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function getTokenExpiry(hours: number = TOKEN_EXPIRY_HOURS): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export interface RegisterResult {
  success: boolean;
  user?: User;
  error?: string;
  verificationToken?: string;
}

export async function registerUser(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
  phone?: string
): Promise<RegisterResult> {
  const existingUser = await storage.getUserByEmail(email);
  if (existingUser) {
    return { success: false, error: "כתובת המייל כבר קיימת במערכת" };
  }

  if (password.length < 8) {
    return { success: false, error: "הסיסמא חייבת להכיל לפחות 8 תווים" };
  }

  const passwordHash = await hashPassword(password);
  const verificationToken = generateToken();
  const verificationExpiry = getTokenExpiry(TOKEN_EXPIRY_HOURS);

  const isAdmin = email === "ydisolution@gmail.com" ? "true" : "false";

  const user = await storage.upsertUser({
    email,
    passwordHash,
    firstName: firstName || null,
    lastName: lastName || null,
    phone: phone || null,
    isAdmin,
    isEmailVerified: "false",
    emailVerificationToken: verificationToken,
    emailVerificationExpires: verificationExpiry,
  });

  return { success: true, user, verificationToken };
}

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const user = await storage.getUserByEmail(email);
  if (!user) {
    return { success: false, error: "המייל או הסיסמא שגויים" };
  }

  if (!user.passwordHash) {
    return { success: false, error: "המייל או הסיסמא שגויים" };
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { success: false, error: "המייל או הסיסמא שגויים" };
  }

  return { success: true, user };
}

export interface VerifyEmailResult {
  success: boolean;
  error?: string;
}

export async function verifyEmail(token: string): Promise<VerifyEmailResult> {
  const user = await storage.getUserByVerificationToken(token);
  
  if (!user) {
    return { success: false, error: "קוד אימות לא תקין" };
  }
  
  if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
    return { success: false, error: "קוד האימות פג תוקף. אנא בקש קוד חדש" };
  }

  await storage.updateUser(user.id, {
    isEmailVerified: "true",
    emailVerificationToken: null,
    emailVerificationExpires: null,
  });

  return { success: true };
}

export async function verifyEmailByUserId(userId: string, token: string): Promise<VerifyEmailResult> {
  const user = await storage.getUser(userId);
  if (!user) {
    return { success: false, error: "משתמש לא נמצא" };
  }

  if (user.emailVerificationToken !== token) {
    return { success: false, error: "קוד אימות לא תקין" };
  }

  if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
    return { success: false, error: "קוד האימות פג תוקף. אנא בקש קוד חדש" };
  }

  await storage.updateUser(user.id, {
    isEmailVerified: "true",
    emailVerificationToken: null,
    emailVerificationExpires: null,
  });

  return { success: true };
}

export interface RequestPasswordResetResult {
  success: boolean;
  resetToken?: string;
  error?: string;
}

export async function requestPasswordReset(email: string): Promise<RequestPasswordResetResult> {
  const user = await storage.getUserByEmail(email);
  if (!user) {
    return { success: true };
  }

  const resetToken = generateToken();
  const resetExpiry = getTokenExpiry(PASSWORD_RESET_EXPIRY_HOURS);

  await storage.updateUser(user.id, {
    passwordResetToken: resetToken,
    passwordResetExpires: resetExpiry,
  });

  return { success: true, resetToken };
}

export interface ResetPasswordResult {
  success: boolean;
  error?: string;
}

export async function resetPassword(token: string, newPassword: string): Promise<ResetPasswordResult> {
  if (newPassword.length < 8) {
    return { success: false, error: "הסיסמא חייבת להכיל לפחות 8 תווים" };
  }

  const user = await storage.getUserByPasswordResetToken(token);
  
  if (!user) {
    return { success: false, error: "קוד איפוס לא תקין" };
  }
  
  if (user.passwordResetExpires && new Date() > user.passwordResetExpires) {
    return { success: false, error: "קוד האיפוס פג תוקף. אנא בקש קוד חדש" };
  }

  const passwordHash = await hashPassword(newPassword);

  await storage.updateUser(user.id, {
    passwordHash,
    passwordResetToken: null,
    passwordResetExpires: null,
  });

  return { success: true };
}

export async function resendVerificationEmail(userId: string): Promise<{ success: boolean; token?: string; error?: string }> {
  const user = await storage.getUser(userId);
  if (!user) {
    return { success: false, error: "משתמש לא נמצא" };
  }

  if (user.isEmailVerified === "true") {
    return { success: false, error: "המייל כבר אומת" };
  }

  const verificationToken = generateToken();
  const verificationExpiry = getTokenExpiry(TOKEN_EXPIRY_HOURS);

  await storage.updateUser(user.id, {
    emailVerificationToken: verificationToken,
    emailVerificationExpires: verificationExpiry,
  });

  return { success: true, token: verificationToken };
}
