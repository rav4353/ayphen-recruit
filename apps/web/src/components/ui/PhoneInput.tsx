import PhoneInputWithCountry from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './PhoneInput.css';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  error,
  placeholder = '+1 (555) 123-4567',
  disabled = false
}: PhoneInputProps) {
  return (
    <div className={`phone-input-wrapper ${error ? 'phone-input-error' : ''}`}>
      <PhoneInputWithCountry
        international
        defaultCountry="US"
        value={value}
        onChange={(val) => onChange(val || '')}
        disabled={disabled}
        placeholder={placeholder}
      />
    </div>
  );
}
