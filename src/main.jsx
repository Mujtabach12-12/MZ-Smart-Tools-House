import React, { lazy, Suspense, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./robotic-overrides.css";
import "./final-polish.css";
import "./final-deploy-polish.css";
import ToastCenter from "./components/ui/ToastCenter";
const PwaManager=lazy(()=>import("./components/pwa/PwaManager"));
const StartupWelcome=lazy(()=>import("./components/pwa/StartupWelcome"));
function isAppLikeLaunch(){if(typeof window==="undefined")return false;const protocol=window.location.protocol;return Boolean(window.matchMedia?.("(display-mode: standalone)")?.matches||window.navigator.standalone===true||protocol==="capacitor:"||protocol==="ionic:"||/;\s*wv\)/i.test(navigator.userAgent||""))}
function DeferredPlatformEnhancements(){const appLike=isAppLikeLaunch();const[ready,setReady]=useState(appLike);useEffect(()=>{if(appLike)return undefined;let timeout=0,idleId=0;const show=()=>setReady(true);if("requestIdleCallback" in window)idleId=window.requestIdleCallback(show,{timeout:1800});else timeout=window.setTimeout(show,1200);return()=>{if(idleId&&"cancelIdleCallback" in window)window.cancelIdleCallback(idleId);if(timeout)window.clearTimeout(timeout)}},[appLike]);if(!ready)return null;return <Suspense fallback={null}>{appLike?<StartupWelcome/>:null}<PwaManager/></Suspense>}
ReactDOM.createRoot(document.getElementById("root")).render(<React.StrictMode><><App/><DeferredPlatformEnhancements/><ToastCenter/></></React.StrictMode>);
