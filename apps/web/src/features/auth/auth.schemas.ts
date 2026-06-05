import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email."),
  password: z.string().min(1, "Enter your password.")
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// Mirrors the API's password policy (min 12 chars, letters and digits).
// We intentionally validate length here to give the user fast feedback,
// while the API still rejects anything weaker on the server side.
export const signupSchema = z.object({
  name: z.string().min(1, "Tell us your name."),
  email: z.email("Enter a valid email."),
  password: z.string().min(12, "Use at least 12 characters with letters and digits."),
  role: z.enum(["CUSTOMER", "OWNER"])
});

export type SignupFormValues = z.infer<typeof signupSchema>;
