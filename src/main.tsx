import "./font.css";
import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Providers from "@/components/Common/Providers";

if (typeof window !== "undefined" && !(window as any).umami) {
  (window as any).umami = { track: () => {} };
}

import Routes from "./routes";

createRoot(document.getElementById("_hey_") as HTMLElement).render(
  <StrictMode>
    <Providers>
      <Routes />
    </Providers>
  </StrictMode>
);
