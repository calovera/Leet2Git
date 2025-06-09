import { createRoot } from "react-dom/client";
import ExtensionApp from "./App";
import "../index.css";

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<ExtensionApp />);
}