import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { IoHomeOutline } from 'react-icons/io5';
import FormComponents from '../FormComponents';
import { Icons } from '../ui/ui-icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useFormBuilder } from '../context/FormBuilderContext';
import ImageCarousel from '../ui/image-carousel';
import { API_BASE_URL, resolveAssetUrl } from '../../../services/apiClient';
import logo from '../../../assets/logo.png';

const PreviewModal = ({ onClose, formFields, formName, portalMode = false, onSubmit, onBuildResume, initialValues }) => {
  const { formState } = useFormBuilder();
  const [formValues, setFormValues] = useState(() => initialValues || {});
  const [dragActive, setDragActive] = useState({});
  const [submitState, setSubmitState] = useState({ status: 'idle', message: '' }); // idle | submitting | done | error
  const safeFields = formFields || [];
  // Create refs for file inputs
  const fileInputRefs = useRef({});

  // Function to trigger file input click
  const triggerFileInput = (fieldId) => {
    console.log("Triggering file input for field:", fieldId);
    if (fileInputRefs.current[fieldId]) {
      console.log("File input ref found, clicking...");
      fileInputRefs.current[fieldId].click();
    } else {
      console.error(`File input ref not found for field: ${fieldId}`);
    }
  };

  // Handle file drop
  const handleDrop = (e, fieldId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [fieldId]: false }));

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const fileData = {
            file: file,
            fileName: file.name,
            fileType: file.type,
            previewUrl: URL.createObjectURL(file),
            dataUrl: event.target.result
          };

          console.log("Dropped file successfully processed:", file.name);
          handleFormValueChange(fieldId, fileData);
        }
      };

      reader.onerror = () => {
        console.error("Error reading dropped file:", file.name);
      };

      reader.readAsDataURL(file);
    }
  };

  // Handle drag events
  const handleDrag = (e, fieldId, isDragActive) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDragActive !== undefined) {
      setDragActive(prev => ({ ...prev, [fieldId]: isDragActive }));
    }
  };

  const handleFormValueChange = (fieldId, value) => {
    console.log("Value changed for field:", fieldId, value);
    setFormValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Resume field "Build a resume now" — hand off to the Resume Builder with the
  // current answers so they survive the round trip. Undefined (so the field keeps
  // its plain "Continue without resume" behaviour) unless a handler was provided.
  const handleBuildResume = onBuildResume
    ? (fieldId) => onBuildResume(fieldId, formValues)
    : undefined;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // No real submit handler wired (admin preview / builder) — keep the old behaviour.
    if (typeof onSubmit !== 'function') {
      alert('Form submitted successfully in preview mode!');
      return;
    }

    setSubmitState({ status: 'submitting', message: '' });
    try {
      await onSubmit(formValues);
      setSubmitState({ status: 'done', message: '' });
    } catch (err) {
      setSubmitState({
        status: 'error',
        message: err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.',
      });
    }
  };

  // Check if we have banner, PDF, or carousel components
  const hasBannerComponent = safeFields.some(field => field.type === 'bannerUpload');
  const hasPdfComponent = safeFields.some(field => field.type === 'pdfUpload');
  const hasCarouselComponent = safeFields.some(field => field.type === 'carouselUpload');
  const bannerField = safeFields.find(field => field.type === 'bannerUpload');
  const pdfField = safeFields.find(field => field.type === 'pdfUpload');
  const carouselField = safeFields.find(field => field.type === 'carouselUpload');
  const regularFields = safeFields.filter(field => field.type !== 'bannerUpload' && field.type !== 'pdfUpload' && field.type !== 'carouselUpload');

  const bannerId = bannerField?.id;
  const pdfId = pdfField?.id;


  return (
    <div className="fixed inset-0 z-50 bg-gray-50  overflow-hidden flex flex-col" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 z-10 ">
        {/* On a shared public link this bar is the site's only chrome, so it carries the
            Edeco logo. In the builder's own preview it stays the form's name, which is
            what the editor needs to see. */}
        {portalMode ? (
          <Link to="/" className="shrink-0">
            <img src={logo} alt="Edeco" className="h-[52px] w-auto object-contain" />
          </Link>
        ) : (
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 truncate max-w-md">
              {formName || 'Form Preview'}
            </h2>
            {formState.description && (
              <p className="text-sm text-gray-500 truncate max-w-md">{formState.description}</p>
            )}
          </div>
        )}
        {portalMode ? (
          <Link
            to="/"
            className="flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-blue-700 transition-all "
          >
            <IoHomeOutline className="h-4 w-4 mr-2" />
            Go to Edeco Portal
          </Link>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all "
          >
            <Icons.X className="h-4 w-4 mr-2" />
            Close Preview
          </button>
        )}
      </div>

      {submitState.status === 'done' ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
          <Icons.CheckCircle className="h-14 w-14 text-emerald-500" />
          <h2 className="text-xl font-bold text-gray-900">Response submitted</h2>
          <p className="max-w-md text-sm text-gray-500">
            Thank you — your response to &ldquo;{formName}&rdquo; has been recorded.
          </p>
          {portalMode && (
            <Link to="/" className="mt-2 inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              <IoHomeOutline className="mr-2 h-4 w-4" /> Go to Edeco Portal
            </Link>
          )}
        </div>
      ) : (
      /* Main content area */
      <div className="flex-1 overflow-hidden  relative">
        <div className="h-full w-full ">

          {/* {(bannerField?.position === 'top' || pdfField?.position === 'top' || carouselField?.position === 'top') && (
            <Card className="mb-4 border-none shadow-none">
              <CardHeader>
                <CardTitle className="text-center">Form Preview: {formName} </CardTitle>
                {formState.description && (
                  <CardDescription className="text-center">Form Description: {formState.description}</CardDescription>
                )}
              </CardHeader>
            </Card>
          )} */}
          {null}
          <form onSubmit={handleSubmit} className="h-full flex flex-col">
            {hasBannerComponent || hasPdfComponent || hasCarouselComponent ? (
              <div className={`${(bannerField?.position === 'top' ||
                pdfField?.position === 'top' ||
                carouselField?.position === 'top')
                ? 'flex flex-col overflow-y-auto flex-1 p-1 bg-gray-50/20'
                : 'flex-1 flex overflow-hidden flex-col md:flex-row'
                }`}>
                {/* Special Component Display Area (Banner or PDF) */}
                <div
                  className={`${(bannerField?.position === 'top' || pdfField?.position === 'top' || carouselField?.position === 'top') ? 'h-[400px] w-full flex-shrink-0' : 'h-full md:w-1/2'
                    } relative overflow-hidden p-4.5 `}
                >

                  {/* Banner Component Display */}
                  {bannerField && (bannerField?.bannerUrl || formValues?.[bannerId]?.preview) ? (
                    <div className="w-full rounded-xl h-full">
                      <img
                        src={resolveAssetUrl(formValues?.[bannerId]?.preview || formValues?.[bannerId]?.previewUrl || bannerField.bannerUrl)}
                        alt="Form Banner"
                        className="w-full h-full rounded-xl object-cover "
                      />
                      {bannerField?.canUpload && (
                        <div className="absolute bottom-0 right-0 m-4">
                          <input
                            type="button"
                            value="Change Banner"
                            className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md  text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 bg-opacity-90"
                            onClick={(e) => {
                              e.preventDefault();
                              const fileInput = document.getElementById(`change-banner-${bannerField.id}`);
                              if (fileInput) {
                                fileInput.click();
                              } else {
                                console.error(`Could not find file input with id change-banner-${bannerField.id}`);
                              }
                            }}
                          />
                          <input
                            id={`change-banner-${bannerField.id}`}
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    const fileData = {
                                      file: file,
                                      fileName: file.name,
                                      fileType: file.type,
                                      preview: event.target.result,
                                      dataUrl: event.target.result
                                    };
                                    handleFormValueChange(bannerField.id, fileData);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ) : bannerField && !bannerField?.bannerUrl && !formValues?.[bannerId]?.preview ? (
                    <div className="bg-gray-50 border-b md:border-r border-gray-200 h-full p-6 flex flex-col items-center justify-center">
                      <Icons.BannerUpload className="h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">{bannerField?.label || 'Event Banner'}</p>
                      <p className="text-xs text-gray-400 mt-1">{bannerField?.helperText || 'This form includes a banner image'}</p>
                      <div className="mt-4">
                        <input
                          type="button"
                          value="Upload Banner"
                          className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md  text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          onClick={(e) => {
                            e.preventDefault();
                            const fileInput = document.getElementById(`upload-banner-${bannerField.id}`);
                            if (fileInput) {
                              fileInput.click();
                            } else {
                              console.error(`Could not find file input with id upload-banner-${bannerField.id}`);
                            }
                          }}
                        />
                        <input
                          id={`upload-banner-${bannerField.id}`}
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              console.log("Banner file selected:", file.name);

                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  const fileData = {
                                    file: file,
                                    fileName: file.name,
                                    fileType: file.type,
                                    preview: event.target.result,
                                    dataUrl: event.target.result
                                  };
                                  console.log("Banner file successfully processed:", file.name);
                                  handleFormValueChange(bannerField.id, fileData);
                                }
                              };

                              reader.onerror = () => {
                                console.error("Error reading banner file:", file.name);
                              };

                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {/* PDF Component Display */}
                  {pdfField && (pdfField?.pdfUrl || formValues[pdfField?.id]?.preview) ? (
                    <div className="w-full h-full">
                      <iframe
                        src={formValues[pdfField?.id]?.preview || pdfField.pdfUrl}
                        title="PDF Preview"
                        className="w-full h-full border-0 rounded-md"
                        style={{ minHeight: '100%' }}
                      />
                      {pdfField?.canUpload && (
                        <div className="absolute bottom-0 right-0 m-4">
                          <input
                            type="button"
                            value="Change PDF"
                            className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md  text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 bg-opacity-90"
                            onClick={(e) => {
                              e.preventDefault();
                              const fileInput = document.getElementById(`change-pdf-${pdfField.id}`);
                              if (fileInput) {
                                fileInput.click();
                              } else {
                                console.error(`Could not find file input with id change-pdf-${pdfField.id}`);
                              }
                            }}
                          />
                          <input
                            id={`change-pdf-${pdfField.id}`}
                            type="file"
                            className="hidden"
                            accept="application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    const fileData = {
                                      file: file,
                                      fileName: file.name,
                                      fileType: file.type,
                                      preview: event.target.result,
                                      dataUrl: event.target.result
                                    };
                                    handleFormValueChange(pdfField.id, fileData);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ) : pdfField && !pdfField?.pdfUrl && !formValues[pdfField?.id]?.preview ? (
                    <div className="bg-gray-50 border-b md:border-r border-gray-200 h-full p-6 flex flex-col items-center justify-center">
                      <Icons.PdfUpload className="h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">{pdfField?.label || 'PDF Document'}</p>
                      <p className="text-xs text-gray-400 mt-1">{pdfField?.helperText || 'This form includes a PDF document'}</p>
                      <div className="mt-4">
                        <input
                          type="button"
                          value="Upload PDF"
                          className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md  text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          onClick={(e) => {
                            e.preventDefault();
                            const fileInput = document.getElementById(`upload-pdf-${pdfField.id}`);
                            if (fileInput) {
                              fileInput.click();
                            } else {
                              console.error(`Could not find file input with id upload-pdf-${pdfField.id}`);
                            }
                          }}
                        />
                        <input
                          id={`upload-pdf-${pdfField.id}`}
                          type="file"
                          className="hidden"
                          accept="application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  const fileData = {
                                    file: file,
                                    fileName: file.name,
                                    fileType: file.type,
                                    preview: event.target.result,
                                    dataUrl: event.target.result
                                  };
                                  handleFormValueChange(pdfField.id, fileData);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {/* Carousel Component Display */}
                  {carouselField && carouselField.images && carouselField.images.length > 0 ? (
                    <div className="w-full h-full">
                      <ImageCarousel
                        images={carouselField.images}
                        autoAdvanceTime={carouselField.autoAdvanceTime || 20000}
                        showDots={carouselField.showDots !== false}
                        maxImages={carouselField.maxImages || 8}
                        className="w-full h-full"
                      />
                    </div>
                  ) : carouselField && (!carouselField.images || carouselField.images.length === 0) ? (
                    <div className="bg-gray-50 border-b md:border-r border-gray-200 h-full p-6 flex flex-col items-center justify-center">
                      <Icons.CarouselUpload className="h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">{carouselField?.label || 'Image Carousel'}</p>
                      <p className="text-xs text-gray-400 mt-1">{carouselField?.helperText || 'This form includes an image carousel'}</p>
                      <div className="mt-4">
                        <input
                          type="button"
                          value="Upload Images"
                          className="cursor-pointer  px-4 py-2 border border-gray-300 rounded-md  text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          onClick={(e) => {
                            e.preventDefault();
                            const fileInput = document.getElementById(`upload-carousel-${carouselField.id}`);
                            if (fileInput) {
                              fileInput.click();
                            }
                          }}
                        />
                        <input
                          id={`upload-carousel-${carouselField.id}`}
                          type="file"
                          className="hidden"
                          accept="image/png"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files);
                            if (files.length > 0) {
                              files.forEach(file => {
                                if (file.type === 'image/png' && file.size <= 5 * 1024 * 1024) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    const newImage = {
                                      src: event.target.result,
                                      preview: event.target.result,
                                      dataUrl: event.target.result,
                                      fileName: file.name,
                                      fileType: file.type,
                                      alt: `Carousel image`
                                    };
                                    handleFormValueChange(carouselField.id, newImage);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              });
                            }
                          }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className={`${(bannerField?.position === 'top' ||
                  pdfField?.position === 'top' ||
                  carouselField?.position === 'top')
                  ? 'flex flex-col'
                  : 'h-full overflow-hidden flex flex-col md:w-1/2'
                  }`}>

                  {/* 🔹 SCROLLABLE AREA */}
                  <div className={`${(bannerField?.position === 'top' || pdfField?.position === 'top' || carouselField?.position === 'top') ? 'p-5 bg-gray-50/30' : 'flex-1 overflow-y-auto p-5 bg-gray-50/30'}`}>
                    <div className="max-w-4xl rounded-xl mx-auto grid grid-cols-12 gap-8 px-10 bg-gray-100 w-full">

                      <div className="col-span-12">
                        <Card className="mb-4 border-none ">
                          <CardHeader>
                            <CardTitle className="text-center">
                              {formName}
                            </CardTitle>
                            {formState.description && (
                              <CardDescription className="text-center">
                                {formState.description}
                              </CardDescription>
                            )}
                          </CardHeader>
                        </Card>
                      </div>

                      {regularFields.map((field, index) => {
                        const fieldId = field.id || index;

                        return (
                          <div
                            key={fieldId}
                            className={`${field.width === 'half'
                              ? 'col-span-12 md:col-span-6'
                              : 'col-span-12'
                              }`}
                          >
                            {!field.hideLabel && field.type !== 'checkbox' && (
                              <>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {field.label || `Untitled ${field.type}`}
                                </label>

                                {field.helperText && (
                                  <p className="text-xs text-gray-500 mb-1">
                                    {field.helperText}
                                  </p>
                                )}
                              </>
                            )}

                            <FormComponents
                              field={{
                                ...field,
                                options: field.options?.map(opt =>
                                  typeof opt === "string"
                                    ? { label: opt, value: opt }
                                    : opt
                                ),
                                value:
                                  formValues[fieldId] !== undefined
                                    ? formValues[fieldId]
                                    : field.defaultValue
                              }}
                              isPreview={true}
                              onChange={handleFormValueChange}
                              onBuildResume={handleBuildResume}
                            />
                          </div>

                        );
                      })}

                      {/* Form submit button inside scrollable area */}
                      <div className="col-span-12 mt-8 flex flex-col items-end gap-2 pb-10">
                        {submitState.status === 'error' && (
                          <p className="w-full text-right text-sm font-medium text-red-600">{submitState.message}</p>
                        )}
                        <button
                          type="submit"
                          disabled={submitState.status === 'submitting'}
                          className="w-full md:w-auto px-10 py-3 text-white rounded-md bg-blue-800 hover:bg-blue-900 transition font-bold disabled:opacity-60"
                        >
                          {submitState.status === 'submitting' ? 'Submitting…' : 'Submit Form'}
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            )

              : (
                <div className="flex-1 overflow-y-auto p-8">
                  <div className="max-w-4xl mx-auto bg-white  rounded-lg border border-gray-200 p-8">
                    <div className="  pb-6">
                      <h1 className="text-2xl font-bold text-gray-900 text-center">{formName}</h1>
                      {formState.description && (
                        <p className="mt-2 text-gray-500 text-center">{formState.description}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {safeFields.length === 0 && (
                        <div className="text-center text-gray-400 py-10 col-span-2">
                          No fields added yet 😅
                        </div>
                      )}
                      {safeFields.map((field, index) => {
                        const fieldId = field.id || index;

                        return (
                          <div key={fieldId} className={field.width === 'half' ? 'col-span-1' : 'col-span-2'}>
                            {!field.hideLabel && field.type !== 'checkbox' && (
                              <>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label || `Untitled ${field.type}`}</label>
                                {field.helperText && <p className="text-xs text-gray-500 mb-1">{field.helperText}</p>}
                              </>
                            )}
                            {field.type === 'fileUpload' || field.type === 'mediaUpload' ? (
                              <div
                                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${dragActive[fieldId] ? 'border-primary-400 bg-primary-50' : 'border-gray-300'} border-dashed rounded-md`}
                                onDragEnter={(e) => handleDrag(e, fieldId, true)}
                                onDragLeave={(e) => handleDrag(e, fieldId, false)}
                                onDragOver={(e) => handleDrag(e, fieldId)}
                                onDrop={(e) => handleDrop(e, fieldId)}
                              >
                                <div className="space-y-1 text-center w-full">
                                  {formValues[fieldId]?.fileName ? (
                                    <div className="flex flex-col items-center">
                                      {field.type === 'mediaUpload' && formValues[fieldId]?.fileType ? (
                                        <>
                                          {formValues[fieldId]?.fileType.startsWith('video/') ? (
                                            <video
                                              controls
                                              className="max-w-full h-auto max-h-[200px] mb-2 border rounded"
                                              src={formValues[fieldId]?.previewUrl || formValues[fieldId]?.dataUrl}
                                            >
                                              Your browser does not support the video tag.
                                            </video>
                                          ) : formValues[fieldId]?.fileType.startsWith('audio/') ? (
                                            <audio
                                              controls
                                              className="max-w-full mb-2"
                                              src={formValues[fieldId]?.previewUrl || formValues[fieldId]?.dataUrl}
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
                                                {formValues[fieldId]?.fileName || 'Uploaded media'}
                                              </span>
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <div className="my-3 p-2 border rounded bg-gray-50 flex items-center max-w-full">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                          </svg>
                                          <span className="text-sm text-gray-700 truncate max-w-[200px]">
                                            {formValues[fieldId]?.fileName || 'Uploaded file'}
                                          </span>
                                        </div>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => handleFormValueChange(fieldId, null)}
                                        className="text-xs text-red-600 hover:text-red-800 underline"
                                      >
                                        Remove {field.type === 'mediaUpload' ? 'media' : 'file'}
                                      </button>
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
                                          onClick={() => triggerFileInput(fieldId)}
                                        >
                                          {field.type === 'mediaUpload' ? 'Select media file' : 'Select a file'}
                                        </button>
                                        <input
                                          ref={el => fileInputRefs.current[fieldId] = el}
                                          type="file"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              console.log("File selected in preview modal:", file.name);

                                              const reader = new FileReader();
                                              reader.onload = (event) => {
                                                if (event.target?.result) {
                                                  const fileData = {
                                                    file: file,
                                                    fileName: file.name,
                                                    fileType: file.type,
                                                    previewUrl: URL.createObjectURL(file),
                                                    dataUrl: event.target.result
                                                  };

                                                  console.log("File successfully processed in modal:", file.name);
                                                  handleFormValueChange(fieldId, fileData);
                                                }
                                              };

                                              reader.onerror = () => {
                                                console.error("Error reading file in modal:", file.name);
                                              };

                                              reader.readAsDataURL(file);
                                            }
                                          }}
                                          accept={field.allowedTypes || (field.type === 'mediaUpload' ? "audio/*,video/*" : "image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
                                        />
                                        <p className="text-sm text-center text-gray-500">or drag and drop your file here</p>
                                      </div>
                                      <p className="text-xs text-gray-500">
                                        {field.fileTypeText || field.mediaTypeText || (field.type === 'mediaUpload' ? 'MP3, WAV, MP4, MOV up to 10MB' : 'PNG, JPG, PDF, DOC up to 10MB')}
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <FormComponents
                                field={{
                                  ...field,
                                  options: field.options?.map(opt =>
                                    typeof opt === "string"
                                      ? { label: opt, value: opt }
                                      : opt
                                  ),
                                  value: formValues[fieldId] !== undefined
                                    ? formValues[fieldId]
                                    : field.defaultValue
                                }}
                                isPreview={true}
                                onChange={handleFormValueChange}
                                onBuildResume={handleBuildResume}
                              />
                            )}
                          </div>
                        );
                      })}

                    </div>
                    {/* Form submit button for no-banner case */}
                    <div className="mt-5 flex flex-col items-end gap-2">
                      {submitState.status === 'error' && (
                        <p className="text-sm font-medium text-red-600">{submitState.message}</p>
                      )}
                      <button
                        type="submit"
                        disabled={submitState.status === 'submitting'}
                        className="px-8 py-3 text-white rounded-md bg-blue-800 hover:bg-blue-900 transition  font-medium disabled:opacity-60"
                      >
                        {submitState.status === 'submitting' ? 'Submitting…' : 'Submit Form'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

          </form>
        </div>
      </div>
      )}
    </div>


  );
};

export default PreviewModal;