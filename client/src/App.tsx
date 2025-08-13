import { useState } from 'react';
import FileConverter from './components/FileConverter';
import { ConversionOption } from './types/converter';
import './App.css';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [convertedFile, setConvertedFile] = useState<string | null>(null);

  const handleFileUpload = (file: File) => {
    setFile(file);
    setConvertedFile(null); // reset converted file przy nowym uploadzie
  };

  const handleDownload = () => {
    if (!convertedFile) return;

    const a = document.createElement('a');
    a.href = convertedFile;
    a.download = file?.name || 'converted-file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const conversionOptions: ConversionOption[] = [
    { id: 'pdf-to-jpg', label: 'PDF to JPG', from: 'PDF', to: 'JPG' },
    { id: 'pdf-to-txt', label: 'PDF to TXT', from: 'PDF', to: 'TXT' },
    { id: 'jpg-to-png', label: 'JPG to PNG', from: 'JPG', to: 'PNG' },
    { id: 'png-to-jpg', label: 'PNG to JPG', from: 'PNG', to: 'JPG' },
    { id: 'jpg-to-pdf', label: 'JPG to PDF', from: 'JPG', to: 'PDF' },
    { id: 'txt-to-pdf', label: 'TXT to PDF', from: 'TXT', to: 'PDF' },
    { id: 'docx-to-pdf', label: 'DOCX to PDF', from: 'DOCX', to: 'PDF' },
  ];

  return (
    <div className="app-container">
      <h1 className="app-title">Online File Converter</h1>
      <FileConverter
        file={file}
        onFileUpload={handleFileUpload}
        onDownload={handleDownload}
        conversionOptions={conversionOptions}
        convertedFile={convertedFile}
        setConvertedFile={setConvertedFile} // nowy props
      />
    </div>
  );
}

export default App;
