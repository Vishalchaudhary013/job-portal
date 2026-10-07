import React from 'react';
import { Icons } from './ui/ui-icons';
import { useFormBuilder } from './context/FormBuilderContext';
import { useOpportunities } from '../../context/OpportunitiesContext';
import PropertyEditor from './PropertyEditor';
import { useToast } from './hooks/use-toast';
import { SidebarTemplatesIcon } from './templates/templateIcons';

const ComponentsPanel = () => {
  const { addField, sidebarTab, setSidebarTab, openTemplatesModal } = useFormBuilder();
  const { isSuperAdmin } = useOpportunities();
  const { toast } = useToast();
  
  const adminControls = [
    { type: 'bannerUpload', label: 'Banner Upload', icon: <Icons.BannerUpload /> },
    { type: 'pdfUpload', label: 'PDF Upload', icon: <Icons.PdfUpload /> },
    { type: 'carouselUpload', label: 'Carousel Upload', icon: <Icons.CarouselUpload /> }
  ];

  const formFields = [
    { type: 'textInput', label: 'Text Input', icon: <Icons.TextInput /> },
    { type: 'textArea', label: 'Text Area', icon: <Icons.TextArea /> },
    { type: 'checkbox', label: 'Checkbox', icon: <Icons.Checkbox /> },
    { type: 'select', label: 'Select List', icon: <Icons.Select /> },
    { type: 'radio', label: 'Radio Button', icon: <Icons.Radio /> },
    { type: 'date', label: 'Date/Time Picker', icon: <Icons.Date /> },
    { type: 'toggle', label: 'Toggle Switch', icon: <Icons.Toggle /> },
    { type: 'fileUpload', label: 'File Upload', icon: <Icons.FileUpload /> },
    { type: 'number', label: 'Number Input', icon: <Icons.TextInput /> },
    { type: 'email', label: 'Email Input', icon: <Icons.Mail /> },
    { type: 'mobileWithCheckbox', label: 'Mobile with Checkbox', icon: <Icons.TextInput /> },
    { type: 'signature', label: 'Signature', icon: <Icons.Edit /> },

    { type: 'resumeUpload', label: 'Resume Upload', icon: <Icons.FileUpload />},
    { type: 'table', label: 'Table / Grid', icon: <Icons.Table /> },
  ];
  
  const handleDragStart = (e, component) => {
    e.dataTransfer.setData('componentType', component.type);
    e.target.classList.add('opacity-50');
  };
  
  const handleDragEnd = (e) => {
    e.target.classList.remove('opacity-50');
  };
  
  const handleComponentClick = (component) => {
    addField(component.type);
    
    // Only show toast for regular fields (not the special ones that trigger a modal)
    const specialTypes = ['bannerUpload', 'pdfUpload', 'carouselUpload'];
    if (!specialTypes.includes(component.type)) {
      toast({
        description: `${component.label} added`,
        duration: 2000,
      });
    }
  };

  return (
    <div className="w-60 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setSidebarTab('builder')}
          className={`flex-1 py-3 text-sm font-semibold transition-all duration-200 border-b-2 ${
            sidebarTab === 'builder'
              ? 'text-red-600 border-red-600 bg-blue-50/30'
              : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Form Builder
        </button>
        <button
          onClick={() => setSidebarTab('properties')}
          className={`flex-1 py-3 text-sm font-semibold transition-all duration-200 border-b-2 ${
            sidebarTab === 'properties'
              ? 'text-red-600 border-red-600 bg-blue-50/30'
              : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Properties
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {sidebarTab === 'builder' ? (
          <div className="p-5">
            <div className="">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Form Components</h3>
              
              <div className="space-y-6">
                {/* Templates Section */}
                <div>
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-3 px-1">Templates</h4>
                  <div className="space-y-2">
                    <div
                      onClick={openTemplatesModal}
                      className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg cursor-pointer hover:border-blue-200 hover:bg-gray-50 hover:shadow-sm transition-all group active:scale-[0.98]"
                    >
                      <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                        <SidebarTemplatesIcon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 tracking-tight">
                        Templates
                      </span>
                    </div>
                  </div>
                </div>

                {/* Admin Controls Section */}
                <div>
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-3 px-1">Admin Controls</h4>
                  <div className="space-y-2">
                    {adminControls.map(component => (
                      <div
                        key={component.type}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, component)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleComponentClick(component)}
                        className="flex items-center gap-3 p-3 bg-[#EEF2FF] border border-[#D0E5FF] rounded-lg cursor-move hover:border-blue-400 hover:shadow-md transition-all group active:scale-[0.98]"
                      >
                        <div className="text-blue-500 group-hover:text-blue-600 transition-colors">
                          {component.icon}
                        </div>
                        <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">{component.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Fields Section */}
                <div>
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-3 px-1">Form Fields</h4>
                  <div className="space-y-2">
                    {formFields.map(component => (
                      <div
                        key={component.type}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, component)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleComponentClick(component)}
                        className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg cursor-move hover:border-blue-200 hover:bg-gray-50 hover:shadow-sm transition-all group active:scale-[0.98]"
                      >
                        <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                          {component.icon}
                        </div>
                        <span className="text-sm font-medium text-gray-700 tracking-tight">
                          {component.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <PropertyEditor />
        )}
      </div>
    </div>
  );
};

export default ComponentsPanel;