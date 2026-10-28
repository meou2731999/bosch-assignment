import { apiMessages } from "../../shared/i18n/api-en";
import { randomBytes, scrypt as derive, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { ApiError } from "../http/errors";
const scrypt = promisify(derive);
export function validatePassword(password: string) {
  if (password.length < 12 || Buffer.byteLength(password) > 256)
    throw new ApiError(
      422,
      "PASSWORD",
      apiMessages.useAPasswordOfAtLeast12CharactersAnd,
    );
}
export async function hashPassword(password: string) {
  validatePassword(password);
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}
export async function verifyPassword(password: string, hash: string) {
  if (Buffer.byteLength(password) > 256) return false;
  const [salt, encoded] = hash.split(":");
  const expected = Buffer.from(encoded, "hex");
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
