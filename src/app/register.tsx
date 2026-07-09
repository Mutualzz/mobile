import { AppKeyboardAvoidingView } from "@components/Keyboard/AppKeyboardAvoidingView";
import { Button } from "@components/Button";
import { DOBInput } from "@components/DOBInput";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { type HttpException } from "@mutualzz/types";
import {
  Box,
  IconButton,
  InputDefault,
  InputPassword,
  type InputPasswordProps,
  type InputRootProps,
  Typography,
} from "@mutualzz/ui-native";
import { validateRegister } from "@mutualzz/validators";
import { type AnyFieldApi, revalidateLogic } from "@tanstack/form-core";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Redirect, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { forwardRef, useRef, useState } from "react";
import type { TextInput } from "react-native";
import { Pressable } from "react-native";

interface ApiErrors {
  email?: string;
  globalName?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  dateOfBirth?: string;
}

const InputWithLabel = forwardRef<
  TextInput,
  InputRootProps &
    InputPasswordProps & {
      field: AnyFieldApi;
      label: string;
      apiErrors: ApiErrors;
      required?: boolean;
    }
>(({ apiErrors, field, label, type, ...props }, ref) => (
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
      <InputPassword {...props} ref={ref} fullWidth />
    ) : (
      <InputDefault autoCapitalize="none" {...props} ref={ref} fullWidth />
    )}
    {!field.state.meta.isValid && field.state.meta.isTouched && (
      <Typography
        variant="plain"
        color="danger"
        level="body-sm"
        accessibilityLiveRegion="polite"
      >
        {field.state.meta.errors[0].message}
      </Typography>
    )}
    {apiErrors[field.name as keyof ApiErrors] && (
      <Typography
        variant="plain"
        color="danger"
        level="body-sm"
        accessibilityLiveRegion="polite"
      >
        {apiErrors[field.name as keyof ApiErrors]}
      </Typography>
    )}
  </Box>
));
InputWithLabel.displayName = "InputWithLabel";

const Register = () => {
  const app = useAppStore();
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [apiErrors, setApiErrors] = useState<ApiErrors>({});
  const usernameRef = useRef<TextInput>(null);
  const globalNameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const { mutate: register, isPending } = useMutation({
    mutationFn: async (values: any) =>
      app.rest.post<any, { token: string }>("auth/register", values),
    onSuccess: ({ token }) => {
      app.setToken(token);
    },
    onError: (error: HttpException) => {
      const errors: ApiErrors = {};
      error.errors.forEach((err) => {
        errors[err.path as keyof ApiErrors] = err.message;
      });
      setApiErrors(errors);
    },
  });

  const Form = useForm({
    defaultValues: {
      email: "",
      globalName: undefined as string | undefined,
      username: "",
      password: "",
      confirmPassword: "",
      dateOfBirth: dayjs().subtract(13, "year").toDate(),
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
    <AppKeyboardAvoidingView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
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
                  returnKeyType="next"
                  onSubmitEditing={() => usernameRef.current?.focus()}
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
                  ref={usernameRef}
                  field={field}
                  label="Username"
                  apiErrors={apiErrors}
                  required
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  value={field.state.value}
                  returnKeyType="next"
                  onSubmitEditing={() => globalNameRef.current?.focus()}
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
                  ref={globalNameRef}
                  field={field}
                  label="Display Name"
                  apiErrors={apiErrors}
                  autoCapitalize="words"
                  onChangeText={(text) =>
                    field.handleChange(text.length > 0 ? text : undefined)
                  }
                  onBlur={field.handleBlur}
                  value={field.state.value ?? ""}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
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
                  ref={passwordRef}
                  field={field}
                  label="Password"
                  apiErrors={apiErrors}
                  type="password"
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  value={field.state.value}
                  visible={passwordVisible}
                  onTogglePassword={() => setPasswordVisible((prev) => !prev)}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                  required
                />
              )}
            />
            <Form.Field
              name="confirmPassword"
              children={(field) => (
                <InputWithLabel
                  ref={confirmPasswordRef}
                  field={field}
                  label="Confirm Password"
                  apiErrors={apiErrors}
                  type="password"
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  value={field.state.value}
                  visible={passwordVisible}
                  onTogglePassword={() => setPasswordVisible((prev) => !prev)}
                  returnKeyType="done"
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
                  style={{
                    marginTop: 16,
                    marginBottom: 16,
                  }}
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
    </AppKeyboardAvoidingView>
  );
};

export default observer(Register);
