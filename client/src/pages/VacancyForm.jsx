import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createVacancy } from '../api/recruitment';

export default function VacancyForm() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [employmentType, setEmploymentType] = useState('full-time');
  const [closingDate, setClosingDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await createVacancy({
        title,
        department,
        description,
        requirements,
        employmentType,
        closingDate: closingDate || undefined,
      });
      navigate('/recruitment/vacancies');
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Failed to create vacancy';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600';

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">New Vacancy</h1>
      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Job Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Department</label>
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Requirements (optional)
          </label>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            rows={4}
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Employment Type</label>
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              className={inputClass}
            >
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="intern">Intern</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Closing Date (optional)
            </label>
            <input
              type="date"
              value={closingDate}
              onChange={(e) => setClosingDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Vacancy'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/recruitment/vacancies')}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}