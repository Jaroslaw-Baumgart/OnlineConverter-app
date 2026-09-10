import FileConverter from "../components/FileConverter";
import { conversions } from "../config/conversions";

export default function ConverterPage() {
  return (
    <>
      <h1 className="app-title">Online File Converter</h1>
      <FileConverter conversionOptions={conversions} />
    </>
  );
}