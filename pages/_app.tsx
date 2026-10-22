import dynamic from "next/dynamic";
import Head from "next/head";
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
      <Head>
        <title>Gaurav Sales | Inverters &amp; Solar Power</title>
        <meta
          name="description"
          content="Shop reliable solar and hybrid inverters with Gaurav Sales. Find a smarter way to power your home."
        />
        <meta name="theme-color" content="#3158b8" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <LegacyApp />
    </MantineProvider>
  );
}
