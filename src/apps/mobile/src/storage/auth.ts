import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "meditag_token";
const USER_KEY = "meditag_user";

export async function saveAuth(token: string, user: any)  {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function loadAuth()  {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const userStr = await AsyncStorage.getItem(USER_KEY);
  return { token, user: userStr ? JSON.parse(userStr) : null };
}

export async function clearAuth() {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
}