import type { ConversionOption } from "../types/converter";

interface ConversionOptionsProps {
  options: ConversionOption[];
  onConvert: (option: ConversionOption) => void;
  isConverting: boolean;
}

export default function ConversionOptions({
  options,
  onConvert,
  isConverting,
}: ConversionOptionsProps) {
  return (
    <div className="options-section" aria-busy={isConverting}>
      {isConverting && (
        <div className="conversion-overlay" role="status" aria-live="polite">
          <span>Converting</span>
          <span className="loading-dots" aria-hidden="true" />
        </div>
      )}
      <h2>Conversion Options</h2>
      <div className="options-grid">
        {options.map((option) => (
          <div key={option.conversionType} className="option-card">
            <div className="option-content">
              <div className="option-text">
                <span className="format">
                  {option.sourceFormat.toUpperCase()}
                </span>
                <span className="arrow">→</span>
                <span className="format">
                  {option.targetFormat.toUpperCase()}
                </span>
              </div>
              <button
                className="convert-btn"
                onClick={() => onConvert(option)}
                disabled={option.disabled || isConverting}
              >
                Convert
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
