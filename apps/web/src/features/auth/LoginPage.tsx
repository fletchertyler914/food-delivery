import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useMutation } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useForm } from "react-hook-form";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router";

import { paths } from "../../app/paths";
import { login } from "../../lib/api/auth.api";
import { resolvePostAuthRedirect, siblingAuthPathWithFrom } from "../../lib/auth/redirect-from";
import { applyApiFormError } from "../../lib/forms/apply-api-form-error";
import { useDocumentTitle } from "../../lib/use-document-title";
import { AuthShell } from "./AuthShell";
import { loginSchema, type LoginFormValues } from "./auth.schemas";
import { useAuthStore } from "./auth.store";

export function LoginPage(): ReactElement {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);

  useDocumentTitle("Sign in");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  // Loaders that bounce unauthenticated users redirect through
  // /login?from=<encoded-path> so we can return them to where they
  // were trying to go after a successful sign-in.
  const redirectTo = resolvePostAuthRedirect(searchParams.get("from"), paths.restaurants);
  const signupTo = siblingAuthPathWithFrom(paths.signup, searchParams);

  const mutation = useMutation({
    mutationFn: (values: LoginFormValues) => login(values),
    onSuccess: (session) => {
      setSession(session);
      void navigate(redirectTo);
    },
    onError: (error) => {
      applyApiFormError(error, setError, { INVALID_CREDENTIALS: "password" }, "Login failed.");
    }
  });

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in"
      description="Pick up your order, your way — with the same account across the storefront and operator console."
      footer={
        <>
          New here?{" "}
          <Link component={RouterLink} to={signupTo}>
            Create an account
          </Link>
        </>
      }
    >
      {errors.root?.message ? <Alert severity="error">{errors.root.message}</Alert> : null}

      <Stack
        component="form"
        spacing={2}
        onSubmit={(event) => {
          void handleSubmit((values) => {
            mutation.mutate(values);
          })(event);
        }}
      >
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          size="medium"
          {...register("email")}
          error={Boolean(errors.email)}
          helperText={errors.email?.message}
          required
          fullWidth
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          size="medium"
          {...register("password")}
          error={Boolean(errors.password)}
          helperText={errors.password?.message}
          required
          fullWidth
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={mutation.isPending}
          sx={{ mt: 1 }}
        >
          {mutation.isPending ? "Signing in..." : "Sign in"}
        </Button>
      </Stack>
    </AuthShell>
  );
}
