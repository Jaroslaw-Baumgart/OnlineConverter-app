import { buildApiUrl } from "./apiUrl";
import { ConversionError } from "./conversionError";
import { parseConversionResponse } from "./conversionResponse";
import type {
  ConvertedResult,
  ConvertedResults,
} from "../types/conversionResult";

const requestConversion = (formData: FormData): Promise<Response> => {
  return fetch(buildApiUrl("/convert"), {
    method: "POST",
    body: formData,
  });
};

const fetchConvertedFile = (maybeRelativeUrl: string): Promise<Response> => {
  return fetch(buildApiUrl(maybeRelativeUrl));
};

export async function convertFile(
  formData: FormData,
): Promise<ConvertedResults> {
  let res: Response;

  try {
    res = await requestConversion(formData);
  } catch (cause: unknown) {
    throw new ConversionError("network", cause);
  }

  let data: unknown;

  try {
    data = await res.json();
  } catch (cause: unknown) {
    throw new ConversionError("invalid-response", cause);
  }

  const conversionResponse = parseConversionResponse(data);

  if (!conversionResponse) {
    throw new ConversionError("invalid-response", data);
  }

  if (conversionResponse.success === false) {
    throw new ConversionError(
      conversionResponse.code,
      conversionResponse.error,
    );
  }

  if (!res.ok) {
    throw new ConversionError("conversion-failed", {
      status: res.status,
      response: conversionResponse,
    });
  }

  let downloadedResults: ConvertedResult[];

  try {
    downloadedResults = await Promise.all(
      conversionResponse.files.map(async (convertedFileInfo) => {
        const convertedFileUrl = buildApiUrl(convertedFileInfo.url);

        const fileRes = await fetchConvertedFile(convertedFileInfo.url);

        if (!fileRes.ok) {
          throw new Error(`Download failed with status ${fileRes.status}`);
        }

        const blob = await fileRes.blob();

        const downloadedFile = new File([blob], convertedFileInfo.name, {
          type: blob.type,
        });
        return {
          url: convertedFileUrl,
          file: downloadedFile,
        };
      }),
    );
  } catch (cause: unknown) {
    throw new ConversionError("download-failed", cause);
  }
  const [firstResult, ...remainingResults] = downloadedResults;

  if (!firstResult) {
    throw new ConversionError("invalid-response", conversionResponse);
  }

  const convertedResults: ConvertedResults = [firstResult, ...remainingResults];

  return convertedResults;
}
