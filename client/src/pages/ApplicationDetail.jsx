import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  getApplicationById,
  updateApplicationStatus,
  scheduleInterview,
  sendOffer,
  downloadResume,
} from '../api/recruitment';


const STATUS_OPTIONS = [
  'applied', 'shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected',
];

export default function ApplicationDetail() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [notes, setNotes] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  const [interviewDate, setInterviewDate] = useState('');
  const [interviewMode, setInterviewMode] = useState('virtual');
  const [schedulingInterview, setSchedulingInterview] = useState(false);

  const [offerPosition, setOfferPosition] = useState('');
  const [offerSalary, setOfferSalary] = useState('');
  const [offerStartDate, setOfferStartDate] = useState('');
  const [sendingOffer, setSendingOffer] = useState(false);

  const [downloadingResume, setDownloadingResume] = useState(false);

  const loadApplication = async () => {
    try {
      const { data } = await getApplicationById(id);
      setApplication(data.application);
      setNotes(data.application.internalNotes || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplication();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setSavingStatus(true);
    try {
      await updateApplicationStatus(id, { status: newStatus });
      loadApplication();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      await updateApplicationStatus(id, { internalNotes: notes });
      loadApplication();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save notes');
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    setSchedulingInterview(true);
    try {
      await scheduleInterview(id, { scheduledAt: interviewDate, mode: interviewMode });
      setInterviewDate('');
      loadApplication();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to schedule interview');
    } finally {
      setSchedulingInterview(false);
    }
  };

  const handleSendOffer = async (e) => {
    e.preventDefault();
    setSendingOffer(true);
    try {
      await sendOffer(id, {
        position: offerPosition,
        salary: Number(offerSalary),
        startDate: offerStartDate,
      });
      loadApplication();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to send offer');
    } finally {
      setSendingOffer(false);
    }
  };

  const handleDownloadResume = async () => {
    setDownloadingResume(true);
    try {
      const response = await downloadResume(id);
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = application.resumeOriginalName || 'resume.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download resume');
    } finally {
      setDownloadingResume(false);
    }
  };

  if (loading) return <p className="text-slate-400">Loading...</p>;
  if (error || !application) return <p className="text-red-600">{error || 'Application not found'}</p>;

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600';

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{application.candidateName}</h1>
            <p className="text-sm text-slate-500">{application.candidateEmail}</p>
            {application.candidatePhone && (
              <p className="text-sm text-slate-500">{application.candidatePhone}</p>
            )}
            <p className="mt-1 text-sm text-slate-600">
              Applied for: <span className="font-medium">{application.vacancy?.title}</span>
            </p>
          </div>
          <button
            onClick={handleDownloadResume}
            disabled={downloadingResume}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {downloadingResume ? 'Downloading...' : 'Download Resume'}
          </button>
        </div>

        {application.coverLetter && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <h3 className="mb-1 text-sm font-semibold text-slate-900">Cover Letter</h3>
            <p className="whitespace-pre-line text-sm text-slate-600">{application.coverLetter}</p>
          </div>
        )}

        <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
          <label className="text-sm font-medium text-slate-700">Status:</label>
          <select
            value={application.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={savingStatus}
            className={`${inputClass} w-52`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Internal notes */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 font-semibold text-slate-900">Internal Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Notes visible only to HR/admin..."
          className={inputClass}
        />
        <button
          onClick={handleSaveNotes}
          className="mt-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Save Notes
        </button>
      </div>

      {/* Interviews */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 font-semibold text-slate-900">Interviews</h2>

        {application.interviews.length === 0 ? (
          <p className="mb-4 text-sm text-slate-400">No interviews scheduled yet.</p>
        ) : (
          <div className="mb-4 space-y-2">
            {application.interviews.map((iv) => (
              <div key={iv._id} className="rounded-lg border border-slate-100 p-3 text-sm">
                <p className="font-medium text-slate-900">
                  {new Date(iv.scheduledAt).toLocaleString()}
                </p>
                <p className="text-slate-500 capitalize">
                  {iv.mode} · {iv.outcome}
                </p>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleScheduleInterview} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Date &amp; Time</label>
            <input
              type="datetime-local"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Mode</label>
            <select
              value={interviewMode}
              onChange={(e) => setInterviewMode(e.target.value)}
              className={inputClass}
            >
              <option value="virtual">Virtual</option>
              <option value="in-person">In-person</option>
              <option value="phone">Phone</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={schedulingInterview}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {schedulingInterview ? 'Scheduling...' : 'Schedule'}
          </button>
        </form>
      </div>

      {/* Offer */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 font-semibold text-slate-900">Offer</h2>

        {application.offer?.sentAt ? (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
            Offer sent for <strong>{application.offer.position}</strong> at $
            {Number(application.offer.salary).toLocaleString()}, starting{' '}
            {new Date(application.offer.startDate).toLocaleDateString()}.
          </div>
        ) : (
          <form onSubmit={handleSendOffer} className="grid grid-cols-3 gap-3">
            <input
              placeholder="Position"
              value={offerPosition}
              onChange={(e) => setOfferPosition(e.target.value)}
              required
              className={inputClass}
            />
            <input
              type="number"
              placeholder="Salary"
              value={offerSalary}
              onChange={(e) => setOfferSalary(e.target.value)}
              required
              className={inputClass}
            />
            <input
              type="date"
              value={offerStartDate}
              onChange={(e) => setOfferStartDate(e.target.value)}
              required
              className={inputClass}
            />
            <button
              type="submit"
              disabled={sendingOffer}
              className="col-span-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {sendingOffer ? 'Sending...' : 'Send Offer'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}