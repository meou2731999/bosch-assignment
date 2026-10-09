import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "@formio/js/dist/formio.form.min.css";
import "./styles/legacy.css";
import { App } from "./app/App";

createRoot(document.getElementById("root")!).render(<App />);
