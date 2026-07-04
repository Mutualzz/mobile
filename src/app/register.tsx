import { Button } from "@components/Button";
import { DOBInput } from "@components/DOBInput";
import { Paper } from "@components/Paper";
import { useKeyboardOffset } from "@hooks/useKeyboardOffset";
import { useAppStore } from "@hooks/useStores";
import { HttpException } from "@mutualzz/types";
import {
  Box,
  IconButton,
  InputDefault,
  InputPassword,
  InputPasswordProps,
  InputRootProps,
  Typography,
} from "@mutualzz/ui-native";
import { validateRegister } from "@mutualzz/validators";
import { AnyFieldApi, revalidateLogic } from "@tanstack/form-core";
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

interface ApiErrors {
  email?: string;
  globalName?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  dateOfBirth?: string;
}

const InputWithLabel = ({
  apiErrors,
  field,
  label,
  type,
  ...props
}: InputRootProps &
  InputPasswordProps & {
    field: AnyFieldApi;
    label: string;
    apiErrors: ApiErrors;
    required?: boolean;
    type?: string;
  }) => (
  <Box
    style={{
      width: "100%",
      flexDirection: "column",
      gap: 4,
    }}
  >
    <Typography weight={500} level="body-sm">
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
    {!field.state.meta.isValid && field.state.meta.isTouched && (
      <Typography variant="plain" color="danger" level="body-sm">
        {field.state.meta.errors[0].message}
      </Typography>
    )}
    {apiErrors[field.name as keyof ApiErrors] && (
      <Typography variant="plain" color="danger" level="body-sm">
        {apiErrors[field.name as keyof ApiErrors]}
      </Typography>
    )}
  </Box>
);

const Register = () => {
  const app = useAppStore();
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [apiErrors, setApiErrors] = useState<ApiErrors>({});
  const keyboardHeight = useKeyboardOffset();
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const height = keyboardHeight === 0 ? 0 : -keyboardHeight / 2.5;

    Animated.timing(translateY, {
      toValue: height,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [keyboardHeight, translateY]);

  const { mutate: register, isPending } = useMutation({
    mutationFn: async (values: any) =>
      app.rest.post<any, { token: string }>("auth/register", values),
    onSuccess: ({ token }) => {
      app.setToken(token);
    },
    onError: (error: HttpException) => {
      error.errors.forEach((err) => {
        setApiErrors({
          [err.path]: err.message,
        });
      });
    },
  });

  const Form = useForm({
    defaultValues: {
      email: "",
      globalName: undefined as string | undefined,
      username: "",
      password: "",
      confirmPassword: "",
      dateOfBirth: new Date(),
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validateRegister as any, // TypeScript workaround for dynamic validation
    },
    onSubmit: ({ value }) => {
      register(value);
    },
  });

  if (app.token) return <Redirect href="/" />;

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Animated.View style={{ width: "100%", transform: [{ translateY }] }}>
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
              Create an account
            </Typography>
          </Box>
          <Box
            style={{
              flexDirection: "column",
              gap: 8,
              width: "100%",
            }}
          >
            <Form.Field
              name="email"
              children={(field) => (
                <InputWithLabel
                  field={field}
                  label="Email"
                  apiErrors={apiErrors}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  value={field.state.value}
                  inputMode="email"
                  endDecorator={
                    <IconButton
                      padding={0}
                      size="sm"
                      onPress={() => field.handleChange("")}
                      variant="plain"
                      color="neutral"
                      hitSlop={8}
                    >
                      X
                    </IconButton>
                  }
                  required
                />
              )}
            />
            <Form.Field
              name="username"
              children={(field) => (
                <InputWithLabel
                  field={field}
                  label="Username"
                  apiErrors={apiErrors}
                  required
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  value={field.state.value}
                  endDecorator={
                    <IconButton
                      padding={0}
                      size="sm"
                      onPress={() => field.handleChange("")}
                      variant="plain"
                      color="neutral"
                      hitSlop={8}
                    >
                      X
                    </IconButton>
                  }
                />
              )}
            />
            <Form.Field
              name="globalName"
              children={(field) => (
                <InputWithLabel
                  field={field}
                  label="Display Name"
                  apiErrors={apiErrors}
                  onChangeText={(text) =>
                    field.handleChange(text.length > 0 ? text : undefined)
                  }
                  onBlur={field.handleBlur}
                  value={field.state.value ?? ""}
                  endDecorator={
                    <IconButton
                      padding={0}
                      size="sm"
                      onPress={() => field.handleChange("")}
                      variant="plain"
                      color="neutral"
                      hitSlop={8}
                    >
                      X
                    </IconButton>
                  }
                />
              )}
            />
            <Form.Field
              name="password"
              children={(field) => (
                <InputWithLabel
                  field={field}
                  label="Password"
                  apiErrors={apiErrors}
                  type="password"
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  value={field.state.value}
                  visible={passwordVisible}
                  onTogglePassword={() => setPasswordVisible((prev) => !prev)}
                  required
                />
              )}
            />
            <Form.Field
              name="confirmPassword"
              children={(field) => (
                <InputWithLabel
                  field={field}
                  label="Confirm Password"
                  apiErrors={apiErrors}
                  type="password"
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  value={field.state.value}
                  visible={passwordVisible}
                  onTogglePassword={() => setPasswordVisible((prev) => !prev)}
                  required
                />
              )}
            />
            <Form.Field
              name="dateOfBirth"
              children={(field) => (
                <DOBInput
                  apiErrors={apiErrors}
                  field={field}
                  label="Date Of Birth"
                  required
                />
              )}
            />
            <Form.Subscribe
              selector={(state) => [state.isSubmitting]}
              children={([isSubmitting]) => (
                <Button
                  fullWidth
                  onPress={Form.handleSubmit}
                  disabled={isSubmitting || isPending}
                >
                  {isSubmitting ? "..." : "Create Account"}
                </Button>
              )}
            />
          </Box>
          <Pressable onPress={() => router.replace("/login")}>
            <Typography>
              Already have an account?{" "}
              <Typography color="info" variant="plain">
                Login
              </Typography>
            </Typography>
          </Pressable>
        </Paper>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

export default observer(Register);
