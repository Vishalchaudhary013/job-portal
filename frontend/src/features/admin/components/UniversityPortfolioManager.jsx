import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiPlus, FiEdit2, FiTrash2, FiGrid, FiEye } from "react-icons/fi";
import { getUniversityPortfolios, deleteUniversityPortfolio } from "../../../services/universityPortfolioAPI";
import { getErrorMessage, API_BASE_URL } from "../../../services/apiClient";
import UniversityPortfolioForm from "./UniversityPortfolioForm";

const resolveFileUrl = (path) => (path?.startsWith("http") ? path : `${API_BASE_URL}${path}`);

const UniversityPortfolioManager = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState(null);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      const res = await getUniversityPortfolios();
      setPortfolios(res?.data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load university portfolios."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const handleCreateClick = () => {
    setEditingPortfolio(null);
    setShowForm(true);
  };

  const handleEditClick = (portfolio) => {
    setEditingPortfolio(portfolio);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingPortfolio(null);
  };

  const handleSaved = () => {
    fetchPortfolios();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this university portfolio?")) return;
    try {
      await deleteUniversityPortfolio(id);
      fetchPortfolios();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete university portfolio."));
    }
  };

  if (showForm) {
    return (
      <UniversityPortfolioForm
        onClose={handleClose}
        onSaved={handleSaved}
        initialPortfolio={editingPortfolio}
      />
    );
  }

  return (
    <div className="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-5 border-b border-[#E2E8F0] bg-gradient-to-r from-blue-50/50 to-white flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <FiGrid /> University Portfolio
        </h2>
        <button
          type="button"
          onClick={handleCreateClick}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 text-white rounded-xl font-semibold text-sm hover:bg-blue-800 transition-colors shadow-sm"
        >
          <FiPlus /> Create
        </button>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-10 text-slate-500">Loading university portfolios...</div>
        ) : portfolios.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 border-dashed text-slate-500">
            No university portfolios yet. Click "Create" to add one.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {portfolios.map((portfolio) => (
              <div key={portfolio._id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                  {portfolio.bannerImage?.url ? (
                    <img src={resolveFileUrl(portfolio.bannerImage.url)} alt={portfolio.universityName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-semibold">No Banner</div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <Link
                      to={`/university/${portfolio._id}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 bg-white/90 backdrop-blur-sm text-emerald-700 rounded-lg hover:bg-emerald-50 shadow-sm"
                      title="View public page"
                    >
                      <FiEye size={16} />
                    </Link>
                    <button onClick={() => handleEditClick(portfolio)} className="p-2 bg-white/90 backdrop-blur-sm text-blue-700 rounded-lg hover:bg-blue-50 shadow-sm" title="Edit">
                      <FiEdit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(portfolio._id)} className="p-2 bg-white/90 backdrop-blur-sm text-red-600 rounded-lg hover:bg-red-50 shadow-sm" title="Delete">
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-slate-800 text-sm truncate" title={portfolio.universityName}>
                    {portfolio.universityName}
                  </h4>
                  {portfolio.recognition?.length > 0 && (
                    <p className="text-xs text-slate-500 mt-1 truncate" title={portfolio.recognition.join(", ")}>
                      {portfolio.recognition.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UniversityPortfolioManager;
