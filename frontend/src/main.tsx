import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { AppQueryProvider } from "./app/providers/query-provider.tsx";

createRoot(document.getElementById("root")!).render(
  <AppQueryProvider>
    <App />
  </AppQueryProvider>
);
  