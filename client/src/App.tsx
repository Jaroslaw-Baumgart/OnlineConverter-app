import FileConverter from "./components/FileConverter";
import { conversions } from "./config/conversions";
import "./App.css";

function App() {
  return (
    <div className="app-container">
      <h1 className="app-title">Online File Converter</h1>
      <FileConverter conversionOptions={conversions} />
    </div>
  );
}

export default App;
