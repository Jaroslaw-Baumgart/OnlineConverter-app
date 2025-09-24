import { ConversionOption } from "../types/converter";

interface ConversionOptionsProps {
  options: ConversionOption[];
  onConvert: (option: ConversionOption) => void;
}

export default function ConversionOptions({ options, onConvert }: ConversionOptionsProps) {
  return (
    <div className="options-section">
      <h2>Conversion Options</h2>
      <div className="options-grid">
        {options.map((option) => (
          <div key={option.id} className="option-card">
            <div className="option-content">
              <div className="option-text">
                <span className="format">{option.from}</span>
                <span className="arrow">→</span>
                <span className="format">{option.to}</span>
              </div>
              <button
                className="convert-btn"
                onClick={() => onConvert(option)}
                disabled={option.disabled}
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
