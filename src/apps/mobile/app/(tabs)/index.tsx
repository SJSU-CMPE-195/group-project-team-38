import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import LoginScreen from "../../src/screens/LoginScreen";
import { clearAuth, loadAuth } from "../../src/storage/auth";

export default function App() {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  async function refresh() {
    const a = await loadAuth();
    setToken(a.token);
    setUser(a.user);
    setReady(true);
  }

  useEffect(() => {
    refresh();
  }, []);

  if (!ready) return null;

  if (!token) return <LoginScreen onLoggedIn={refresh} />;

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "700" }}>Logged in ✅</Text>
      <Text>Email: {user?.email}</Text>
      <Text>Role: {user?.role}</Text>

      <Pressable
        onPress={async () => {
          await clearAuth();
          await refresh();
        }}
        style={{ padding: 12, borderRadius: 10, borderWidth: 1, alignItems: "center" }}
      >
        <Text style={{ fontWeight: "600" }}>Logout</Text>
      </Pressable>
    </View>
  );
}