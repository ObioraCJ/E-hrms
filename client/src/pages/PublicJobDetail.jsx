import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicVacancyById, submitApplication } from '../api/recruitment';
import logo from '../assets/Ehrm.png';

export default function PublicJobDetail() {
  const { id } = useParams();
  const [vacancy, setVacancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getPublicVacancyById(id);
        setVacancy(data.vacancy);
      } catch (err) {
        setError(err.response?.data?.message || 'This position could not be found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      setSubmitError('File is too large. Maximum size is 5MB.');
      e.target.value = ''; // clears the invalid selection from the input
      return;
    }
    setSubmitError('');
    setResumeFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!resumeFile) {
      setSubmitError('Please attach your resume');
      return;
    }

    setSubmitting(true);

    // FormData is the browser API for building a multipart/form-data
    // payload - required here since we're sending a file alongside
    // regular text fields, which plain JSON can't represent.
    const formData = new FormData();
    formData.append('candidateName', candidateName);
    formData.append('candidateEmail', candidateEmail);
    formData.append('candidatePhone', candidatePhone);
    formData.append('coverLetter', coverLetter);
    // 'resume' here MUST match the field name the backend's
    // upload.single('resume') middleware expects.
    formData.append('resume', resumeFile);

    try {
      await submitApplication(id, formData);
      setSubmitted(true);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Failed to submit application. Please try again.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="p-6 text-slate-400">Loading...</p>;
  if (error || !vacancy) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <p className="text-red-600">{error || 'Position not found'}</p>
        <Link to="/careers" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
          ← Back to all openings
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <img src={logo} alt="E-HRMS logo" className="h-10" />
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <Link to="/careers" className="mb-4 inline-block text-sm text-blue-600 hover:underline">
          ← Back to all openings
        </Link>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{vacancy.title}</h1>
              <p className="text-sm text-slate-500">{vacancy.department}</p>
            </div>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium capitalize text-blue-700">
              {vacancy.employmentType}
            </span>
          </div>

          <div className="mt-4 whitespace-pre-line text-sm text-slate-700">
            {vacancy.description}
          </div>

          {vacancy.requirements && (
            <div className="mt-4">
              <h3 className="mb-1 text-sm font-semibold text-slate-900">Requirements</h3>
              <div className="whitespace-pre-line text-sm text-slate-600">
                {vacancy.requirements}
              </div>
            </div>
          )}
        </div>

        {submitted ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
            <p className="font-medium text-green-800">Application submitted!</p>
            <p className="mt-1 text-sm text-green-700">
              Thank you for applying. We'll be in touch if you're a good fit.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 font-semibold text-slate-900">Apply for this position</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
                  <input
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
                <input
                  value={candidatePhone}
                  onChange={(e) => setCandidatePhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Cover Letter (optional)
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Resume (PDF or Word, max 5MB)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-slate-200"
                />
              </div>

              {submitError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{submitError}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}