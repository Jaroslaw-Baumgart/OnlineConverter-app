import { conversions } from "../config/conversions";

export default function FormatsPage() {
  return (
    <>
      <h1 className="app-title">Supported Formats</h1>
      <ul>
        {conversions.map((conversion) => (
          <li key={conversion.conversionType}>
            {conversion.sourceFormat.toUpperCase()} → {conversion.targetFormat.toUpperCase()}
          </li>
        ))}
      </ul>
    </>
  );
}
