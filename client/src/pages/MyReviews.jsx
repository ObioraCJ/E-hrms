import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyReviews } from '../api/performance';

export default function MyReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getMyReviews();
        setReviews(data.reviews);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-slate-900">My Performance Reviews</h1>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : reviews.length === 0 ? (
        <p className="text-slate-400">No reviews available yet.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Link
              key={r._id}
              to={`/my-reviews/${r._id}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300"
            >
              <div>
                <p className="font-medium text-slate-900">{r.reviewPeriod}</p>
                <p className="text-xs text-slate-400">
                  Reviewed by {r.reviewer?.firstName} {r.reviewer?.lastName}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {r.overallRating && (
                  <span className="text-sm font-medium text-blue-600">{r.overallRating} / 5</span>
                )}
                {r.status === 'acknowledged' ? (
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                    Acknowledged
                  </span>
                ) : (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    New
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}