import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function isValidPassword(password: string): boolean {
  // Minimum 8 characters, at least one uppercase, one lowercase, one number
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
    password
  );
}

export function getPasswordErrors(password: string): string[] {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Mínimo 8 caracteres");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Mínimo 1 letra minúscula");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Mínimo 1 letra maiúscula");
  }
  if (!/\d/.test(password)) {
    errors.push("Mínimo 1 número");
  }
  if (!/[@$!%*?&]/.test(password)) {
    errors.push("Mínimo 1 caractere especial (@$!%*?&)");
  }

  return errors;
}
