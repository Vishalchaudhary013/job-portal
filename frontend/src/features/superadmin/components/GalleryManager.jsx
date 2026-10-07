import React, { useState, useEffect } from "react";
import { FiImage, FiUpload, FiTrash2, FiLink, FiEdit2, FiPlus, FiX } from "react-icons/fi";
import { createGallery, getGallery, deleteGallery, updateGallery } from "../../../services/galleryAPI";
import { API_BASE_URL } from "../../../services/apiClient";

const GalleryManager = () => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [imageLinks, setImageLinks] = useState([""]);
  const [imageFiles, setImageFiles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [existingImages, setExistingImages] = useState([]);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const res = await getGallery();
      if (res.success) {
        setGalleryItems(res.data || []);
      } else {
        setError(res.message || "Failed to fetch gallery items.");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  const handleAddLink = () => setImageLinks([...imageLinks, ""]);
  const handleRemoveLink = (index) => {
    const newLinks = [...imageLinks];
    newLinks.splice(index, 1);
    setImageLinks(newLinks);
  };
  const handleLinkChange = (index, value) => {
    const newLinks = [...imageLinks];
    newLinks[index] = value;
    setImageLinks(newLinks);
  };

  const handleRemoveNewFile = (index) => {
    const newFiles = [...imageFiles];
    newFiles.splice(index, 1);
    setImageFiles(newFiles);
    if (newFiles.length === 0) {
      const fileInput = document.getElementById("gallery-image-upload");
      if (fileInput) fileInput.value = "";
    }
  };

  const handleRemoveExistingImage = (index) => {
    const newExisting = [...existingImages];
    newExisting.splice(index, 1);
    setExistingImages(newExisting);
  };

  const handleEditClick = (item) => {
    setEditingId(item._id);
    setTitle(item.title || "");
    setLocation(item.location || "");
    
    const uploads = (item.images || []).filter(img => img.imageType !== "link");
    const links = (item.images || []).filter(img => img.imageType === "link").map(img => img.url);
    
    setExistingImages(uploads);
    setImageLinks(links.length > 0 ? links : [""]);
    setImageFiles([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setLocation("");
    setImageLinks([""]);
    setImageFiles([]);
    setExistingImages([]);
    const fileInput = document.getElementById("gallery-image-upload");
    if (fileInput) fileInput.value = "";
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) {
      setError("Title is required.");
      return;
    }
    
    const hasValidLinks = imageLinks.some(link => link.trim() !== "");
    
    // For new items, require at least one image. For updates, it's optional (keep existing)
    if (!editingId && imageFiles.length === 0 && !hasValidLinks) {
      setError("Please provide at least one image file or image link.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const formData = new FormData();
      formData.append("title", title);
      if (location) formData.append("location", location);
      
      imageLinks.forEach(link => {
        if (link.trim()) formData.append("imageLinks", link.trim());
      });
      
      imageFiles.forEach(file => {
        formData.append("images", file);
      });

      if (editingId) {
        formData.append("updateExistingImages", "true");
        existingImages.forEach(img => {
          if (img.url) formData.append("keptExistingImages", img.url);
        });
      }

      let res;
      if (editingId) {
        res = await updateGallery(editingId, formData);
      } else {
        res = await createGallery(formData);
      }
      
      if (res.success) {
        cancelEdit();
        fetchGallery(); // Refresh the list
      } else {
        setError(res.message || (editingId ? "Failed to update gallery item." : "Failed to create gallery item."));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this gallery item?")) return;
    try {
      setLoading(true);
      const res = await deleteGallery(id);
      if (res.success) {
        fetchGallery();
      } else {
        setError(res.message || "Failed to delete item.");
        setLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "An error occurred.");
      setLoading(false);
    }
  };

  const resolveImageUrl = (img) => {
    if (img.imageType === "link") return img.url;
    return `${API_BASE_URL}${img.url}`;
  };

  return (
    <div className="bg-white border border-[#E2E8F0]  shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-5 border-b border-[#E2E8F0] bg-gradient-to-r from-blue-50/50 to-white flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            
            Gallery 
          </h2>
          
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
          <div className="col-span-1 md:col-span-2 flex items-center justify-between border-b border-slate-200 pb-2 mb-4">
            <h3 className="text-md font-semibold text-slate-700">
              {editingId ? "Edit Gallery Item" : "Add New Gallery Item"}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium"
              >
                Cancel 
              </button>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              placeholder="Add Title..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              placeholder="Add Location..."
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2.5">
              {editingId ? "Upload More Images" : "Upload Image Files"}
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center justify-center gap-2 px-5 py-10 bg-white border-2 w-full border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <FiUpload className="text-slate-500" />
                <span className="text-sm font-medium text-slate-600">Choose Files</span>
                <input
                  id="gallery-image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {imageFiles.length > 0 && (
                <span className="text-xs text-slate-500 truncate max-w-[300px]">
                  {imageFiles.length} file(s) selected
                </span>
              )}
            </div>

            {((editingId && existingImages.length > 0) || imageFiles.length > 0) && (
              <div className="mt-4 p-3 bg-slate-50  ">
                <p className="text-xs font-semibold text-slate-500 mb-2">Image Previews</p>
                <div className="flex flex-wrap gap-2">
                  {editingId && existingImages.map((img, idx) => (
                    <div key={`existing-${idx}`} className="relative group">
                      <img 
                        src={resolveImageUrl(img)} 
                        alt="existing" 
                        className="w-16 h-16 object-cover rounded-lg border border-slate-200 shadow-sm" 
                        onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Error" }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all rounded-lg flex flex-col items-center justify-center gap-1">
                        <span className="text-[10px] text-white font-semibold">Uploaded</span>
                        <button type="button" onClick={() => handleRemoveExistingImage(idx)} className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-sm" title="Remove">
                          <FiX size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {imageFiles.length > 0 && imageFiles.map((file, idx) => (
                    <div key={`new-${idx}`} className="relative group">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt="new" 
                        className="w-16 h-16 object-cover rounded-lg border border-blue-300 shadow-sm" 
                      />
                      <div className="absolute inset-0 bg-blue-600/50 opacity-0 group-hover:opacity-100 transition-all rounded-lg flex flex-col items-center justify-center gap-1">
                        <span className="text-[10px] text-white font-semibold">New</span>
                        <button type="button" onClick={() => handleRemoveNewFile(idx)} className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-sm" title="Remove">
                          <FiX size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="col-span-1 md:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-700">
                {editingId ? "Add More Image Links" : "Or Upload Image Links"}
              </label>
              <button 
                type="button" 
                onClick={handleAddLink}
                className="text-xs font-semibold text-blue-700 flex items-center gap-1 hover:text-blue-700 transition"
              >
                <FiPlus /> Add Link
              </button>
            </div>
            
            {imageLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLink className="text-slate-400" />
                  </div>
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => handleLinkChange(index, e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                {imageLinks.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => handleRemoveLink(index)}
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition"
                    title="Remove Link"
                  >
                    <FiX />
                  </button>
                )}
              </div>
            ))}
          </div>


          <div className="col-span-1 md:col-span-2 flex justify-end mt-2 gap-3">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-sm transition-colors shadow-sm"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-700  text-white rounded-xl font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (editingId ? "Updating..." : "Uploading...") : (editingId ? "Update " : "Add Gallery")}
            </button>
          </div>
        </form>

        <div>
          <h3 className="text-md font-semibold text-slate-700 mb-4 flex items-center gap-2">
            Existing Gallery Items
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
              {galleryItems.length}
            </span>
          </h3>
          
          {loading ? (
            <div className="text-center py-10 text-slate-500">Loading gallery items...</div>
          ) : galleryItems.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 border-dashed text-slate-500">
              No images in the gallery yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {galleryItems.map((item) => {
                const firstImage = item.images && item.images.length > 0 ? item.images[0] : null;
                const imageUrl = firstImage ? resolveImageUrl(firstImage) : "https://via.placeholder.com/300?text=No+Image";

                return (
                  <div key={item._id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                    <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                      <img 
                        src={imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => { e.target.src = "https://via.placeholder.com/300?text=Error" }}
                      />
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleEditClick(item)}
                          className="p-2 bg-white/90 backdrop-blur-sm text-blue-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 shadow-sm"
                          title="Edit Image"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item._id)}
                          className="p-2 bg-white/90 backdrop-blur-sm text-red-600 rounded-lg hover:bg-red-50 hover:text-red-700 shadow-sm"
                          title="Delete Image"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-slate-800 text-sm truncate" title={item.title}>
                        {item.title}
                      </h4>
                      {item.location && (
                        <p className="text-xs text-slate-500 mt-1 truncate" title={item.location}>
                          {item.location}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GalleryManager;
