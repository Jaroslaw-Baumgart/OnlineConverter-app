import { useState } from 'react';
import FileConverter from './components/FileConverter';
import { conversions } from './config/conversions';
import './App.css';

function App() {
  const [file, setFile] = useState<File | null>(null);

  const handleFileUpload = (file: File) => {
    setFile(file);
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Online File Converter</h1>
      <FileConverter
        file={file}
        onFileUpload={handleFileUpload}
        conversionOptions={conversions}
      />
    </div>
  );
}

export default App;
