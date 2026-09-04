import type { PngToJpgSettings } from "../schemas/conversionSettings";
import type { ConversionOption } from "../types/converter";

export const createConversionFormData = (
  file: File,
  option: ConversionOption,
  settings?: PngToJpgSettings,
): FormData => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("conversionType", option.conversionType);
  formData.append("target", option.targetFormat);

  if (settings) {
    formData.append("quality", String(settings.quality));
    formData.append("backgroundColor", settings.backgroundColor);
  }

  return formData;
};
