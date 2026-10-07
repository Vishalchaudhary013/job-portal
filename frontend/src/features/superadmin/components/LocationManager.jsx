import React, { useState, useEffect } from "react";
import { getErrorMessage } from "../../../services/apiClient";
import { createBranch, deleteBranch, getBranches, updateBranch } from "../../../services/branchAPI";
import { FiEdit2, FiTrash2, FiPlus, FiX, FiMapPin } from "react-icons/fi";
import { getStates, getDistricts } from 'india-location-kit';
import { City } from 'country-state-city';

const initialForm = {
  name: "",
  region: "North",
  state: "",
  district: "",
  city: "",
  address: "",
  phones: "", // comma separated
  email: "",
  whatsapp: "",
  maplink: "",
  coordinates: { latitude: "", longitude: "" }
};

const LocationManager = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await getBranches();
      setLocations(res.data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to fetch locations"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "latitude" || name === "longitude") {
      setForm((prev) => ({
        ...prev,
        coordinates: { ...prev.coordinates, [name]: value }
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEdit = (loc) => {
    setForm({
      ...loc,
      phones: loc.phones ? loc.phones.join(", ") : "",
      coordinates: {
        latitude: loc.coordinates?.latitude || "",
        longitude: loc.coordinates?.longitude || ""
      }
    });
    setEditingId(loc._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this location?")) return;
    try {
      await deleteBranch(id);
      setLocations((prev) => prev.filter((loc) => loc._id !== id));
    } catch (err) {
      alert(getErrorMessage(err, "Failed to delete location"));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    
    try {
      const payload = {
        ...form,
        phones: form.phones.split(",").map((p) => p.trim()).filter(Boolean),
        coordinates: {
          latitude: form.coordinates.latitude ? Number(form.coordinates.latitude) : undefined,
          longitude: form.coordinates.longitude ? Number(form.coordinates.longitude) : undefined
        }
      };

      if (editingId) {
        const res = await updateBranch(editingId, payload);
        setLocations((prev) => prev.map((loc) => (loc._id === editingId ? res.data : loc)));
      } else {
        const res = await createBranch(payload);
        setLocations((prev) => [res.data, ...prev]);
      }
      
      setShowForm(false);
      setForm(initialForm);
      setEditingId(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save location"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-500">Loading locations...</div>;
  }

  return (
    <div className="bg-white   border border-[#E2E8F0] p-6 ">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Manage Locations</h2>
          
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setForm(initialForm);
              setEditingId(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold  transition-colors"
          >
            <FiPlus size={18} /> Add Location
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {showForm ? (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6 relative">
          <button
            onClick={() => setShowForm(false)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
          >
            <FiX size={20} />
          </button>
          
          <h3 className="text-lg font-bold text-slate-800 mb-6">
            {editingId ? "Edit Location" : "Create New Location"}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                <span>Branch Name <span className="text-rose-600">*</span></span>
                <input required name="name" value={form.name} onChange={handleChange} placeholder="e.g. New Delhi Connaught Place" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </label>

              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                <span>Region <span className="text-rose-600">*</span></span>
                <select required name="region" value={form.region} onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none">
                  {["North", "South", "East", "West", "Central"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                <span>State <span className="text-rose-600">*</span></span>
                <select required name="state" value={form.state} onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none">
                  <option value="">Select State...</option>
                  {getStates().map((s) => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                  {/* Fallback for Delhi NCR etc if not in lib */}
                  <option value="Delhi NCR">Delhi NCR</option>
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                <span>District <span className="text-rose-600">*</span></span>
                <input required name="district" value={form.district} onChange={handleChange} placeholder="e.g. New Delhi" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </label>

              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                <span>City <span className="text-rose-600">*</span></span>
                <input required name="city" value={form.city} onChange={handleChange} placeholder="e.g. New Delhi" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </label>

              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                <span>Email <span className="text-rose-600">*</span></span>
                <input required type="email" name="email" value={form.email} onChange={handleChange} placeholder="e.g. info.delhi@edeco.in" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </label>

              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                <span>Phones (Comma separated) <span className="text-rose-600">*</span></span>
                <input required name="phones" value={form.phones} onChange={handleChange} placeholder="e.g. 011 4015 1515, +91 95998 08801" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </label>

              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                <span>WhatsApp Number <span className="text-rose-600">*</span></span>
                <input required name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="e.g. 919599808801" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </label>
            </div>

            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              <span>Full Address <span className="text-rose-600">*</span></span>
              <textarea required name="address" value={form.address} onChange={handleChange} placeholder="e.g. 100 Tech Park Avenue, Sector 44, Gurugram, Haryana - 122003" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none resize-y min-h-[80px]" />
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              <span>Google Maps Link</span>
              <input type="url" name="maplink" value={form.maplink} onChange={handleChange} placeholder="https://maps.google.com/..." className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none" />
            </label>

            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                <span>Latitude (Optional)</span>
                <input type="number" step="any" name="latitude" value={form.coordinates.latitude} onChange={handleChange} placeholder="e.g. 28.6315" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                <span>Longitude (Optional)</span>
                <input type="number" step="any" name="longitude" value={form.coordinates.longitude} onChange={handleChange} placeholder="e.g. 77.2167" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </label>
            </div> */}

            <div className="flex items-center gap-4 pt-4 ">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl font-semibold bg-red-600 text-white  transition-colors shadow-sm disabled:opacity-50"
              >
                {submitting ? "Saving..." : (editingId ? "Update Location" : "Create ")}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#E2E8F0] ">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-[#EEF2FF] text-slate-700 font-semibold border-b border-[#E2E8F0]">
              <tr>
                <th className="p-4">Name & Region</th>
                <th className="p-4">City & State</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone no.</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {locations.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">
                    No locations found. Click "Add Location" to create one.
                  </td>
                </tr>
              ) : (
                locations.map((loc) => (
                  <tr key={loc._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{loc.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5 inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                        <FiMapPin size={10} /> {loc.region}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{loc.city}</div>
                      <div className="text-xs text-slate-500">{loc.state}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800 font-medium truncate max-w-[200px]">{loc.email}</div>
                      
                    </td>
                    <td className="p-4">
                      
                      <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{loc.phones?.join(", ")}</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(loc)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip-trigger"
                          title="Edit"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(loc._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip-trigger"
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LocationManager;
