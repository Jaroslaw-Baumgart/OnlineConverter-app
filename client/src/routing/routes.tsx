import type { RouteObject } from "react-router";

import ConverterPage from "../pages/ConverterPage";
import AppLayout from "../layouts/AppLayout";
import FormatsPage from "../pages/FormatsPage";
import PrivacyPage from "../pages/PrivacyPage";
import NotFoundPage from "../pages/NotFoundPage";

export const appRoutes = [
  {
    Component: AppLayout,
    children: [
      {
        index: true,
        Component: ConverterPage,
      },
      {
        path: "formats",
        Component: FormatsPage,
      },
      {
        path: "privacy",
        Component: PrivacyPage,
      },
      {
        path: "*",
        Component: NotFoundPage,
      },
    ],
  },
] satisfies RouteObject[];
