import { useState, useEffect, useCallback, useRef } from "react";
import "../styles/FileConverter.css";

type ConversionType =
  | "pdf-to-jpg"
  | "pdf-to-txt"
  | "jpg-to-png"
  | "png-to-jpg"
  | "jpg-to-pdf"
  | "txt-to-pdf"
  | "docx-to-pdf";

interface ConversionOption {
  id: ConversionType;
  label: string;
  from: string;
  to: string;
  disabled?: boolean;
}

interface FileConverterProps {
  file: File | null;
  convertedFile: string | null;
  setConvertedFile: (url: string | null) => void;
  onFileUpload: (file: File) => void;
  onDownload: () => void;
  conversionOptions: ConversionOption[];
}

const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

const TextPreview = ({ file, isLoading }: { file: File; isLoading: boolean }) => {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      readFileAsText(file)
        .then(setText)
        .catch(() => setError("Failed to load file content"));
    }
  }, [file, isLoading]);

  if (isLoading) return <p className="loading-message">Loading text content...</p>;
  if (error) return <p className="error-message">{error}</p>;
  return <textarea readOnly value={text} className="text-preview" />;
};

const WordPreview = () => (
  <div className="word-preview">
    <p>To preview Word documents, please convert them to PDF first</p>
  </div>
);

const ImagePreview = ({ url }: { url: string }) => {
  const [hasError, setHasError] = useState(false);
  if (hasError) return <p className="error-message">Failed to load image preview</p>;
  return <img src={url} alt="Preview" onError={() => setHasError(true)} className="preview-image" />;
};

const PDFPreview = ({ url }: { url: string }) => (
  <iframe src={url} title="PDF Preview" className="pdf-preview" />
);

const UnsupportedPreview = ({ fileType }: { fileType: string }) => (
  <div className="unsupported-preview">
    <p>Preview not available for this file type</p>
    <p>Type: {fileType || "unknown"}</p>
  </div>
);

// Map of allowed conversions based on file extension
const allowedConversions: Record<string, ConversionType[]> = {
  pdf: ["pdf-to-jpg", "pdf-to-txt"],
  jpg: ["jpg-to-png", "jpg-to-pdf"],
  png: ["png-to-jpg"],
  txt: ["txt-to-pdf"],
  docx: ["docx-to-pdf"],
};

export default function FileConverter({
  file,
  convertedFile,
  setConvertedFile,
  onFileUpload,
  onDownload,
  conversionOptions,
}: FileConverterProps) {
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertedPreviewFile, setConvertedPreviewFile] = useState<File | null>(null);
  const [optionsState, setOptionsState] = useState<ConversionOption[]>(conversionOptions);
  const previewUrlRef = useRef<string | null>(null);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  // Handle text file preview loading
  useEffect(() => {
    const loadTextContent = async () => {
      if (file && (file.type === "text/plain" || file.name.endsWith(".txt"))) {
        setIsLoadingText(true);
        try {
          await readFileAsText(file);
          setError(null);
        } catch {
          setError("Failed to read file content");
        } finally {
          setIsLoadingText(false);
        }
      }
    };
    loadTextContent();
  }, [file]);

  // Enable/disable conversion options based on file extension
  useEffect(() => {
    if (!file) {
      setOptionsState(conversionOptions.map((opt) => ({ ...opt, disabled: true })));
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowed = ext ? allowedConversions[ext] || [] : [];

    setOptionsState(
      conversionOptions.map((opt) => ({
        ...opt,
        disabled: !allowed.includes(opt.id),
      }))
    );
  }, [file, conversionOptions]);

  const renderFilePreview = useCallback(
    (f: File | null, url: string | null) => {
      if (!f || !url) return null;
      previewUrlRef.current = url;

      const fileType = f.type;
      const fileName = f.name.toLowerCase();
      const isImage = fileType.startsWith("image/");
      const isPDF = fileType === "application/pdf" || fileName.endsWith(".pdf");
      const isText = fileType === "text/plain" || fileName.endsWith(".txt");
      const isWord = fileName.endsWith(".docx") || fileType.includes("wordprocessingml.document");

      return (
        <div className="file-preview">
          {isImage ? (
            <ImagePreview url={url} />
          ) : isPDF ? (
            <PDFPreview url={url} />
          ) : isText ? (
            <TextPreview file={f} isLoading={isLoadingText} />
          ) : isWord ? (
            <WordPreview />
          ) : (
            <UnsupportedPreview fileType={fileType} />
          )}
        </div>
      );
    },
    [isLoadingText]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFile = e.target.files?.[0];
      if (newFile) {
        onFileUpload(newFile);
        setConvertedFile(null);
        setConvertedPreviewFile(null);
        setError(null);
      }
    },
    [onFileUpload, setConvertedFile]
  );

  const extractFileInfo = (data: any): { path: string; name: string } | null => {
    if (data?.files?.length) {
      const { url, name } = data.files[0];
      if (url) return { path: url, name: name || url.split("/").pop() || "converted-file" };
    }
    if (data?.outputFile) {
      const name = data.outputFile.split("/").pop() || "converted-file";
      return { path: data.outputFile, name };
    }
    if (data?.filename) {
      return { path: `/output/${data.filename}`, name: data.filename };
    }
    return null;
  };

  const toAbsoluteUrl = (maybeRelative: string) =>
    /^https?:\/\//i.test(maybeRelative)
      ? maybeRelative
      : `http://localhost:5000${maybeRelative.startsWith("/") ? "" : "/"}${maybeRelative}`;

  const handleConvert = async (option: ConversionOption) => {
    if (!file) {
      setError("Please upload a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversionType", option.id);
    formData.append("target", option.to.toLowerCase());

    try {
      const res = await fetch("http://localhost:5000/convert", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Conversion failed");

      const data = await res.json();
      const info = extractFileInfo(data);
      if (!info) throw new Error("Backend did not return output path");

      const absoluteUrl = toAbsoluteUrl(info.path);
      setConvertedFile(absoluteUrl);

      const fileRes = await fetch(absoluteUrl);
      if (!fileRes.ok) throw new Error("Failed to fetch converted file");

      const blob = await fileRes.blob();
      const downloadedFile = new File([blob], info.name, { type: blob.type });
      setConvertedPreviewFile(downloadedFile);

      setError(null);
    } catch (err) {
      console.error(err);
      setError("Error converting file");
    }
  };

  const handleDownloadBlob = () => {
    if (!convertedPreviewFile) return;
    const blobUrl = URL.createObjectURL(convertedPreviewFile);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = convertedPreviewFile.name || "converted-file";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <div className="converter-container">
      {error && <div className="error-message">{error}</div>}

      <div className="upload-section">
        <h2>Upload File</h2>
        <label className="file-input-label">
          Choose File
          <input type="file" className="file-input" onChange={handleFileChange} />
        </label>
        <span className="file-name">{file?.name || "No file chosen"}</span>
        {file && renderFilePreview(file, URL.createObjectURL(file))}
      </div>

      <div className="options-section">
        <h2>Conversion Options</h2>
        <div className="options-grid">
          {optionsState.map((option) => (
            <div key={option.id} className="option-card">
              <div className="option-content">
                <div className="option-text">
                  <span className="format">{option.from}</span>
                  <span className="arrow">→</span>
                  <span className="format">{option.to}</span>
                </div>
                <button
                  className="convert-btn"
                  onClick={() => handleConvert(option)}
                  disabled={option.disabled}
                >
                  Convert
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {convertedPreviewFile && convertedFile && (
        <div className="download-section">
          <h2>Download Converted File</h2>
          {renderFilePreview(convertedPreviewFile, convertedFile)}
          <button onClick={handleDownloadBlob} className="download-btn">
            Download File
          </button>
        </div>
      )}
    </div>
  );
}
