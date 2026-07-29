import { KeyboardForm } from "@components/Keyboard";
import { Button } from "@components/Button";
import { DOBInput } from "@components/DOBInput";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { type HttpException } from "@mutualzz/types";
import { IconButton } from "@components/IconButton";
import { Box, InputDefault, InputPassword, type InputPasswordProps, type InputRootProps, Typography } from "@mutualzz/ui-native";
import { validateRegister } from "@mutualzz/validators";
import { type AnyFieldApi, revalidateLogic } from "@tanstack/form-core";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Redirect, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { forwardRef, useRef, useState } from "react";
import type { TextInput } from "react-native";
import { Pressable, Linking } from "react-native";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("auth");
  const { t: ts } = useTranslation("settings");
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
    <KeyboardForm
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
      contentContainerStyle={{
        justifyContent: "center",
        alignItems: "center",
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
              {t("register.title")}
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
                  label={t("register.email")}
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
                  label={t("register.username")}
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
                  label={t("register.displayName")}
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
                  label={t("register.password")}
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
                  label={t("register.confirmPassword")}
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
                  label={t("register.dateOfBirth")}
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
                  {isSubmitting ? t("actions.submitting") : t("actions.createAccount")}
                </Button>
              )}
            />
            <Button
              fullWidth
              variant="soft"
              onPress={() => {
                void app.rest
                  .get<{ url: string }>("auth/discord/url?client=mobile")
                  .then(({ url }) => Linking.openURL(url));
              }}
            >
              {ts("discord.continueWithDiscord")}
            </Button>
          </Box>
          <Pressable onPress={() => router.replace("/login")}>
            <Typography>
              {t("register.hasAccount")}{" "}
              <Typography color="info" variant="plain">
                {t("actions.login")}
              </Typography>
            </Typography>
          </Pressable>
        </Paper>
    </KeyboardForm>
  );
};

export default observer(Register);
