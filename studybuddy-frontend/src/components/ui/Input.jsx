import React, { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    endIcon: EndIcon,
    onEndIconClick,
    className = '',
    id,
    required = false,
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-[#8F889D]">
          {label}
          {required && <span className="text-[#F87171] ml-1">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-[#8F889D] pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full bg-[#11101A] border text-[#F5F3F7] placeholder-[#645E73] text-sm rounded-xl transition-all duration-200 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]/50 ${
            Icon ? 'pl-10' : 'pl-3.5'
          } ${EndIcon ? 'pr-10' : 'pr-3.5'} py-2.5 ${
            error ? 'border-[#F87171]' : 'border-[#292332] hover:border-[#3D354B]'
          } ${className}`}
          {...props}
        />
        {EndIcon && (
          <button
            type="button"
            onClick={onEndIconClick}
            className="absolute right-3.5 text-[#8F889D] hover:text-[#F5F3F7] transition-colors"
          >
            <EndIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      {error && <p className="text-xs text-[#F87171]">{error}</p>}
      {!error && helperText && <p className="text-xs text-[#8F889D]">{helperText}</p>}
    </div>
  );
});

export const Select = forwardRef(function Select(
  {
    label,
    error,
    options = [],
    children,
    className = '',
    id,
    required = false,
    ...props
  },
  ref
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-medium text-[#8F889D]">
          {label}
          {required && <span className="text-[#F87171] ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`w-full bg-[#11101A] border text-[#F5F3F7] text-sm rounded-xl px-3.5 py-2.5 transition-all duration-200 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]/50 ${
          error ? 'border-[#F87171]' : 'border-[#292332] hover:border-[#3D354B]'
        } ${className}`}
        {...props}
      >
        {children
          ? children
          : options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#11101A] text-[#F5F3F7]">
                {opt.label}
              </option>
            ))}
      </select>
      {error && <p className="text-xs text-[#F87171]">{error}</p>}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    helperText,
    className = '',
    id,
    required = false,
    rows = 3,
    ...props
  },
  ref
) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-medium text-[#8F889D]">
          {label}
          {required && <span className="text-[#F87171] ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={`w-full bg-[#11101A] border text-[#F5F3F7] placeholder-[#645E73] text-sm rounded-xl px-3.5 py-2.5 transition-all duration-200 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]/50 ${
          error ? 'border-[#F87171]' : 'border-[#292332] hover:border-[#3D354B]'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-[#F87171]">{error}</p>}
      {!error && helperText && <p className="text-xs text-[#8F889D]">{helperText}</p>}
    </div>
  );
});
