import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./lib/context/auth-context";
import { CallProvider } from "./lib/context/call-context";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <CallProvider>
      <App />
    </CallProvider>
  </AuthProvider>
);
