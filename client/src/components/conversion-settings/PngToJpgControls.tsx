import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  pngToJpgSettingsSchema,
  type PngToJpgSettings,
} from "../../schemas/conversionSettings";

interface PngToJpgControlsProps {
  disabled: boolean;
  onConvert: (settings: PngToJpgSettings) => void;
}

export default function PngToJpgControls({
  disabled,
  onConvert,
}: PngToJpgControlsProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(pngToJpgSettingsSchema),
    defaultValues: pngToJpgSettingsSchema.parse({}),
  });

  return (
    <form onSubmit={handleSubmit(onConvert)}>
      <div>
        <label htmlFor="png-to-jpg-quality">Quality</label>
        <input id="png-to-jpg-quality" type="number" {...register("quality")} />
        {errors.quality && <p role="alert">{errors.quality.message}</p>}
        <label htmlFor="png-to-jpg-background-color">
          Replace transparent areas with
        </label>
        <input
          id="png-to-jpg-background-color"
          type="color"
          {...register("backgroundColor")}
        />
      </div>
      <button type="submit" className="convert-btn" disabled={disabled}>
        Convert
      </button>
    </form>
  );
}
