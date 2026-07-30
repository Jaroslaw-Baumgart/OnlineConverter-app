import { useState } from 'react';
import FileConverter from './components/FileConverter';
import { conversions } from './config/conversions';
import './App.css';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [convertedFile, setConvertedFile] = useState<string | null>(null);

  const handleFileUpload = (file: File) => {
    setFile(file);
    setConvertedFile(null); // reset converted file przy nowym uploadzie
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Online File Converter</h1>
      <FileConverter
        file={file}
        onFileUpload={handleFileUpload}
        conversionOptions={conversions}
        convertedFile={convertedFile}
        setConvertedFile={setConvertedFile} // nowy props
      />
    </div>
  );
}

export default App;
