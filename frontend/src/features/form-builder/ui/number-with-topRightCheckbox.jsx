import React from 'react';
import { Checkbox } from './checkbox';
import { Label } from './label'; // Using your custom Label wrapper

const NumberWithTopRightCheckbox = React.forwardRef(
  ({ field, isPreview, onChange, onCheckboxChange }, ref) => {
    return (
      <div className="space-y-1">

  {/* Label */}
  <Label
    htmlFor={`number-${field.id}`}
    className="text-sm break-words w-full"
  >
    {field.label || 'Mobile Number'}
  </Label>

  {/* Input */}
  <input
    ref={ref}
    id={`number-${field.id}`}
    type="number"
    placeholder={field?.placeholder}
    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
    disabled={!isPreview}
    onChange={(e) => onChange(field.id, e.target.value)}
  />

  {/* Checkbox */}
  <div className="flex items-center gap-2 w-full">
    <Checkbox
      id={`whatsapp-${field.id}`}
      disabled={!isPreview}
      checked={field.whatsappChecked}
      onCheckedChange={(checked) => onCheckboxChange(field.id, checked)}
    />
    <Label htmlFor={`whatsapp-${field.id}`} className="text-xs break-words">
      WhatsApp me?
    </Label>
  </div>

</div>
    );
  }
);

NumberWithTopRightCheckbox.displayName = 'NumberWithTopRightCheckbox';

export default NumberWithTopRightCheckbox;

