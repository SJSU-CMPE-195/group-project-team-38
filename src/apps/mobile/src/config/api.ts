import { Platform } from "react-native";

export const API_BASE_URL =
  Platform.OS === "web"
    ? "http://localhost:3001"
    : "http://10.0.2.2:3001";