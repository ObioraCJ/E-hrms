import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createReview, updateReview, getReviewById } from '../api/performance';
import { getEmployees } from '../api/employees';

// A blank KPI/goal template - used both for the initial empty row and
// whenever "+ Add KPI"/"+ Add Goal" is clicked.
const emptyKpi = { name: '', target: '', actual: '', rating: '' };
const emptyGoal = { title: '', description: '', status: 'not-started', dueDate: '' };

export default function PerformanceReviewForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [employee, setEmployee] = useState('');
  const [reviewPeriod, setReviewPeriod] = useState('');
  const [kpis, setKpis] = useState([{ ...emptyKpi }]);
  const [goals, setGoals] = useState([{ ...emptyGoal }]);
  const [managerFeedback, setManagerFeedback] = useState('');
  const [overallRating, setOverallRating] = useState('');
  const [reviewStatus, setReviewStatus] = useState('draft');
  const [employeeOptions, setEmployeeOptions] = useState([]);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isReadOnly = isEditMode && reviewStatus !== 'draft';

  useEffect(() => {
    const loadEmployeeOptions = async () => {
      try {
        const { data } = await getEmployees({ limit: 500 });
        setEmployeeOptions(data.employees);
      } catch {
        // Non-fatal
      }
    };
    loadEmployeeOptions();
  }, []);

  useEffect(() => {
    if (!isEditMode) return;

    const loadReview = async () => {
      try {
        const { data } = await getReviewById(id);
        const r = data.review;
        setEmployee(r.employee?._id || '');
        setReviewPeriod(r.reviewPeriod || '');
        setKpis(r.kpis?.length ? r.kpis : [{ ...emptyKpi }]);
        setGoals(
          r.goals?.length
            ? r.goals.map((g) => ({ ...g, dueDate: g.dueDate ? g.dueDate.slice(0, 10) : '' }))
            : [{ ...emptyGoal }]
        );
        setManagerFeedback(r.managerFeedback || '');
        setOverallRating(r.overallRating ?? '');
        setReviewStatus(r.status);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load review');
      } finally {
        setLoading(false);
      }
    };

    loadReview();
  }, [id, isEditMode]);

  // Generic helpers for updating one field of one item in either the
  // kpis or goals array, by index - avoids writing separate update
  // logic for each individual field of each individual row.
  const updateKpi = (index, field, value) => {
    setKpis((prev) => prev.map((kpi, i) => (i === index ? { ...kpi, [field]: value } : kpi)));
  };
  const updateGoal = (index, field, value) => {
    setGoals((prev) => prev.map((goal, i) => (i === index ? { ...goal, [field]: value } : goal)));
  };

  const addKpi = () => setKpis((prev) => [...prev, { ...emptyKpi }]);
  const removeKpi = (index) => setKpis((prev) => prev.filter((_, i) => i !== index));

  const addGoal = () => setGoals((prev) => [...prev, { ...emptyGoal }]);
  const removeGoal = (index) => setGoals((prev) => prev.filter((_, i) => i !== index));

  const buildPayload = (statusOverride) => ({
    kpis: kpis
      .filter((k) => k.name.trim())
      .map((k) => ({ ...k, rating: k.rating === '' ? undefined : Number(k.rating) })),
    goals: goals.filter((g) => g.title.trim()),
    managerFeedback,
    overallRating: overallRating === '' ? undefined : Number(overallRating),
    ...(statusOverride && { status: statusOverride }),
  });

  const handleSave = async (statusOverride) => {
    setError('');
    setSubmitting(true);

    try {
      if (isEditMode) {
        await updateReview(id, buildPayload(statusOverride));
      } else {
        await createReview({ employee, reviewPeriod, ...buildPayload() });
      }
      navigate('/performance');
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-slate-400">Loading...</p>;

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-400';

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">
        {isEditMode ? 'Performance Review' : 'New Performance Review'}
      </h1>

      {isReadOnly && (
        <p className="mb-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
          This review has been {reviewStatus} and can no longer be edited.
        </p>
      )}

      <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
        {!isEditMode && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Employee</label>
              <select
                value={employee}
                onChange={(e) => setEmployee(e.target.value)}
                required
                className={inputClass}
              >
                <option value="">Select an employee...</option>
                {employeeOptions.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.user?.firstName} {emp.user?.lastName} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Review Period
              </label>
              <input
                value={reviewPeriod}
                onChange={(e) => setReviewPeriod(e.target.value)}
                required
                placeholder="e.g. Q1 2025"
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* KPIs section */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">KPIs</h2>
            {!isReadOnly && (
              <button type="button" onClick={addKpi} className="text-sm text-blue-600 hover:underline">
                + Add KPI
              </button>
            )}
          </div>
          <div className="space-y-3">
            {kpis.map((kpi, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 rounded-lg border border-slate-100 p-3">
                <input
                  placeholder="KPI name"
                  value={kpi.name}
                  onChange={(e) => updateKpi(i, 'name', e.target.value)}
                  disabled={isReadOnly}
                  className={`col-span-4 ${inputClass}`}
                />
                <input
                  placeholder="Target"
                  value={kpi.target}
                  onChange={(e) => updateKpi(i, 'target', e.target.value)}
                  disabled={isReadOnly}
                  className={`col-span-3 ${inputClass}`}
                />
                <input
                  placeholder="Actual"
                  value={kpi.actual}
                  onChange={(e) => updateKpi(i, 'actual', e.target.value)}
                  disabled={isReadOnly}
                  className={`col-span-3 ${inputClass}`}
                />
                <input
                  type="number"
                  min="1"
                  max="5"
                  placeholder="1-5"
                  value={kpi.rating}
                  onChange={(e) => updateKpi(i, 'rating', e.target.value)}
                  disabled={isReadOnly}
                  className={`col-span-1 ${inputClass}`}
                />
                {!isReadOnly && kpis.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeKpi(i)}
                    className="col-span-1 text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Goals section */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Goals</h2>
            {!isReadOnly && (
              <button type="button" onClick={addGoal} className="text-sm text-blue-600 hover:underline">
                + Add Goal
              </button>
            )}
          </div>
          <div className="space-y-3">
            {goals.map((goal, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-slate-100 p-3">
                <div className="flex gap-2">
                  <input
                    placeholder="Goal title"
                    value={goal.title}
                    onChange={(e) => updateGoal(i, 'title', e.target.value)}
                    disabled={isReadOnly}
                    className={`flex-1 ${inputClass}`}
                  />
                  <select
                    value={goal.status}
                    onChange={(e) => updateGoal(i, 'status', e.target.value)}
                    disabled={isReadOnly}
                    className={`w-36 ${inputClass}`}
                  >
                    <option value="not-started">Not started</option>
                    <option value="in-progress">In progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <input
                    type="date"
                    value={goal.dueDate}
                    onChange={(e) => updateGoal(i, 'dueDate', e.target.value)}
                    disabled={isReadOnly}
                    className={`w-40 ${inputClass}`}
                  />
                  {!isReadOnly && goals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeGoal(i)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <textarea
                  placeholder="Description (optional)"
                  value={goal.description}
                  onChange={(e) => updateGoal(i, 'description', e.target.value)}
                  disabled={isReadOnly}
                  rows={2}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Manager feedback + overall rating */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Manager Feedback</label>
          <textarea
            value={managerFeedback}
            onChange={(e) => setManagerFeedback(e.target.value)}
            disabled={isReadOnly}
            rows={4}
            className={inputClass}
          />
        </div>

        <div className="w-40">
          <label className="mb-1 block text-sm font-medium text-slate-700">Overall Rating (1-5)</label>
          <input
            type="number"
            min="1"
            max="5"
            value={overallRating}
            onChange={(e) => setOverallRating(e.target.value)}
            disabled={isReadOnly}
            className={inputClass}
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        {!isReadOnly && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => handleSave()}
              disabled={submitting}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Draft'}
            </button>
            {isEditMode && (
              <button
                onClick={() => handleSave('submitted')}
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/performance')}
              className="rounded-lg px-4 py-2 text-sm text-slate-500 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}