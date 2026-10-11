import { createRoot } from "react-dom/client";
import "./styles/index.css";
import "virtual:formio-vendor.css";
import { App } from "./app/App";

createRoot(document.getElementById("root")!).render(<App />);
