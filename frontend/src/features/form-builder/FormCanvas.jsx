import React, { useRef } from 'react';
import {
  DndContext,
  closestCenter
} from "@dnd-kit/core";

import {
  SortableContext,
  rectSortingStrategy,
  arrayMove
} from "@dnd-kit/sortable";
import SortableItem from './SortableItem';
import { useFormBuilder } from './context/FormBuilderContext';
import FormComponents from './FormComponents';
import { Icons } from './ui/ui-icons';
import ImageCarousel from './ui/image-carousel';
import { resolveAssetUrl } from "../../services/apiClient";

const FormCanvas = () => {
  const {
    formState,
    addField,
    setActiveField,
    moveFieldUp,
    moveFieldDown,
    deleteField,
    hasBannerComponent,
    hasPdfComponent,
    hasCarouselComponent,
    setFormState
  } = useFormBuilder();

  const bannerField = formState.fields.find(field => field.type === 'bannerUpload');
  const pdfField = formState.fields.find(field => field.type === 'pdfUpload');
  const carouselField = formState.fields.find(field => field.type === 'carouselUpload');

  const dropPlaceholderRef = useRef(null);
  const formCanvasRef = useRef(null);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setFormState(prev => {
      const oldIndex = prev.fields.findIndex(f => f.id === active.id);
      const newIndex = prev.fields.findIndex(f => f.id === over.id);

      return {
        ...prev,
        fields: arrayMove(prev.fields, oldIndex, newIndex)
      };
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (dropPlaceholderRef.current) {
      dropPlaceholderRef.current.classList.remove('hidden');
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (!formCanvasRef.current?.contains(e.relatedTarget) && dropPlaceholderRef.current) {
      dropPlaceholderRef.current.classList.add('hidden');
    }
  };

  const isSideLayout =
    (bannerField?.position !== 'top' && bannerField) ||
    (pdfField?.position !== 'top' && pdfField) ||
    (carouselField?.position !== 'top' && carouselField);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (dropPlaceholderRef.current) {
      dropPlaceholderRef.current.classList.add('hidden');
    }

    const componentType = e.dataTransfer.getData('componentType');
    if (componentType) {
      addField(componentType);
    }
  };

  const getFieldWidth = (field) => {
    // always full
    if (field.type === 'textArea' || field.type === 'checkbox') {
      return 'col-span-12';
    }

    //  radio special case
    if (field.type === 'radio') {
      const similarRadios = formState.fields.filter(f =>
        f.type === 'radio' &&
        JSON.stringify(f.options) === JSON.stringify(field.options)
      );

      if (similarRadios.length === 2) {
        return 'col-span-6';
      }

      return 'col-span-12';
    }

    // default
    return field.width === 'half' ? 'col-span-6' : 'col-span-12';
  };

  // New handler for checkbox change
  const onCheckboxChange = (fieldId, checked) => {
    setFormState(prevState => {
      const updatedFields = prevState.fields.map(field => {
        if (field.id === fieldId) {
          return { ...field, value: checked };
        }
        return field;
      });
      return { ...prevState, fields: updatedFields };
    });
  };

  return (
    <div className="flex-1 bg-[#EEF2FF] relative flex flex-col overflow-y-auto custom-scrollbar ">
      <div className="p-3 w-full max-w-[1250px] px-4 md:px-6 mx-auto flex-1 w-full flex flex-col ">
        {hasBannerComponent || hasPdfComponent || hasCarouselComponent ? (
          // Special component-enabled form layout (banner or PDF)
          <div className=" rounded-xl  mb-6 flex-1  flex flex-col">
            {/* ... banner layout code unchanged ... */}
            <div className={`${(bannerField?.position === 'top' || pdfField?.position === 'top' || carouselField?.position === 'top')
                ? 'flex flex-col'
                : 'flex flex-col md:flex-row w-full' // ensure full width for the parent container
              }`}>
              {/* Special component display area (Banner or PDF) */}
              <div
                className={`${(bannerField?.position === 'top' || pdfField?.position === 'top' || carouselField?.position === 'top')
                    ? 'h-[300px] w-full relative'
                    : "flex-1 h-[77.5vh] border-bottom sticky top-0 left-0 border-md-0 border-md-end border-secondary position-relative"
                  } relative`}
                onClick={() => {
                  if (bannerField) setActiveField(bannerField.id);
                  if (pdfField) setActiveField(pdfField.id);
                  if (carouselField) setActiveField(carouselField.id);
                }}
              >
                <button
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (bannerField) deleteField(bannerField.id);
                    if (pdfField) deleteField(pdfField.id);
                    if (carouselField) deleteField(carouselField.id);
                  }}
                >
                  <Icons.Delete />
                </button>

                {/* Banner Component Display */}
                {bannerField && (
                  <div className={`bg-gray-50 border-2 border-dashed ${formState.activeField === bannerField?.id ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-300'} rounded-md flex flex-col items-center justify-center h-full cursor-pointer relative`}>
                    {bannerField?.bannerUrl ? (
                      <div className="w-full h-full absolute inset-0">
                        <img
                          src={resolveAssetUrl(bannerField.bannerUrl)}
                          alt="Banner"
                          className="w-full h-full object-cover rounded-md"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                          <button className="px-4 py-2 bg-white rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                            Change Banner
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Icons.BannerUpload />
                        <p className="mt-2 text-sm text-gray-500">Upload event banner</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 10MB</p>
                        <label className="mt-4 px-4 py-2 border border-gray-300 rounded-md  text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                          Upload Banner

                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];

                              if (file) {
                                console.log("📤 BANNER SELECTED:", file);

                                const reader = new FileReader();

                                reader.onload = (event) => {
                                  setFormState(prev => ({
                                    ...prev,
                                    fields: prev.fields.map(f => {
                                      if (f.id === bannerField.id) {
                                        return {
                                          ...f,
                                          value: {
                                            file: file, // 🔥 MOST IMPORTANT
                                            preview: URL.createObjectURL(file),
                                            fileName: file.name
                                          },
                                          bannerUrl: event.target.result // preview
                                        };
                                      }
                                      return f;
                                    })
                                  }));
                                };

                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </>
                    )}
                  </div>
                )}

                {/* PDF Component Display */}
                {pdfField && (
                  <div className={`bg-gray-50 border-2 border-dashed ${formState.activeField === pdfField?.id ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-300'} rounded-md flex flex-col items-center justify-center h-full cursor-pointer relative`}>
                    {pdfField?.pdfUrl ? (
                      <div className="w-full h-full">
                        <iframe
                          src={resolveAssetUrl(pdfField.pdfUrl)}
                          title="PDF Preview"
                          className="w-full h-full rounded-md border-0"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                          <button className="px-4 py-2 bg-white rounded-md  text-sm font-medium text-gray-700 hover:bg-gray-50">
                            Change PDF
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Icons.PdfUpload />
                        <p className="mt-2 text-sm text-gray-500">Upload PDF document</p>
                        <p className="text-xs text-gray-400 mt-1">PDF up to 10MB</p>
                        <label className="mt-4 px-4 py-2 border border-gray-300 rounded-md cursor-pointer">
                          Upload PDF

                          <input
                            type="file"
                            className="hidden"
                            accept="application/pdf"
                            onChange={(e) => {
                              const file = e.target.files[0];

                              if (file) {
                                const reader = new FileReader();

                                reader.onload = (event) => {
                                  setFormState(prev => ({
                                    ...prev,
                                    fields: prev.fields.map(f => {
                                      if (f.id === pdfField.id) {
                                        return {
                                          ...f,
                                          value: {
                                            file: file,
                                            preview: URL.createObjectURL(file),
                                            fileName: file.name
                                          },
                                          pdfUrl: event.target.result
                                        };
                                      }
                                      return f;
                                    })
                                  }));
                                };

                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </>
                    )}
                  </div>
                )}

                {/* Carousel Component Display */}
                {carouselField && (
                  <div className={`bg-gray-50 border-2 border-dashed ${formState.activeField === carouselField?.id ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-300'} rounded-md flex flex-col items-center justify-center h-[300px] cursor-pointer relative`}>
                    {carouselField?.images && carouselField.images.length > 0 ? (
                      <div className="w-full h-full">
                        <ImageCarousel
                          images={carouselField.images}
                          autoAdvanceTime={carouselField.autoAdvanceTime || 20000}
                          showDots={carouselField.showDots}
                          maxImages={carouselField.maxImages || 8}
                          className="w-full h-full"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const input = e.currentTarget.parentElement.nextElementSibling?.querySelector('input[type="file"]');
                              if (input) input.click();
                            }}
                            className="px-4 py-2 bg-white rounded-md  text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Add More Images
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Icons.CarouselUpload />
                        <p className="mt-2 text-sm text-gray-500">Upload carousel images</p>
                        <p className="text-xs text-gray-400 mt-1">PNG images up to 5MB each (max 8 images)</p>
                        <label className="mt-4 px-4 py-2 border border-gray-300 rounded-md  text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                          Upload Images

                          <input
                            type="file"
                            className="hidden"
                            accept="image/png,image/jpg,image/jpeg"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files);

                              if (files.length > 0) {
                                console.log(`📤 PROCESSING ${files.length} CAROUSEL FILES:`, files.map(f => f.name));

                                const newImages = files.map(file => ({
                                  file: file, // 🔥 MOST IMPORTANT
                                  preview: URL.createObjectURL(file),
                                  fileName: file.name
                                }));

                                setFormState(prev => ({
                                  ...prev,
                                  fields: prev.fields.map(f => {
                                    if (f.id === carouselField.id) {
                                      return {
                                        ...f,
                                        images: [...(f.images || []), ...newImages] // append images
                                      };
                                    }
                                    return f;
                                  })
                                }));
                              }
                            }}
                          />
                        </label>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className={`${(bannerField?.position === 'top' || pdfField?.position === 'top' || carouselField?.position === 'top')
                  ? 'h-[300px] w-full relative'
                  : 'flex-1 w-full relative'
                } px-4 `}>
                <div
                  id="formCanvas"
                  ref={formCanvasRef}
                  className="grid grid-cols-12 gap-4 content-start items-start min-h-[400px]"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext
                      items={formState.fields
                        .filter(f =>
                          f.type !== 'bannerUpload' &&
                          f.type !== 'pdfUpload' &&
                          f.type !== 'carouselUpload'
                        )
                        .map(f => f.id)}
                      strategy={rectSortingStrategy}
                    >

                      {formState.fields
                        .filter(field =>
                          field.type !== 'bannerUpload' &&
                          field.type !== 'pdfUpload' &&
                          field.type !== 'carouselUpload'
                        )
                        .map((field) => (
                          <SortableItem
                            key={field.id}
                            id={field.id}
                            className={`form-field-container ${getFieldWidth(field)}`}
                          >
                            {({ attributes, listeners }) => (
                              <div
                                className={`form-component bg-white border border-gray-200 hover:border-primary-400 rounded-lg p-4  w-full flex flex-col ${formState.activeField === field.id
                                    ? 'border-primary-500 ring-2 ring-primary-200'
                                    : ''
                                  }`}
                                onClick={() => setActiveField(field.id)}
                              >

                                {/* 🔥 HEADER */}
                                <div
                                  className={`mb-2 w-full ${field.width === 'half' && isSideLayout
                                      ? 'flex flex-col gap-2'
                                      : 'flex items-center justify-between gap-2'
                                    }`}
                                >

                                  {/* LEFT: DRAG + LABEL */}
                                  <div className="flex items-center gap-2 w-full">

                                    {/* ✅ DRAG HANDLE (FIXED) */}
                                    <div
                                      {...attributes}
                                      {...listeners}
                                      className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                                    >
                                      ☰
                                    </div>

                                    {/* LABEL */}
                                    <div className="w-full">
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="text"
                                          value={field.label || ''}
                                          placeholder={`Untitled ${field.type}`}
                                          title={field.label || `Untitled ${field.type}`}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) =>
                                            setFormState(prev => ({
                                              ...prev,
                                              fields: prev.fields.map(f =>
                                                f.id === field.id
                                                  ? { ...f, label: e.target.value }
                                                  : f
                                              )
                                            }))
                                          }
                                          className={`flex-1 min-w-0 text-sm font-medium text-gray-700 outline-none border-none bg-transparent truncate ${field.width === 'half' ? 'max-w-[100px]' : 'max-w-full'
                                            }`}
                                        />
                                        {field.required && (
                                          <span className="text-red-500">*</span>
                                        )}
                                      </div>

                                      {field.helperText && (
                                        <p className="text-xs text-gray-500">
                                          {field.helperText}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* RIGHT: ACTIONS */}
                                  <div
                                    className={`flex items-center gap-2 ${field.width === 'half' && isSideLayout
                                        ? 'justify-end w-full'
                                        : ''
                                      }`}
                                  >

                                    {/* WIDTH */}
                                    <select
                                      value={field.width || 'full'}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        setFormState(prev => ({
                                          ...prev,
                                          fields: prev.fields.map(f =>
                                            f.id === field.id
                                              ? { ...f, width: value }
                                              : f
                                          )
                                        }));
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      disabled={
                                        field.type === 'textArea' ||
                                        field.type === 'checkbox'
                                      }
                                      className="text-xs border rounded px-[3px] py-1"
                                    >
                                      <option value="full">Full Width</option>
                                      <option value="half">Half Width</option>
                                    </select>

                                    {/* DELETE */}
                                    <button
                                      className="p-1 text-gray-400 hover:text-gray-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteField(field.id);
                                      }}
                                    >
                                      <Icons.Delete />
                                    </button>
                                  </div>
                                </div>

                                {/* FIELD */}
                                <FormComponents
                                  field={field}
                                  isPreview={false}
                                  onCheckboxChange={onCheckboxChange}
                                />
                              </div>
                            )}
                          </SortableItem>
                        ))}
                    </SortableContext>
                  </DndContext>
                  <div
                    id="dropPlaceholder"
                    ref={dropPlaceholderRef}
                    className="hidden border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-400 col-span-2"
                  >
                    Drop component here
                  </div>
                  {formState.fields.length > 0 && (
                    <div className="col-span-12 mt-6">
                      <div className="flex justify-end">
                        <button className="px-4  py-2 bg-blue-800 text-white rounded">
                          Submit Form
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div
            id="formCanvas"
            ref={formCanvasRef}
            className="grid grid-cols-12 gap-4 content-start items-start bg-white rounded-xl  p-8 flex-1"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={formState.fields.map(f => f.id)}
                strategy={rectSortingStrategy}
              >

                {formState.fields.map((field) => (
                  <SortableItem
                    key={field.id}
                    id={field.id}
                    className={`form-field-container ${getFieldWidth(field)}`}
                  >
                    {({ attributes, listeners }) => (
                      <div
                        className={`form-component bg-white border border-gray-200 hover:border-primary-400 rounded-lg p-4  w-full flex flex-col ${formState.activeField === field.id
                            ? 'border-primary-500 ring-2 ring-primary-200'
                            : ''
                          }`}
                        onClick={() => setActiveField(field.id)}
                      >

                        {/* 🔥 HEADER */}
                        <div className="flex items-center gap-2 mb-2 w-full">

                          {/* ✅ DRAG HANDLE */}
                          <div
                            {...attributes}
                            {...listeners}
                            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 mt-1"
                          >
                            ☰
                          </div>

                          {/* ✅ LABEL + HELPER */}
                          <div className="flex-1">
                            {/* 🔥 LABEL DISPLAY WITH REQUIRED */}


                            {/* 🔥 LABEL EDIT INPUT */}
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={field.label || ''}
                                title={field.label || `Untitled ${field.type}`}
                                placeholder={`Untitled ${field.type}`}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                  setFormState(prev => ({
                                    ...prev,
                                    fields: prev.fields.map(f =>
                                      f.id === field.id ? { ...f, label: e.target.value } : f
                                    )
                                  }))
                                }
                                className={`flex-1 min-w-0 text-sm font-medium text-gray-700 outline-none border-none bg-transparent truncate ${field.width === 'half' ? 'max-w-[100px]' : 'max-w-full'
                                  }`}
                              />

                              {field.required && (
                                <span className="text-red-500">*</span>
                              )}
                            </div>

                            {/* HELPER TEXT */}
                            {field.helperText && (
                              <p className="text-xs text-gray-500">{field.helperText}</p>
                            )}
                          </div>

                          {/* ✅ ACTIONS */}
                          <div
                            className={`flex items-center gap-2 ${field.width === 'half' && isSideLayout
                                ? 'justify-end w-full'
                                : ''
                              }`}
                          >

                            {/* WIDTH */}
                            <select
                              value={field.width || 'full'}
                              onChange={(e) => {
                                const value = e.target.value;
                                setFormState(prev => ({
                                  ...prev,
                                  fields: prev.fields.map(f =>
                                    f.id === field.id ? { ...f, width: value } : f
                                  )
                                }));
                              }}
                              onClick={(e) => e.stopPropagation()}

                              // 🔥 ADD THIS LINE
                              disabled={field.type === 'textArea' || field.type === 'checkbox'}

                              className="text-xs border rounded px-[3px] py-1"
                            >
                              <option value="full">Full Width</option>
                              <option value="half">Half Width</option>
                            </select>



                            {/* DELETE */}
                            <button
                              className="p-1 text-gray-400 hover:text-gray-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteField(field.id);
                              }}
                            >
                              <Icons.Delete />
                            </button>

                          </div>
                        </div>

                        {/* ✅ FIELD */}
                        <FormComponents field={field} isPreview={false} />
                      </div>
                    )}
                  </SortableItem>
                ))}

              </SortableContext>
            </DndContext>

            {/* Drop Zone Placeholder */}
            <div
              id="dropPlaceholder"
              ref={dropPlaceholderRef}
              className="hidden border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-400 col-span-2"
            >
              Drop component here
            </div>

            {/* Form Submit Button */}
            {formState.fields.length > 0 && (
              <div className="col-span-12 mt-6">
                <div className="flex justify-end">
                  <button className="px-4 py-2 bg-blue-800 text-white rounded">
                    Submit Form
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormCanvas;
