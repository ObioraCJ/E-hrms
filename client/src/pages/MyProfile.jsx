import { useState, useEffect, useRef } from 'react';
import { getMyProfile, updateMyProfile, uploadMyProfilePicture } from '../api/employees';

export default function MyProfile() {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [pictureError, setPictureError] = useState('');
  const fileInputRef = useRef(null);

  const loadProfile = async () => {
    try {
      const { data } = await getMyProfile();
      setEmployee(data.employee);
      setPhone(data.employee.phone || '');
      setAddress(data.employee.address || '');
      setDateOfBirth(data.employee.dateOfBirth ? data.employee.dateOfBirth.slice(0, 10) : '');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setSaveMessage('');
    try {
      await updateMyProfile({ phone, address, dateOfBirth: dateOfBirth || undefined });
      setSaveMessage('Profile updated.');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePictureSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setPictureError('Image must be under 2MB');
      e.target.value = '';
      return;
    }

    setPictureError('');
    setUploadingPicture(true);

    const formData = new FormData();
    // 'picture' must match the field name in the backend's
    // uploadProfilePicture.single('picture') middleware.
    formData.append('picture', file);

    try {
      const { data } = await uploadMyProfilePicture(formData);
      // Update just the picture URL locally rather than re-fetching the
      // whole profile - the response already gives us exactly what
      // changed, so there's no need for a second round-trip.
      setEmployee((prev) => ({ ...prev, profilePicture: data.pictureUrl }));
    } catch (err) {
      setPictureError(err.response?.data?.message || 'Failed to upload picture');
    } finally {
      setUploadingPicture(false);
      e.target.value = ''; // allows re-selecting the same file again later if needed
    }
  };

  if (loading) return <p className="text-slate-400">Loading...</p>;
  if (error || !employee) return <p className="text-red-600">{error || 'Profile not found'}</p>;

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600';

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">My Profile</h1>

      {/* Profile picture + read-only identity info */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            {employee.profilePicture ? (
              <img
                src={employee.profilePicture}
                alt="Profile"
                className="h-20 w-20 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-400">
                {employee.user?.firstName?.[0]}
                {employee.user?.lastName?.[0]}
              </div>
            )}
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              {employee.user?.firstName} {employee.user?.lastName}
            </h2>
            <p className="text-sm text-slate-500">{employee.user?.email}</p>
            <p className="text-xs text-slate-400">
              {employee.employeeId} · {employee.department} · {employee.designation}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handlePictureSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPicture}
              className="mt-2 text-sm text-blue-600 hover:underline disabled:opacity-50"
            >
              {uploadingPicture ? 'Uploading...' : 'Change photo'}
            </button>
            {pictureError && <p className="mt-1 text-xs text-red-600">{pictureError}</p>}
          </div>
        </div>
      </div>

      {/* Editable contact details */}
      <form
        onSubmit={handleSaveProfile}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-6"
      >
        <h2 className="font-semibold text-slate-900">Contact Details</h2>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Date of Birth</label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className={inputClass}
          />
        </div>

        {saveMessage && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{saveMessage}</p>
        )}

        <button
          type="submit"
          disabled={savingProfile}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {savingProfile ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}