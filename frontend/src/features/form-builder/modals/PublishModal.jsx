import React, { useState, useEffect } from 'react';
import { Icons } from '../ui/ui-icons';
import { useToast } from '../hooks/use-toast';

const PublishModal = ({ onClose, formId, publishedUrl, formState }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [shareVia, setShareVia] = useState('link'); // 'link', 'email', 'qr'
  
  useEffect(() => {
  const baseUrl = window.location.origin;

const url = formId 
  ? `${baseUrl}/public-form/${formId}` 
  : `${baseUrl}/${formState?.publishedUrl}`;

  setShareUrl(url);

  setQrCodeUrl(
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
  );
}, [formId, formState?.publishedUrl]);
  
  const handleCopyLink = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          setCopied(true);
          toast({
            title: 'Success',
            description: 'Link copied to clipboard!',
          });
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
          console.error('Clipboard error:', err);
          fallbackCopyTextToClipboard(shareUrl);
        });
    } else {
      fallbackCopyTextToClipboard(shareUrl);
    }
  };
  
  const fallbackCopyTextToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; // avoid scrolling to bottom
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      setCopied(true);
      toast({
        title: 'Success',
        description: 'Link copied to clipboard!',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
      toast({
        title: 'Error',
        description: 'Failed to copy link. Please try manually.',
        variant: 'destructive',
      });
    }
  
    document.body.removeChild(textArea);
  };
  

  const handleViewForm = () => {
    window.open(shareUrl, '_blank');
  };
  
  const handleShareEmail = () => {
    const subject = encodeURIComponent('Please fill out this form');
    const body = encodeURIComponent(`Hello,\n\nPlease fill out this form: ${shareUrl}\n\nThank you!`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-primary-600 px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" id="modal-title">
                Form Published Successfully
              </h3>
              <button 
                onClick={onClose}
                className=" hover:text-red-500"
              >
                <Icons.X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            {/* Success message */}
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                <Icons.Success className="h-8 w-8 text-green-600" />
              </div>
              <p className="mt-3 text-lg font-medium text-gray-900">
                Your form is now live!
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Share it with your audience using the options below.
              </p>
            </div>
            
            {/* Tabs for different sharing methods */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex" aria-label="Tabs">
                <button
                  onClick={() => setShareVia('link')}
                  className={`w-1/3 py-2 px-1 text-center border-b-2 font-medium text-sm ${
                    shareVia === 'link'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icons.Link className="inline h-4 w-4 mr-1" />
                  Share Link
                </button>
                <button
                  onClick={() => setShareVia('email')}
                  className={`w-1/3 py-2 px-1 text-center border-b-2 font-medium text-sm ${
                    shareVia === 'email'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icons.Mail className="inline h-4 w-4 mr-1" />
                  Email
                </button>
                <button
                  onClick={() => setShareVia('qr')}
                  className={`w-1/3 py-2 px-1 text-center border-b-2 font-medium text-sm ${
                    shareVia === 'qr'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icons.QrCode className="inline h-4 w-4 mr-1" />
                  QR Code
                </button>
              </nav>
            </div>
            
            {/* Tab content */}
            <div className="mt-4">
              {shareVia === 'link' && (
                <div>
                  <label htmlFor="form-url" className="block text-sm font-medium text-gray-700">
                    Share this URL
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input 
                      type="text" 
                      name="form-url" 
                      id="form-url" 
                      className="focus:ring-primary-500 focus:border-primary-500 flex-grow block w-full rounded-none rounded-l-md sm:text-sm border-gray-300 p-2" 
                      value={shareUrl}
                      readOnly
                    />
                    <button 
                      type="button" 
                      className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 sm:text-sm hover:bg-gray-100" 
                      onClick={handleCopyLink}
                    >
                      {copied ? (
                        <>
                          <Icons.Check className="h-4 w-4" />
                          <span className="ml-1">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Icons.Copy className="h-4 w-4" />
                          <span className="ml-1">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
              
              {shareVia === 'email' && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-4">
                    Send the form link directly via email
                  </p>
                  <button
                    onClick={handleShareEmail}
                    className="inline-flex items-center px-4 py-2 border border-gray-500 rounded-md shadow-sm text-sm font-medium bg-primary-600 hover:bg-primary-700"
                  >
                    <Icons.Mail className="h-5 w-5 mr-2" />
                    Compose Email
                  </button>
                </div>
              )}
              
              {shareVia === 'qr' && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-4">
                    Scan this QR code to access the form
                  </p>
                  <div className="flex justify-center">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code for Form" 
                      className="h-48 w-48 border p-1"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    Right-click and save image to download
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button 
              type="button" 
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium  hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleViewForm}
            >
              <Icons.ExternalLink className="h-4 w-4 mr-1" />
              View Form
            </button>
            <button 
              type="button" 
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" 
              onClick={onClose}
            >
              Continue Editing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublishModal;
