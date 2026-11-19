import { createContext } from "react";

export const PreviewExpandContext = createContext<(element: HTMLDivElement | null) => void>(() => {});
