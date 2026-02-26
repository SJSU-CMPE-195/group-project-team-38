import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    async function testLogin() {
      const res = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin1@meditag.local",
          password: "admin123"
        }),
      });

      const data = await res.json();
      console.log("LOGIN RESPONSE:", data);
    }

    testLogin();
  }, []);

  return <div>Check browser console for login response</div>;
}