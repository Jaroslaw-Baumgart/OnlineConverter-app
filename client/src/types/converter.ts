export type ConversionType = 
  | 'pdf-to-jpg'
  | 'pdf-to-txt'
  | 'jpg-to-png'
  | 'png-to-jpg'
  | 'jpg-to-pdf'
  | 'txt-to-pdf'
  | 'docx-to-pdf';

export interface ConversionOption {
  id: ConversionType;
  label: string;
  from: string;
  to: string;
  disabled?: boolean;
}