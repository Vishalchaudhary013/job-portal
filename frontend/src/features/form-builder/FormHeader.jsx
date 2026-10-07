import React, { useState } from 'react';
import { FiLayout, FiX } from 'react-icons/fi';
import { Icons } from './ui/ui-icons';
import { useFormBuilder } from "./context/FormBuilderContext";
import { Textarea } from './ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';

const FormHeader = () => {
  const {
    formState,
    setFormState,
    handlers,
    isEditingTemplate,
    editingTemplate,
    exitTemplateEditMode,
  } = useFormBuilder();
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  
  const handleFormNameChange = (e) => {
    setFormState(prev => ({
      ...prev,
      name: e.target.value
    }));
  };
  
  const handleDescriptionChange = (e) => {
    setFormState(prev => ({
      ...prev,
      description: e.target.value
    }));
  };
  
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex flex-col">
      {isEditingTemplate && (
        <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
            <FiLayout className="w-4 h-4" />
            Editing Template: {editingTemplate?.name} (v{editingTemplate?.version})
          </div>
          <button
            onClick={exitTemplateEditMode}
            className="flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900"
          >
            <FiX className="w-3.5 h-3.5" />
            Exit
          </button>
        </div>
      )}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <button className="md:hidden mr-4 text-gray-500 hover:text-gray-700">
            <Icons.Menu />
          </button>
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Untitled Form" 
              className={`text-xl font-semibold focus:outline-none focus:ring-2 rounded px-2 py-1 transition-all ${
                (!formState.name || formState.name === 'Untitled Form') 
                ? 'text-gray-400  border rounded border-black/80 focus:ring-red-500' 
                : 'text-gray-800 focus:ring-primary-500'
              }`} 
              value={formState.name || ''}
              onChange={handleFormNameChange}
            />
            {(!formState.name || formState.name === 'Untitled Form') && (
              <span className="absolute -top-1 -right-2 text-red-500 text-xs font-bold animate-pulse">*</span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            onClick={() => handlers?.onPreview && handlers.onPreview()}
          >
            Preview
          </button>
          <button
            className="px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            onClick={() => handlers?.onSave && handlers.onSave()}
          >
            {isEditingTemplate ? 'Save Template' : 'Save Draft'}
          </button>
          {!isEditingTemplate && (
            <button
              className="px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => handlers?.onPublish && handlers.onPublish()}
            >
              Publish
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-2 flex items-center">
        <Popover open={isDescriptionOpen} onOpenChange={setIsDescriptionOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs text-gray-600 flex items-center gap-1"
            >
              <Icons.MessageSquare className="h-3 w-3" />
              {formState.description ? 'Edit Description' : 'Add Description'}
              {!formState.description && (
                <span className="ml-1 text-[10px] text-red-500 font-bold">*</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0 rounded-xl border border-gray-200 shadow-xl bg-white">

  <div className="p-4 space-y-3">
    
    {/* Title */}
    <h4 className="text-sm font-semibold text-gray-800">
      Form Description
    </h4>

    {/* Subtitle */}
    <p className="text-xs text-gray-500">
      Add details about your form to help users understand its purpose.
    </p>

    {/* Textarea */}
    <Textarea
      placeholder="Write a short description..."
      value={formState.description || ''}
      onChange={handleDescriptionChange}
      className="min-h-[110px] bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
    />

    {/* Footer */}
    <div className="flex justify-end pt-2">
      <Button
        size="sm"
        className="bg-red-600 hover:bg-blue-700 text-white px-4"
        onClick={() => setIsDescriptionOpen(false)}
      >
        Save
      </Button>
    </div>

  </div>
</PopoverContent>
        </Popover>
        
        {formState.description && (
          <p className="ml-3 text-sm text-gray-500 truncate max-w-md">
            {formState.description}
          </p>
        )}
      </div>
    </header>
  );
};

export default FormHeader;
