import { useState, useEffect, useCallback, useRef } from "react";
import "../styles/FileConverter.css";
import { ConversionOption, FileConverterProps } from "../types/converter";
import { readFileAsText, extractFileInfo, toAbsoluteUrl } from "../utils/fileUtils";
import { allowedConversions } from "../utils/allowedConversions";

import FileUpload from "./FileUpload";
import ConversionOptions from "./ConversionOptions";
import DownloadSection from "./DownloadSection";

import TextPreview from "./previews/TextPreview";
import WordPreview from "./previews/WordPreview";
import ImagePreview from "./previews/ImagePreview";
import PDFPreview from "./previews/PDFPreview";
import UnsupportedPreview from "./previews/UnsupportedPreview";

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

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

  const handleFileDrop = useCallback(
    (newFile: File) => {
      onFileUpload(newFile);
      setConvertedFile(null);
      setConvertedPreviewFile(null);
      setError(null);
    },
    [onFileUpload, setConvertedFile]
  );

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

      <FileUpload file={file} onFileChange={handleFileChange} onFileDrop={handleFileDrop} />

      {file && renderFilePreview(file, previewUrl)}

      <ConversionOptions options={optionsState} onConvert={handleConvert} />

      {convertedPreviewFile && convertedFile && (
        <DownloadSection
          convertedFile={convertedFile}
          convertedPreviewFile={convertedPreviewFile}
          onDownload={handleDownloadBlob}
        />
      )}
    </div>
  );
}
