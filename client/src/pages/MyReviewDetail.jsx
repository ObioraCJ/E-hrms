import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMyReviewById, acknowledgeReview } from '../api/performance';

export default function MyReviewDetail() {
  const { id } = useParams();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acknowledging, setAcknowledging] = useState(false);

  const loadReview = async () => {
    try {
      const { data } = await getMyReviewById(id);
      setReview(data.review);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load review');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReview();
  }, [id]);

  const handleAcknowledge = async () => {
    setAcknowledging(true);
    try {
      await acknowledgeReview(id);
      loadReview();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to acknowledge review');
    } finally {
      setAcknowledging(false);
    }
  };

  if (loading) return <p className="text-slate-400">Loading...</p>;
  if (error || !review) return <p className="text-red-600">{error || 'Review not found'}</p>;

  return (
    <div className="max-w-2xl">
      <Link to="/my-reviews" className="mb-4 inline-block text-sm text-blue-600 hover:underline">
        ← Back to reviews
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-6 flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{review.reviewPeriod} Review</h1>
            <p className="text-sm text-slate-500">
              Reviewed by {review.reviewer?.firstName} {review.reviewer?.lastName}
            </p>
          </div>
          {review.overallRating && (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {review.overallRating} / 5
            </span>
          )}
        </div>

        {review.kpis?.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-2 font-semibold text-slate-900">KPIs</h2>
            <div className="space-y-2">
              {review.kpis.map((kpi, i) => (
                <div key={i} className="rounded-lg border border-slate-100 p-3 text-sm">
                  <p className="font-medium text-slate-900">{kpi.name}</p>
                  <p className="text-slate-500">
                    Target: {kpi.target || '—'} · Actual: {kpi.actual || '—'}
                    {kpi.rating && ` · Rating: ${kpi.rating}/5`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {review.goals?.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-2 font-semibold text-slate-900">Goals</h2>
            <div className="space-y-2">
              {review.goals.map((goal, i) => (
                <div key={i} className="rounded-lg border border-slate-100 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900">{goal.title}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-600">
                      {goal.status.replace('-', ' ')}
                    </span>
                  </div>
                  {goal.description && (
                    <p className="mt-1 text-slate-500">{goal.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {review.managerFeedback && (
          <div className="mb-6">
            <h2 className="mb-2 font-semibold text-slate-900">Manager Feedback</h2>
            <p className="text-sm text-slate-600">{review.managerFeedback}</p>
          </div>
        )}

        {review.status === 'submitted' ? (
          <button
            onClick={handleAcknowledge}
            disabled={acknowledging}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {acknowledging ? 'Acknowledging...' : 'Acknowledge Review'}
          </button>
        ) : (
          <p className="text-center text-xs text-slate-400">
            Acknowledged on {new Date(review.acknowledgedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}