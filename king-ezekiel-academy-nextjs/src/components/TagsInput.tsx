import React, { useState, KeyboardEvent, ChangeEvent } from 'react';

interface TagsInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
}

const TagsInput: React.FC<TagsInputProps> = ({
  tags,
  onChange,
  placeholder = "Type and press Enter to add tags...",
  maxTags = 10,
  className = ""
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      // Remove last tag on backspace if input is empty
      removeTag(tags.length - 1);
    }
  };

  const addTag = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !tags.includes(trimmedValue) && tags.length < maxTags) {
      const newTags = [...tags, trimmedValue];
      onChange(newTags);
      setInputValue('');
    }
  };

  const removeTag = (indexToRemove: number) => {
    const newTags = tags.filter((_, index) => index !== indexToRemove);
    onChange(newTags);
  };

  const handleInputBlur = () => {
    // Add tag when input loses focus if there's content
    if (inputValue.trim()) {
      addTag();
    }
  };

  return (
    <div className={`border border-gray-300 rounded-lg p-3 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-all duration-200 ${className}`}>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="ml-1 text-primary-600 hover:text-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded-full p-0.5 transition-colors"
              aria-label={`Remove tag: ${tag}`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
      </div>
      
      {tags.length < maxTags && (
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="w-full border-none outline-none text-sm placeholder-gray-400 focus:ring-0 focus:outline-none"
        />
      )}
      
      {tags.length >= maxTags && (
        <p className="text-xs text-gray-500 mt-1">
          Maximum {maxTags} tags reached
        </p>
      )}
    </div>
  );
};

export default TagsInput;
