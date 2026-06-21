import { Paper } from "@components/Paper";
import { SpaceIcon } from "@components/Space/SpaceIcon";
import { useKeyboardOffset } from "@hooks/useKeyboardOffset";
import { useAppStore } from "@hooks/useStores";
import type { HttpException } from "@mutualzz/types";
import {
  Box,
  Button,
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
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";

const InputWithLabel = ({
  label,
  apiError,
  type,
  ...props
}: InputRootProps &
  InputPasswordProps & {
    label: string;
    apiError?: string | null;
    required?: boolean;
    type?: string;
  }) => (
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
      <InputPassword {...props} fullWidth />
    ) : (
      <InputDefault {...props} fullWidth autoCapitalize="none" />
    )}
    {apiError && (
      <Typography variant="plain" color="danger" level="body-sm">
        {apiError}
      </Typography>
    )}
  </Box>
);

const Login = () => {
  const app = useAppStore();
  const [error, setError] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);
  const keyboardHeight = useKeyboardOffset();
  const translateY = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const height = keyboardHeight === 0 ? 0 : -keyboardHeight;

    Animated.timing(translateY, {
      toValue: height,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [keyboardHeight, translateY]);

  const { mutate: login, isPending } = useMutation({
    mutationFn: async (values: any) => {
      const requestBody: Record<string, string | undefined> = {
        password: values.password,
      };

      if (emailRegex.test(values.usernameOrEmail))
        requestBody.email = values.usernameOrEmail;
      else requestBody.username = values.usernameOrEmail;

      return app.rest.post<{ token: string }, any>("auth/login", requestBody);
    },
    onSuccess: ({ token }) => {
      app.setToken(token);
    },
    onError: (error: HttpException) => {
      setError(error.message);
    },
  });

  const { mutate: forgotPassword, isPending: forgettingPassword } = useMutation(
    {
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
    },
  );

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
    <KeyboardAvoidingView
      style={{
        flexDirection: "row",
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
      }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Animated.View
        style={{
          width: "100%",
          transform: [{ translateY }],
        }}
      >
        <Paper
          style={{
            paddingVertical: 20,
            paddingHorizontal: 24,
            borderRadius: 12,
            gap: 16,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Box
            style={{
              gap: 16,
              alignItems: "center",
            }}
          >
            <Typography level="body-lg" weight="bold">
              Login to an account
            </Typography>
            {space && (
              <Box
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Typography
                  level="body-sm"
                  color="primary"
                  style={{ textAlign: "center" }}
                >
                  You are logging in to accept an invite to join a space:{" "}
                </Typography>
                <Box
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <SpaceIcon size={36} space={space} />
                  <Typography
                    level="body-sm"
                    style={{
                      textAlign: "center",
                    }}
                  >
                    {space.name}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
          <Box
            style={{
              flexDirection: "column",
              gap: 32,
              width: "100%",
            }}
          >
            <Form.Field
              name="usernameOrEmail"
              children={(field) => (
                <InputWithLabel
                  label="Username or Email"
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  value={field.state.value}
                  required
                />
              )}
            />
            <Form.Field
              name="password"
              children={(field) => (
                <InputWithLabel
                  label="Password"
                  type="password"
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  value={field.state.value}
                  required
                  apiError={error}
                />
              )}
            />
            <Form.Subscribe
              selector={(state) => [
                state.isSubmitting,
                state.values.usernameOrEmail,
              ]}
              children={([isSubmitting, usernameOrEmail]) => (
                <>
                  <Button
                    fullWidth
                    disabled={Boolean(isSubmitting) || isPending}
                    onPress={Form.handleSubmit}
                  >
                    {isSubmitting ? "..." : "Login"}
                  </Button>
                  <Pressable
                    onPress={() => {
                      setForgotError(null);
                      if (!usernameOrEmail) {
                        setForgotError("Enter your username or email first");
                        return;
                      }
                      forgotPassword(usernameOrEmail.toString());
                    }}
                  >
                    <Typography
                      level="body-sm"
                      color="info"
                      style={{ textAlign: "center" }}
                    >
                      {forgettingPassword
                        ? "Sending reset email..."
                        : "Forgot your password?"}
                    </Typography>
                  </Pressable>
                  {forgotError && (
                    <Typography
                      variant="plain"
                      color="danger"
                      level="body-sm"
                      style={{ textAlign: "center" }}
                    >
                      {forgotError}
                    </Typography>
                  )}
                  {forgotSent && (
                    <Typography
                      level="body-sm"
                      color="success"
                      style={{ textAlign: "center" }}
                    >
                      Password reset email sent.
                    </Typography>
                  )}
                </>
              )}
            />
          </Box>
          <Pressable onPress={() => router.replace("/register")}>
            <Typography>
              Don&apos;t have an account?{" "}
              <Typography color="info" variant="plain">
                Register
              </Typography>
            </Typography>
          </Pressable>
        </Paper>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

export default observer(Login);
