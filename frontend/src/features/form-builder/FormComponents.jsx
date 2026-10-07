import React from 'react';
import { Switch } from './ui/switch';
import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
// import { Gender, GenderItem } from '@/components/ui/gender';
import GenderRadioGroup from './ui/gender';
import NumberWithTopRightCheckbox from './ui/number-with-topRightCheckbox';
import SignaturePad from './ui/SignaturePad';

// A dedicated `signature` field, or any plain text field the author named "Signature" /
// "Sign here", renders as a draw-or-upload signature pad.
const isSignatureField = (field) =>
  field?.type === 'signature' ||
  (['textInput', 'textArea'].includes(field?.type) && /\bsign(ature)?\b|sign\s*here/i.test(field?.label || ''));

const FormComponents = ({ field, isPreview, onChange = () => {}, onCheckboxChange = () => {}, onBuildResume }) => {
  if (isSignatureField(field)) {
    return (
      <SignaturePad
        value={typeof field.value === 'string' ? field.value : ''}
        disabled={!isPreview}
        required={field.required}
        onChange={(dataUrl) => onChange(field.id, dataUrl)}
      />
    );
  }

  switch (field.type) {
    case 'textInput':
      return (
        <input 
          type="text" 
          value={field.value || ''}
          placeholder={field.placeholder || ''}
          className="mt-1 block w-full border border-gray-300 rounded-md  py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          disabled={!isPreview}
          onChange={(e) => onChange(field.id, e.target.value)}
          required={field.required}
          minLength={field.minLength}
          maxLength={field.maxLength}
          readOnly={field.readOnly}
        />
      );

    case 'textArea':
      return (
        <textarea 
          value={field.value || ''}
          placeholder={field.placeholder || ''}
          className="mt-1 block w-full border border-gray-300 rounded-md  py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          rows={field.rows || 3}
          disabled={!isPreview}
          onChange={(e) => onChange(field.id, e.target.value)}
          required={field.required}
          minLength={field.minLength}
          maxLength={field.maxLength}
          readOnly={field.readOnly}
        ></textarea>
      );

    case 'checkbox':
      return (
        <div className="mt-2">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <Checkbox
                id={`checkbox-${field.id}`}
                disabled={!isPreview}
                checked={field.value}
                onCheckedChange={(checked) => onChange(field.id, checked)}
                required={field.required}
              />
            </div>
            <div className="ml-3 text-sm">
              <Label htmlFor={`checkbox-${field.id}`}>{field.label || 'I agree to the terms and conditions'}</Label>
              {field.checkboxText && <p className="text-gray-500">{field.checkboxText}</p>}
            </div>
          </div>
        </div>
      );

    case 'select':
      return (
        <select 
          value={field.value || ''}
          className="mt-1 block w-full bg-white border border-gray-300 rounded-md  py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          disabled={!isPreview}
          onChange={(e) => onChange(field.id, e.target.value)}
          required={field.required}
        >
          <option value="">{field.placeholder || 'Please select an option'}</option>
          {field.options?.map((option, idx) => (
            <option key={idx} value={option.value}>{option.label}</option>
          )) || (
            <>
              <option value="option1">Option 1</option>
              <option value="option2">Option 2</option>
              <option value="option3">Option 3</option>
            </>
          )}
        </select>
      );

    case 'radio':
      return (
        <RadioGroup 
          value={field.value || ''}
          className="mt-2 space-y-2" 
          disabled={!isPreview}
          inline={false}
          onValueChange={(value) => onChange(field.id, value)}
          required={field.required}
        >
          {field.options?.map((option, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={`radio-${field.id}-${idx}`} />
              <Label htmlFor={`radio-${field.id}-${idx}`}>{option.label}</Label>
            </div>
          )) || (
            <>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option1" id={`radio-${field.id}-1`} />
                <Label htmlFor={`radio-${field.id}-1`}>Option 1</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option2" id={`radio-${field.id}-2`} />
                <Label htmlFor={`radio-${field.id}-2`}>Option 2</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option3" id={`radio-${field.id}-3`} />
                <Label htmlFor={`radio-${field.id}-3`}>Option 3</Label>
              </div>
            </>
          )}
        </RadioGroup>
      );

      case 'gender': 
      return (
        <React.Fragment>
          <GenderRadioGroup
            value={field.value} // <- dynamic value (e.g., 'male', 'female', 'other')
            onChange={(value) => onChange(field.id, value)}
            disabled={!isPreview} // optional: disable logic
          />
        </React.Fragment>
      );     

    case 'date':
      return (
        <input 
          type="date" 
          value={field.value || ''}
          className="mt-1 block w-full border border-gray-300 rounded-md  py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          disabled={!isPreview}
          onChange={(e) => onChange(field.id, e.target.value)}
          required={field.required}
          min={field.min}
          max={field.max}
          readOnly={field.readOnly}
        />
      );

    case 'toggle':
      return (
        <div className="mt-2 flex items-center">
          <Switch
            checked={field.value !== undefined ? field.value : field.defaultChecked || false}
            onCheckedChange={(checked) => {
              console.log("Toggle switched:", checked);
              if (onChange) onChange(field.id, checked);
            }}
            disabled={!isPreview}
          />
          <span className="ml-2 text-sm text-gray-700">{field?.label || 'Enable'}</span>
        </div>
      );

    case 'fileUpload':
      return (
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center w-full">
            {field.previewUrl || field.value?.previewUrl ? (
              <div className="flex flex-col items-center">
                <div className="my-3 p-2 border rounded bg-gray-50 flex items-center max-w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-gray-700 truncate max-w-[200px]">
                    {field.fileName || field.value?.fileName || 'Uploaded file'}
                  </span>
                </div>
                
                {isPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onChange) onChange(field.id, null);
                      console.log("File removed");
                    }}
                    className="text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Remove file
                  </button>
                )}
              </div>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div className="flex flex-col text-sm text-gray-600 justify-center">
                  <button 
                    type="button"
                    className="cursor-pointer mx-auto mb-2 px-4 py-2 border border-gray-300 rounded-md  text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    onClick={(e) => {
                      e.preventDefault();
                      if (isPreview) {
                        console.log("Trying to open file input with ID:", `file-upload-${field.id}`);
                        // Direct approach - open file selector
                        const fileInput = document.getElementById(`file-upload-${field.id}`);
                        if (fileInput) {
                          fileInput.click();
                          console.log("File input clicked");
                        } else {
                          console.error(`Could not find file input with id file-upload-${field.id}`);
                        }
                      }
                    }}
                  >
                    Select a file
                  </button>
                  <input 
                    id={`file-upload-${field.id}`} 
                    name={`file-upload-${field.id}`} 
                    type="file" 
                    className="hidden"
                    disabled={!isPreview}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        console.log("File selected:", file.name);
                        
                        // Create a FileReader to read the file as data URL
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            // Create file data with both file object and data URL
                            const fileData = {
                              file: file,
                              fileName: file.name,
                              fileType: file.type,
                              previewUrl: URL.createObjectURL(file),
                              dataUrl: event.target.result
                            };
                            
                            // Log success and call onChange handler
                            console.log("File successfully processed:", file.name);
                            if (onChange) onChange(field.id, fileData);
                          }
                        };
                        
                        // Handle potential errors during file reading
                        reader.onerror = () => {
                          console.error("Error reading file:", file.name);
                        };
                        
                        // Start reading the file as data URL
                        reader.readAsDataURL(file);
                      }
                    }}
                    required={field.required}
                    accept={field.allowedTypes || "image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
                  />
                  <p className="text-sm text-center text-gray-500">or drag and drop your file here</p>
                </div>
                <p className="text-xs text-gray-500">
                  {field.fileTypeText || 'PNG, JPG, PDF, DOC up to 10MB'}
                </p>
              </>
            )}
          </div>
        </div>
      );

    case 'resumeUpload': {
      return (
        <div className="flex flex-col items-center justify-center px-4 py-6 bg-white rounded-md">
          <h2 className="text-lg font-medium text-gray-800 text-center mb-6">
            Upload your resume to be considered for jobs that match
          </h2>

          <div className="flex items-center justify-center gap-8 w-full max-w-3xl">
            {/* Upload resume button */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById(`file-upload-${field.id}`);
                  if (input) input.click();
                }}
                className="px-6 py-3 bg-[#1F2853] text-white rounded-full text-sm font-medium hover:bg-[#00443c] transition"
              >
                Upload resume
              </button>
              <input
                id={`file-upload-${field.id}`}
                name={`file-upload-${field.id}`}
                type="file"
                className="hidden"
                disabled={!isPreview}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      if (event.target?.result) {
                        const fileData = {
                          file,
                          fileName: file.name,
                          fileType: file.type,
                          previewUrl: URL.createObjectURL(file),
                          dataUrl: event.target.result,
                        };
                        if (onChange) onChange(field.id, fileData);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                required={field.required}
                accept={
                  field.allowedTypes ||
                  "image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                }
              />
            </div>

            {/* OR Divider */}
            <div className="flex flex-col items-center text-gray-500 text-sm">
              <div className="h-5 border-l border-gray-300 mb-1" />
              OR
              <div className="h-5 border-l border-gray-300 mt-1" />
            </div>

            {/* Continue without resume — build one in the Resume Builder and
                come straight back with it attached (see formResumeHandoff.js). */}
            <div className="text-sm text-left max-w-xs">
              <p className="text-gray-600 mb-1">Don't have a resume file ready?</p>
              <button
                type="button"
                onClick={() => {
                  if (typeof onBuildResume === "function") {
                    onBuildResume(field.id);
                    return;
                  }
                  if (onChange) onChange(field.id, null);
                }}
                className="text-teal-700 hover:underline font-medium"
              >
                {typeof onBuildResume === "function"
                  ? "Build a resume now →"
                  : "Continue without resume →"}
              </button>
            </div>
          </div>

          {field.value?.fromBuilder && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Resume attached from Resume Builder
            </div>
          )}
          {/* Show uploaded file if exists */}
          {(field.previewUrl || field.value?.previewUrl) && (
            <div className="mt-4 flex flex-col items-center">
              <div className="my-2 p-2 border rounded bg-gray-50 flex items-center max-w-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-600 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-gray-700 truncate max-w-[200px]">
                  {field.fileName || field.value?.fileName || 'Uploaded file'}
                </span>
              </div>
              {isPreview && (
                <button
                  type="button"
                  onClick={() => {
                    if (onChange) onChange(field.id, null);
                  }}
                  className="text-xs text-red-600 hover:text-red-800 underline"
                >
                  Remove file
                </button>
              )}
            </div>
          )}
        </div>
      );
    }

    case 'table': {
      const rows = field.tableRows || [];
      const columns = field.tableColumns || [];
      const cells = field.value?.cells || {};

      const updateCell = (rowKey, colKey, text) => {
        onChange(field.id, {
          cells: { ...cells, [rowKey]: { ...(cells[rowKey] || {}), [colKey]: text } },
        });
      };

      return (
        <div className="mt-1 overflow-x-auto">
          <div className="overflow-hidden rounded-md border border-gray-300">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {field.hasRowLabelColumn && (
                    <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700">
                      {field.rowLabelHeader || ''}
                    </th>
                  )}
                  {columns.map((col) => (
                    <th key={col.key} className="border border-gray-300 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key}>
                    {field.hasRowLabelColumn && (
                      <td className="border border-gray-300 bg-gray-50/60 px-3 py-2 font-medium text-gray-700 whitespace-nowrap">
                        {row.label}
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className="border border-gray-300 p-0">
                        <input
                          type="text"
                          value={cells[row.key]?.[col.key] || ''}
                          onChange={(e) => updateCell(row.key, col.key, e.target.value)}
                          disabled={!isPreview}
                          className="w-full px-3 py-2 text-sm border-none outline-none focus:ring-1 focus:ring-inset focus:ring-primary-500 disabled:bg-transparent"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    case 'number':
      return (
        <input
          type="number"
          placeholder={field?.placeholder}
          className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          disabled={!isPreview}
          onChange={(e) => onChange(field.id, e.target.value)}
          required={field.required}
          min={field.min}
          max={field.max}
          step={field.step || 1}
          readOnly={field.readOnly}
        />
      );

    case 'mobileWithCheckbox':
        return (
          <NumberWithTopRightCheckbox
            field={field}
            isPreview={isPreview}
            onChange={onChange}
            onCheckboxChange={onCheckboxChange}
          />
        );

    case 'email':
      return (
        <input 
          type="email" 
          placeholder={field.placeholder || 'email@example.com'}
          className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          disabled={!isPreview}
          onChange={(e) => onChange(field.id, e.target.value)}
          required={field.required}
          pattern={field.pattern}
          readOnly={field.readOnly}
        />
      );

    case 'mediaUpload':
      return (
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center w-full">
            {field.previewUrl || field.value?.previewUrl ? (
              <div className="flex flex-col items-center">
                {(field.fileType && field.fileType.startsWith('video/')) || 
                 (field.value?.fileType && field.value.fileType.startsWith('video/')) ? (
                  <video 
                    controls 
                    className="max-w-full h-auto max-h-[200px] mb-2 border rounded"
                    src={field.previewUrl || field.value?.previewUrl}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (field.fileType && field.fileType.startsWith('audio/')) || 
                   (field.value?.fileType && field.value.fileType.startsWith('audio/')) ? (
                  <audio 
                    controls 
                    className="max-w-full mb-2"
                    src={field.previewUrl || field.value?.previewUrl}
                  >
                    Your browser does not support the audio tag.
                  </audio>
                ) : (
                  <div className="my-3 p-2 border rounded bg-gray-50 flex items-center max-w-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-700 truncate max-w-[200px]">
                      {field.fileName || field.value?.fileName || 'Uploaded media'}
                    </span>
                  </div>
                )}
                
                {isPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onChange) onChange(field.id, null);
                      console.log("Media removed");
                    }}
                    className="text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Remove media
                  </button>
                )}
              </div>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex flex-col text-sm text-gray-600 justify-center">
                  <button 
                    type="button"
                    className="cursor-pointer mx-auto mb-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    onClick={(e) => {
                      e.preventDefault();
                      if (isPreview) {
                        console.log("Trying to open media file input with ID:", `media-upload-${field.id}`);
                        // Direct approach - open file selector
                        const fileInput = document.getElementById(`media-upload-${field.id}`);
                        if (fileInput) {
                          fileInput.click();
                          console.log("Media file input clicked");
                        } else {
                          console.error(`Could not find file input with id media-upload-${field.id}`);
                        }
                      }
                    }}
                  >
                    Select media file
                  </button>
                  <input 
                    id={`media-upload-${field.id}`} 
                    name={`media-upload-${field.id}`} 
                    type="file" 
                    className="hidden"
                    disabled={!isPreview}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        console.log("Media file selected:", file.name, file.type);
                        
                        // Create a FileReader to read the file as data URL
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            // Create media file data with both file object and data URL
                            const fileData = {
                              file: file,
                              fileName: file.name,
                              fileType: file.type,
                              previewUrl: URL.createObjectURL(file),
                              dataUrl: event.target.result
                            };
                            
                            // Log success and call onChange handler
                            console.log("Media file successfully processed:", file.name);
                            if (onChange) onChange(field.id, fileData);
                          }
                        };
                        
                        // Handle potential errors during file reading
                        reader.onerror = () => {
                          console.error("Error reading media file:", file.name);
                        };
                        
                        // Start reading the file as data URL
                        reader.readAsDataURL(file);
                      }
                    }}
                    required={field.required}
                    accept={field.allowedTypes || "audio/*,video/*"}
                  />
                  <p className="text-sm text-center text-gray-500">or drag and drop your media file here</p>
                </div>
                <p className="text-xs text-gray-500">
                  {field.mediaTypeText || 'MP3, WAV, MP4, MOV up to 10MB'}
                </p>
              </>
            )}
          </div>
        </div>
      );

    case 'bannerUpload':
      if (!isPreview) return null;
      return (
        <div className="rounded-lg overflow-hidden border border-gray-200 h-40 bg-gray-50">
          <img 
            src={field.bannerUrl || field.value?.preview} 
            alt="Banner" 
            className="w-full h-full object-cover"
          />
        </div>
      );
    
    case 'pdfUpload':
      if (!isPreview) return null;
      return (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="p-2 bg-white rounded-md ">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-900 truncate">Attached PDF Document</p>
            <p className="text-xs text-red-600">Included in application</p>
          </div>
        </div>
      );

    case 'carouselUpload':
      if (!isPreview) return null;
      return (
        <div className="flex gap-2 overflow-x-auto py-2 custom-scrollbar">
          {(field.images || []).map((img, idx) => (
            <div key={idx} className="h-20 w-20 flex-shrink-0 rounded-md border border-gray-200 overflow-hidden">
              <img src={img.preview} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
          {(!field.images || field.images.length === 0) && (
            <p className="text-xs text-gray-400 italic">No images in carousel</p>
          )}
        </div>
      );

    default:
      return <p className="text-sm text-gray-500">Unknown field type: {field.type}</p>;
  }
};

export default FormComponents;
