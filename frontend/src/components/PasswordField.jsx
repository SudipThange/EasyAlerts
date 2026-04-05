import { useState } from 'react';

const EyeIcon = ({ open }) => (
  <svg
    aria-hidden="true"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.25 12S5.25 6.75 12 6.75 21.75 12 21.75 12 18.75 17.25 12 17.25 2.25 12 2.25 12Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    <path
      d="M12 14.25A2.25 2.25 0 1 0 12 9.75a2.25 2.25 0 0 0 0 4.5Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    {!open && (
      <path
        d="M4.5 4.5 19.5 19.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    )}
  </svg>
);

const PasswordField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  autoComplete,
  inputClassName,
  helperText,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div>
      <label className="mb-2 block text-sm text-slate-600">{label}</label>
      <div className="relative">
        <input
          type={isVisible ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className={`${inputClassName} pr-12`}
        />
        <button
          type="button"
          onClick={() => setIsVisible((currentValue) => !currentValue)}
          aria-label={`${isVisible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 transition-colors hover:text-info"
        >
          <EyeIcon open={isVisible} />
        </button>
      </div>
      {helperText ? <p className="mt-1.5 text-xs text-slate-500">{helperText}</p> : null}
    </div>
  );
};

export default PasswordField;
