import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import ComingSoon from "./ComingSoon";
import "./styles.css";

// Set VITE_COMING_SOON=1 on the public production project to show only the holding page.
const comingSoon = import.meta.env.VITE_COMING_SOON === "1";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {comingSoon ? <ComingSoon /> : <App />}
  </StrictMode>,
);
