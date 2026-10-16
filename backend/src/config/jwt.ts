export const JWT_ISSUER = "retailsync-api";
export const JWT_AUDIENCE = "retailsync-client";
export const JWT_EXPIRES_IN_SECONDS = 60 * 60;

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error(
      "JWT_SECRET is missing or too short. Set a random secret of at least 32 bytes.",
    );
  }

  return secret;
}
