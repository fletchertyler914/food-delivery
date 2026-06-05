import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useMutation } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router";

import { paths } from "../../app/paths";
import { signup } from "../../lib/api/auth.api";
import { resolvePostAuthRedirect, siblingAuthPathWithFrom } from "../../lib/auth/redirect-from";
import type { UserRole } from "../../lib/api/types";
import { applyApiFormError } from "../../lib/forms/apply-api-form-error";
import { useDocumentTitle } from "../../lib/use-document-title";
import { AuthShell } from "./AuthShell";
import { signupSchema, type SignupFormValues } from "./auth.schemas";
import { useAuthStore } from "./auth.store";

export function SignupPage(): ReactElement {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const defaultRole =
    searchParams.get("role") === "OWNER"
      ? ("OWNER" satisfies UserRole)
      : ("CUSTOMER" satisfies UserRole);

  useDocumentTitle("Create account");

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors }
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", role: defaultRole }
  });

  const mutation = useMutation({
    mutationFn: (values: SignupFormValues) => signup(values),
    onSuccess: (session) => {
      setSession(session);
      const fallback = session.user.role === "OWNER" ? paths.dashboard : paths.restaurants;
      void navigate(resolvePostAuthRedirect(searchParams.get("from"), fallback));
    },
    onError: (error) => {
      applyApiFormError(
        error,
        setError,
        { EMAIL_TAKEN: "email", WEAK_PASSWORD: "password" },
        "Signup failed."
      );
    }
  });

  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your account"
      description="One account works for ordering food and running a restaurant. Pick the role that fits — you can always create a second account later."
      footer={
        <>
          Already have an account?{" "}
          <Link component={RouterLink} to={siblingAuthPathWithFrom(paths.login, searchParams)}>
            Sign in
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
        <Box>
          <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>
            I want to
          </Typography>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <ToggleButtonGroup
                exclusive
                value={field.value}
                aria-label="Account type"
                onChange={(_, value: UserRole | null) => {
                  if (value) field.onChange(value);
                }}
                fullWidth
                size="small"
              >
                <ToggleButton value="CUSTOMER">Order food</ToggleButton>
                <ToggleButton value="OWNER">Run a restaurant</ToggleButton>
              </ToggleButtonGroup>
            )}
          />
        </Box>

        <TextField
          label="Name"
          autoComplete="name"
          size="medium"
          {...register("name")}
          error={Boolean(errors.name)}
          helperText={errors.name?.message}
          required
          fullWidth
        />
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
          autoComplete="new-password"
          size="medium"
          {...register("password")}
          error={Boolean(errors.password)}
          helperText={errors.password?.message ?? "At least 12 characters with letters and digits."}
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
          {mutation.isPending ? "Creating account..." : "Create account"}
        </Button>
      </Stack>
    </AuthShell>
  );
}
