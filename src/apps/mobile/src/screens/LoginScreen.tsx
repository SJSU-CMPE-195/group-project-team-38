import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { login } from "../api/auth";
import { saveAuth } from "../storage/auth";

export default function LoginScreen({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [email, setEmail] = useState("nurse1@meditag.local");
  const [password, setPassword] = useState("nurse123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      const data = await login(email.trim(), password);
      await saveAuth(data.token, data.user);
      onLoggedIn();
    } catch (e: any) {
      setError(e?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 26, fontWeight: "700" }}>MediTag</Text>
      <Text style={{ fontSize: 16, opacity: 0.7 }}>Nurse Login</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
      />

      {error ? <Text style={{ color: "crimson" }}>{error}</Text> : null}

      <Pressable
        onPress={handleLogin}
        disabled={loading}
        style={{
          padding: 12,
          borderRadius: 10,
          alignItems: "center",
          borderWidth: 1,
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? <ActivityIndicator /> : <Text style={{ fontWeight: "600" }}>Login</Text>}
      </Pressable>
    </View>
  );
}