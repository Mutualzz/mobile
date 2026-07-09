import { AppKeyboardAvoidingView } from "@components/Keyboard/AppKeyboardAvoidingView";
import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { SpaceIcon } from "@components/Space/SpaceIcon";
import { useAppStore } from "@hooks/useStores";
import type { HttpException } from "@mutualzz/types";
import {
  Box,
  InputDefault,
  InputPassword,
  type InputPasswordProps,
  type InputRootProps,
  Typography,
} from "@mutualzz/ui-native";
import { emailRegex } from "@mutualzz/validators";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Redirect, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { forwardRef, useRef, useState } from "react";
import type { TextInput } from "react-native";
import { Pressable } from "react-native";

const InputWithLabel = forwardRef<
  TextInput,
  InputRootProps &
    InputPasswordProps & {
      label: string;
      apiError?: string | null;
      required?: boolean;
    }
>(({ label, apiError, type, ...props }, ref) => (
  <Box style={{ width: "100%", flexDirection: "column", gap: 8 }}>
    <Typography level="body-sm" weight={500}>
      {label}{" "}
      {props.required && (
        <Typography variant="plain" color="danger">
          *
        </Typography>
      )}
    </Typography>
    {type === "password" ? (
      <InputPassword {...props} ref={ref} fullWidth />
    ) : (
      <InputDefault autoCapitalize="none" {...props} ref={ref} fullWidth />
    )}
    {apiError && (
      <Typography
        variant="plain"
        color="danger"
        level="body-sm"
        accessibilityLiveRegion="polite"
      >
        {apiError}
      </Typography>
    )}
  </Box>
));
InputWithLabel.displayName = "InputWithLabel";

const Login = () => {
  const app = useAppStore();
  const [error, setError] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const router = useRouter();

  const { mutate: login, isPending } = useMutation({
    mutationFn: async (values: { usernameOrEmail: string; password: string }) => {
      const requestBody: Record<string, string | undefined> = {
        password: values.password,
      };

      if (emailRegex.test(values.usernameOrEmail))
        requestBody.email = values.usernameOrEmail;
      else requestBody.username = values.usernameOrEmail;

      return app.rest.post<{ token: string }, typeof requestBody>(
        "auth/login",
        requestBody,
      );
    },
    onSuccess: ({ token }) => {
      app.setToken(token);
    },
    onError: (err: HttpException) => {
      setError(err.message);
    },
  });

  const { mutate: forgotPassword, isPending: forgettingPassword } = useMutation({
    mutationKey: ["forgot-password"],
    mutationFn: async (usernameOrEmail: string) => {
      const requestBody: Record<string, string> = {};
      if (emailRegex.test(usernameOrEmail)) {
        requestBody.email = usernameOrEmail;
      } else {
        requestBody.username = usernameOrEmail;
      }
      return app.rest.post("auth/forgot-password", requestBody);
    },
    onSuccess: () => {
      setForgotError(null);
      setForgotSent(true);
    },
    onError: (err: HttpException) => {
      setForgotError(err.message);
    },
  });

  const Form = useForm({
    defaultValues: {
      usernameOrEmail: "",
      password: "",
    },
    onSubmit: ({ value }) => {
      login(value);
    },
  });

  if (app.token) return <Redirect href="/" />;

  const space = app.joiningSpace;

  return (
    <AppKeyboardAvoidingView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
      }}
    >
      <Paper
        style={{
          width: "100%",
          paddingVertical: 20,
          paddingHorizontal: 24,
          borderRadius: 12,
          gap: 16,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box style={{ gap: 8, alignItems: "center", width: "100%" }}>
          <Typography level="body-lg" weight="bold">
            Login to an account
          </Typography>
          {space ? (
            <Box
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <Typography level="body-sm" style={{ textAlign: "center" }}>
                You are logging in to accept an invite to join a space:
              </Typography>
              <SpaceIcon size={36} space={space} />
              <Typography level="body-sm" style={{ textAlign: "center" }}>
                {space.name}
              </Typography>
            </Box>
          ) : null}
        </Box>

        {forgotSent ? (
          <Typography level="body-sm" style={{ textAlign: "center" }}>
            If an account exists for that username or email, a password reset
            link has been sent.
          </Typography>
        ) : (
          <Box style={{ flexDirection: "column", gap: 12, width: "100%" }}>
            <Form.Field
              name="usernameOrEmail"
              children={(field) => (
                <InputWithLabel
                  label="Username or Email"
                  apiError={forgotError}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  value={field.state.value}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  required
                />
              )}
            />
            <Form.Field
              name="password"
              children={(field) => (
                <Box style={{ gap: 8, width: "100%" }}>
                  <InputWithLabel
                    ref={passwordRef}
                    label="Password"
                    type="password"
                    apiError={error}
                    onChangeText={field.handleChange}
                    onBlur={field.handleBlur}
                    value={field.state.value}
                    returnKeyType="done"
                    onSubmitEditing={() => Form.handleSubmit()}
                    required
                  />
                  <Pressable
                    disabled={forgettingPassword}
                    onPress={() => {
                      const usernameOrEmail =
                        Form.getFieldValue("usernameOrEmail");

                      if (!usernameOrEmail) {
                        setForgotError(
                          "Please enter your username or email to reset your password",
                        );
                        return;
                      }

                      forgotPassword(usernameOrEmail);
                    }}
                  >
                    <Typography color="info" variant="plain" level="body-sm">
                      Forgot your password?
                    </Typography>
                  </Pressable>
                </Box>
              )}
            />
            <Form.Subscribe
              selector={(state) => [state.isSubmitting]}
              children={([isSubmitting]) => (
                <Button
                  fullWidth
                  onPress={Form.handleSubmit}
                  disabled={isSubmitting || isPending}
                  style={{ marginTop: 8 }}
                >
                  {isSubmitting ? "..." : "Login"}
                </Button>
              )}
            />
          </Box>
        )}

        <Pressable onPress={() => router.replace("/register")}>
          <Typography>
            Don&apos;t have an account?{" "}
            <Typography color="info" variant="plain">
              Register
            </Typography>
          </Typography>
        </Pressable>
      </Paper>
    </AppKeyboardAvoidingView>
  );
};

export default observer(Login);
