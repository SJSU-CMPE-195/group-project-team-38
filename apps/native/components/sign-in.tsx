import { useForm } from "@tanstack/react-form";
import { router } from "expo-router";
import {
  Button,
  FieldError,
  Input,
  Label,
  Spinner,
  Surface,
  TextField,
  useToast,
} from "heroui-native";
import { useRef } from "react";
import { Text, TextInput, View } from "react-native";
import z from "zod";

import { authClient, ensureSingleOrganizationIsActive } from "@/lib/auth-client";

const signInSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required").min(8, "Use at least 8 characters"),
});
const demoNurseCredentials = {
  email: "nurse-demo@meditag.test",
  password: "meditag-demo-123",
} as const;

function getErrorMessage(error: unknown): string | null {
  if (!error) return null;

  if (typeof error === "string") {
    return error;
  }

  if (Array.isArray(error)) {
    for (const issue of error) {
      const message = getErrorMessage(issue);
      if (message) {
        return message;
      }
    }
    return null;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = error.message;
    if (typeof message === "string") {
      return message;
    }
  }

  return null;
}

export function SignIn() {
  const passwordInputRef = useRef<TextInput>(null);
  const { toast } = useToast();

  const completeSignIn = async (credentials: { email: string; password: string }) => {
    let didComplete = false;

    await authClient.signIn.email(
      {
        email: credentials.email.trim(),
        password: credentials.password,
      },
      {
        onError(error) {
          toast.show({
            variant: "danger",
            label: error.error?.message || "Failed to sign in",
          });
        },
        async onSuccess() {
          const activeOrganizationId = await ensureSingleOrganizationIsActive();
          if (!activeOrganizationId) {
            toast.show({
              variant: "danger",
              label: "Signed in, but your account could not be loaded.",
            });
            return;
          }

          toast.show({
            variant: "success",
            label: "Signed in successfully",
          });
          didComplete = true;
          router.replace("/(drawer)");
        },
      },
    );

    return didComplete;
  };

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: signInSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const didComplete = await completeSignIn({
        email: value.email,
        password: value.password,
      });

      if (didComplete) {
        formApi.reset();
      }
    },
  });

  return (
    <Surface variant="secondary" className="rounded-2xl p-5">
      <form.Subscribe
        selector={(state) => ({
          isSubmitting: state.isSubmitting,
          validationError: getErrorMessage(state.errorMap.onSubmit),
        })}
      >
        {({ isSubmitting, validationError }) => {
          const formError = validationError;

          return (
            <>
              <FieldError isInvalid={!!formError} className="mb-3">
                {formError}
              </FieldError>

              <View className="gap-3">
                <form.Field name="email">
                  {(field) => (
                    <TextField>
                      <Label>Email</Label>
                      <Input
                        testID="sign-in-email-input"
                        accessibilityLabel="Sign in email"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChangeText={field.handleChange}
                        placeholder="email@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        spellCheck={false}
                        autoComplete="off"
                        textContentType="none"
                        returnKeyType="next"
                        blurOnSubmit={false}
                        onSubmitEditing={() => {
                          passwordInputRef.current?.focus();
                        }}
                      />
                    </TextField>
                  )}
                </form.Field>

                <form.Field name="password">
                  {(field) => (
                    <TextField>
                      <Label>Password</Label>
                      <Input
                        ref={passwordInputRef}
                        testID="sign-in-password-input"
                        accessibilityLabel="Sign in password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChangeText={field.handleChange}
                        placeholder="••••••••"
                        secureTextEntry
                        autoCorrect={false}
                        spellCheck={false}
                        autoComplete="off"
                        textContentType="none"
                        returnKeyType="go"
                        onSubmitEditing={form.handleSubmit}
                      />
                    </TextField>
                  )}
                </form.Field>

                <Button
                  testID="sign-in-submit-button"
                  accessibilityLabel="Submit sign in"
                  onPress={form.handleSubmit}
                  isDisabled={isSubmitting}
                  className="mt-2"
                >
                  {isSubmitting ? (
                    <Spinner size="sm" color="default" />
                  ) : (
                    <Button.Label>Sign in</Button.Label>
                  )}
                </Button>

                <Button
                  testID="sign-in-demo-button"
                  accessibilityLabel="Sign in with demo nurse account"
                  variant="secondary"
                  onPress={async () => {
                    await completeSignIn(demoNurseCredentials);
                  }}
                  isDisabled={isSubmitting}
                >
                  <Button.Label>Use demo nurse account</Button.Label>
                </Button>
              </View>
            </>
          );
        }}
      </form.Subscribe>
    </Surface>
  );
}
