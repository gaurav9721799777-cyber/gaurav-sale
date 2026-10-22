import dynamic from "next/dynamic";
import { MantineProvider, createTheme } from "@mantine/core";
import "@mantine/core/styles.css";
import "../src/App.css";
import "../src/StorePages.css";
import "../src/components/Admin/AdminLogin.css";
import "../src/components/Admin/AdminPanel.css";
import "../src/components/AppLoader.css";
import "../src/components/storefront.css";
import "../src/index.css";

const LegacyApp = dynamic(() => import("../src/App"), { ssr: false });

const theme = createTheme({
  primaryColor: "brand",
  colors: {
    brand: [
      "#eef3ff",
      "#dce7ff",
      "#bfd0f5",
      "#9ab2e8",
      "#7392d7",
      "#5274c8",
      "#3158b8",
      "#23458f",
      "#1c3b7f",
      "#17377f",
    ],
  },
  defaultRadius: "xs",
});

export default function NextApp() {
  return (
    <MantineProvider theme={theme}>
      <LegacyApp />
    </MantineProvider>
  );
}
