import React, { useState, useEffect } from 'react';
import { resolveAssetUrl } from '../../../services/apiClient';

const ImageCarousel = ({ 
  images = [], 
  autoAdvanceTime = 20000, 
  showDots = true, 
  className = '',
  onImageClick = null,
  maxImages = 8 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Limit images to maxImages
  const limitedImages = images.slice(0, maxImages);

  // Auto-advance functionality
  useEffect(() => {
    if (!isAutoPlaying || limitedImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % limitedImages.length);
    }, autoAdvanceTime);

    return () => clearInterval(interval);
  }, [isAutoPlaying, limitedImages.length, autoAdvanceTime]);

  // Reset index if images change
  useEffect(() => {
    if (currentIndex >= limitedImages.length && limitedImages.length > 0) {
      setCurrentIndex(0);
    }
  }, [limitedImages.length, currentIndex]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 5 seconds of manual interaction
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? limitedImages.length - 1 : currentIndex - 1;
    goToSlide(newIndex);
  };

  const goToNext = () => {
    const newIndex = (currentIndex + 1) % limitedImages.length;
    goToSlide(newIndex);
  };

  if (limitedImages.length === 0) {
    return (
      <div className={`w-full h-full bg-gray-100 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">🖼️</div>
          <p>No images uploaded</p>
          <p className="text-sm">Upload PNG images to view carousel</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden rounded-2xl ${className}`}>
      {/* Main Image Display */}
      <div className="relative w-full h-full">
        {limitedImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={resolveAssetUrl(image.src || image.preview || image.dataUrl)}
              alt={image.alt || `Carousel image ${index + 1}`}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => onImageClick && onImageClick(image, index)}
              onError={(e) => {
                console.error('Failed to load carousel image:', image);
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgRXJyb3I8L3RleHQ+PC9zdmc+';
              }}
            />
          </div>
        ))}

        {/* Navigation Arrows */}
        {limitedImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-3 rounded-full transition-all duration-300 z-50 border border-white/30 group shadow-lg"
              aria-label="Previous image"
            >
              <svg className="w-6 h-6 transform group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-3 rounded-full transition-all duration-300 z-50 border border-white/30 group shadow-lg"
              aria-label="Next image"
            >
              <svg className="w-6 h-6 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Image Counter */}
        {limitedImages.length > 1 && (
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold z-50 uppercase tracking-wider border border-white/20 shadow-lg">
            {currentIndex + 1} / {limitedImages.length}
          </div>
        )}


      </div>

      {/* Pagination Dots */}
      {showDots && limitedImages.length > 1 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-50 px-3 py-1.5 bg-black/20 backdrop-blur-md rounded-full border border-white/10">
          {limitedImages.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToSlide(index);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white w-4'
                  : 'bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {limitedImages.length > 1 && isAutoPlaying && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10 z-50">
          <div 
            className="h-full bg-blue-500 transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            style={{
              width: `${((Date.now() % autoAdvanceTime) / autoAdvanceTime) * 100}%`
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;