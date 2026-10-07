import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiCopy, FiCheckCircle, FiEdit2, FiTrash2, FiLink, FiBarChart2 } from "react-icons/fi";
import { getErrorMessage } from "../../../services/apiClient";
import { createTest, listTests, setTestStatus, deleteTest } from "../../../services/questionAPI";

const MAX_TEST_SECTIONS = 16;
const DEFAULT_SECTION_COUNT = 3;
// Sections are pre-named up front ("Section 1".."Section N") — the admin
// names their topics and generates their questions afterward on the test's
// own Questions page (reached by clicking the test), which is where that
// actually happens.
const defaultSections = (count) => Array.from({ length: count }, (_, i) => `Section ${i + 1}`);

const initialForm = {
  title: "",
  timeLimitMinutes: 135,
  sectionCount: DEFAULT_SECTION_COUNT,
};

const publicLinkFor = (slug) => `${window.location.origin}/t/${slug}`;

const CreateTestForm = ({ onCreated }) => {
  const [form, setForm] = useState(initialForm);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await createTest({
        title: form.title,
        sections: defaultSections(Number(form.sectionCount)),
        timeLimitMinutes: Number(form.timeLimitMinutes),
      });
      setForm(initialForm);
      onCreated(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create test."));
    } finally {
      setCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-4">
      <div className="flex gap-5">
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
        Test title
        <input
          required
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          placeholder="HTML"
          className="border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500/20 w-100"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
        Time limit (minutes)
        <input
          type="number"
          min={1}
          required
          value={form.timeLimitMinutes}
          onChange={(e) => setForm((p) => ({ ...p, timeLimitMinutes: e.target.value }))}
          className="w-36 border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
        Number of sections
        <input
          type="number"
          min={1}
          max={MAX_TEST_SECTIONS}
          required
          value={form.sectionCount}
          onChange={(e) => setForm((p) => ({ ...p, sectionCount: e.target.value }))}
          className="w-36 border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </label>

      </div>

      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
      <button
        type="submit"
        disabled={creating}
        className="self-start px-4 py-2.5 rounded-lg font-semibold text-sm bg-red-600 text-white disabled:opacity-50"
      >
        {creating ? "Creating..." : "Create Test"}
      </button>
    </form>
  );
};

const TestRow = ({ test, onOpen, onEdit, onResponses, onStatusChanged, onDeleted }) => {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const link = publicLinkFor(test.slug);

  const handleTogglePublish = async (e) => {
    e.stopPropagation();
    setBusy(true);
    try {
      const nextStatus = test.status === "published" ? "draft" : "published";
      const res = await setTestStatus(test._id, nextStatus);
      onStatusChanged(res.data);
    } finally {
      setBusy(false);
    }
  };

  const handleCopyLink = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permission denied — the link is still visible to copy manually.
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteTest(test._id);
      onDeleted(test._id);
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Failed to delete test."));
      setDeleting(false);
    }
  };

  return (
    <div
      onClick={() => onOpen(test)}
      className="border border-[#E2E8F0] bg-white hover:bg-slate-50 rounded-xl p-4 cursor-pointer transition-colors"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-bold text-slate-900">{test.title}</p>
          <p className="text-xs text-slate-400">{test.sections.length} section(s) · {test.timeLimitMinutes} min</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
              test.status === "published"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {test.status === "published" ? "Published" : "Draft"}
          </span>
          <button
            type="button"
            onClick={handleTogglePublish}
            disabled={busy}
            title={test.status === "published" ? "Unpublish" : "Publish"}
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
              test.status === "published" ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
            }`}
          >
            <FiCheckCircle size={15} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onResponses(test);
            }}
            title="View responses"
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <FiBarChart2 size={15} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(test);
            }}
            title="Update test"
            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <FiEdit2 size={15} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmingDelete(true);
            }}
            title="Delete test"
            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <FiTrash2 size={15} />
          </button>
        </div>
      </div>

      {confirmingDelete && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg space-y-2"
        >
          <p className="text-xs text-red-700 font-medium">
            Delete "{test.title}"? This permanently removes its questions and every student attempt — this cannot be
            undone.
          </p>
          {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete permanently"}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmingDelete(false);
                setDeleteError("");
              }}
              disabled={deleting}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {test.status === "published" && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <FiLink size={12} className="text-slate-400 shrink-0" />
          <span className="text-slate-500 truncate">{link}</span>
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1 text-[#1F2853] font-semibold shrink-0"
          >
            <FiCopy size={12} /> {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
};

const TestManager = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchTests = async () => {
    setLoading(true);
    setListError("");
    try {
      const res = await listTests();
      setTests(res.data || []);
    } catch (err) {
      setListError(getErrorMessage(err, "Failed to load tests."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  // Straight to the new test's own Questions page (its own "tab") instead of
  // expanding inline here — that page auto-opens the Generate panel since
  // there's nothing to browse yet.
  const handleCreated = (test) => {
    navigate(`/super-admin-dashboard/tests/${test._id}`, { state: { justCreated: true } });
  };

  const handleOpen = (test) => {
    navigate(`/super-admin-dashboard/tests/${test._id}`);
  };

  // Same destination as opening the test, but tells the page to start with
  // the title/time-limit edit fields already showing.
  const handleEdit = (test) => {
    navigate(`/super-admin-dashboard/tests/${test._id}`, { state: { openEdit: true } });
  };

  // Opens the test page straight on its "Responses" tab.
  const handleResponses = (test) => {
    navigate(`/super-admin-dashboard/tests/${test._id}`, { state: { tab: "responses" } });
  };

  const handleStatusChanged = (updated) => {
    setTests((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
  };

  const handleDeleted = (deletedId) => {
    setTests((prev) => prev.filter((t) => t._id !== deletedId));
  };

  return (
    <div className="bg-white border border-[#E2E8F0] p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tests</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Each test is its own named exam with its own sections and its own public signup link.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-sm bg-[#1F2853] text-white"
        >
          <FiPlus size={15} /> {showCreateForm ? "Cancel" : "Create Test"}
        </button>
      </div>

      {showCreateForm ? (
        <CreateTestForm onCreated={handleCreated} />
      ) : (
        <>
          {listError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">{listError}</div>
          )}

          {loading ? (
            <div className="p-6 text-center text-slate-500">Loading tests...</div>
          ) : tests.length === 0 ? (
            <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
              No tests yet. Use "Create Test" above to make one.
            </div>
          ) : (
            <div className="space-y-3">
              {tests.map((test) => (
                <TestRow
                  key={test._id}
                  test={test}
                  onOpen={handleOpen}
                  onEdit={handleEdit}
                  onResponses={handleResponses}
                  onStatusChanged={handleStatusChanged}
                  onDeleted={handleDeleted}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TestManager;
