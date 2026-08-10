import { File } from "node:buffer";

if (!("File" in globalThis)) {
  Object.defineProperty(globalThis, "File", { value: File, configurable: true });
}
