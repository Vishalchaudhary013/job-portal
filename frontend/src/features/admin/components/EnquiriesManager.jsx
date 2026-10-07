import React, { useCallback, useEffect, useState } from "react";
import { FiMessageSquare } from "react-icons/fi";
import { useAdminContext } from "../context/AdminContext";
import { getEnquiries } from "../../../services/enquiryAPI";
import { getErrorMessage } from "../../../services/apiClient";
import EnquiryDetailModal from "./EnquiryDetailModal";

const STATUS_OPTIONS = ["new", "counselled", "applied", "admitted", "enrolled", "closed"];

const STATUS_STYLES = {
  new: "bg-blue-100 text-blue-700 border-blue-200",
  counselled: "bg-amber-100 text-amber-700 border-amber-200",
  applied: "bg-indigo-100 text-indigo-700 border-indigo-200",
  admitted: "bg-emerald-100 text-emerald-700 border-emerald-200",
  enrolled: "bg-emerald-100 text-emerald-700 border-emerald-200",
  closed: "bg-slate-100 text-slate-600 border-slate-200",
};

const ITEMS_PER_PAGE = 20;

/** Self-contained admin panel (own fetch/state, not threaded through AdminContext) — the
 * degree-program enquiry funnel is independent of the internship/job Applications flow
 * that AdminContext already manages. Self-guards on activeSection, matching the
 * conditional-mount convention already used for LocationManager/GalleryManager. */
const EnquiriesManager = () => {
  const { activeSection } = useAdminContext();

  const [enquiries, setEnquiries] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEnquiryId, setSelectedEnquiryId] = useState(null);

  const loadEnquiries = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getEnquiries({ status: statusFilter || undefined, page, limit: ITEMS_PER_PAGE });
      setEnquiries(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't load enquiries."));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    if (activeSection === "Enquiries") loadEnquiries();
  }, [activeSection, loadEnquiries]);

  if (activeSection !== "Enquiries") return null;

  return (
    <div className="bg-white border border-[#E2E8F0] p-4 sm:p-5">
      <div className="flex flex-col items-start gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
            <FiMessageSquare /> Degree Enquiries
          </h2>
          <p className="text-sm text-slate-500">Manage the enquiry-to-admission funnel and send lifecycle messages.</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="border border-[#EEF2FF] rounded-lg px-3 py-2 text-sm bg-slate-50"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm font-medium text-red-600 mb-3">{error}</p>}

      {loading ? (
        <p className="text-slate-500">Loading enquiries…</p>
      ) : enquiries.length === 0 ? (
        <p className="text-slate-500">No enquiries yet.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-245 w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[#EEF2FF] text-slate-500">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Phone</th>
                  <th className="py-2 pr-3">Program</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Received</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.map((enquiry) => (
                  <tr key={enquiry._id} className="border-b border-[#EEF2FF] align-top">
                    <td className="py-2 pr-3 font-medium text-slate-800">{enquiry.name}</td>
                    <td className="py-2 pr-3 text-slate-600 break-all">{enquiry.email}</td>
                    <td className="py-2 pr-3 text-slate-600">{enquiry.phone}</td>
                    <td className="py-2 pr-3 text-slate-700">{enquiry.programId?.programName || "—"}</td>
                    <td className="py-2 pr-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border ${STATUS_STYLES[enquiry.status] || STATUS_STYLES.new}`}>
                        {enquiry.status}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-slate-500">{new Date(enquiry.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="py-2 pr-3">
                      <button
                        type="button"
                        onClick={() => setSelectedEnquiryId(enquiry._id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-[#EEF2FF] pt-4">
              <p className="text-sm text-slate-500">
                Page <span className="font-medium">{pagination.page}</span> of <span className="font-medium">{pagination.totalPages}</span> ({pagination.total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                  disabled={page === pagination.totalPages}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {selectedEnquiryId && (
        <EnquiryDetailModal
          enquiryId={selectedEnquiryId}
          onClose={() => setSelectedEnquiryId(null)}
          onChanged={loadEnquiries}
        />
      )}
    </div>
  );
};

export default EnquiriesManager;
