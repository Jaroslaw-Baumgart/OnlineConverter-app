import { buildApiUrl } from "./apiUrl";

export const requestConversion = (formData: FormData): Promise<Response> => {
  return fetch(buildApiUrl("/convert"), {
    method: "POST",
    body: formData,
  });
};

export const fetchConvertedFile = (
  maybeRelativeUrl: string,
): Promise<Response> => {
  return fetch(buildApiUrl(maybeRelativeUrl));
};
