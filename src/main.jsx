import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import PwaManager from "./components/pwa/PwaManager";
import StartupWelcome from "./components/pwa/StartupWelcome";
import ToastCenter from "./components/ui/ToastCenter";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <>
      <App />
      <StartupWelcome />
      <PwaManager />
      <ToastCenter />
    </>
  </React.StrictMode>
);
