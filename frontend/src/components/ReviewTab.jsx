import React, { useState, useEffect } from 'react';
import { getReviewableBloodBanks, createReview, getMyReviews, updateReview, deleteReview, getBloodBankReviews } from '../lib/api';

const ReviewTab = () => {
  const [activeSubTab, setActiveSubTab] = useState('write');
  const [reviewableBloodBanks, setReviewableBloodBanks] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [donorReviews, setDonorReviews] = useState([]);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  // Form states - Only blood bank reviews allowed
  const [reviewForm, setReviewForm] = useState({
    type: 'bloodbank',
    bloodBankId: '',
    rating: 5,
    comment: ''
  });

  const [editForm, setEditForm] = useState({
    rating: 5,
    comment: ''
  });

  useEffect(() => {
    if (activeSubTab === 'write' || activeSubTab === 'browse') {
      fetchReviewableBloodBanks();
    } else if (activeSubTab === 'my') {
      fetchMyReviews();
    }
  }, [activeSubTab]);

  const fetchReviewableBloodBanks = async () => {
    try {
      setLoading(true);
      const response = await getReviewableBloodBanks();
      if (response.success) {
        setReviewableBloodBanks(response.data);
      }
    } catch (error) {
      console.error('Error fetching reviewable blood banks:', error);
      alert('Failed to load reviewable blood banks');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReviews = async () => {
    try {
      setLoading(true);
      const response = await getMyReviews();
      if (response.success) {
        setMyReviews(response.data.reviews);
      }
    } catch (error) {
      console.error('Error fetching my reviews:', error);
      alert('Failed to load your reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchBloodBankReviews = async (bloodBankId) => {
    try {
      setLoading(true);
      const response = await getBloodBankReviews(bloodBankId);
      if (response.success) {
        setDonorReviews(response.data.reviews);
        setSelectedDonor({ ...response.data.stats, type: 'bloodbank', bloodBankId: bloodBankId });
      }
    } catch (error) {
      console.error('Error fetching blood bank reviews:', error);
      alert('Failed to load blood bank reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.bloodBankId || !reviewForm.comment.trim()) {
      alert('Please select a blood bank and write a comment');
      return;
    }

    try {
      setSubmitting(true);
      const response = await createReview(reviewForm);
      if (response.success) {
        alert('Review submitted successfully!');
        setReviewForm({ type: 'bloodbank', bloodBankId: '', rating: 5, comment: '' });
        fetchReviewableBloodBanks(); // Refresh the list
      } else {
        alert(response.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error creating review:', error);
      alert(error?.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateReview = async (e) => {
    e.preventDefault();
    if (!editForm.comment.trim()) {
      alert('Please write a comment');
      return;
    }

    try {
      setSubmitting(true);
      const response = await updateReview(editingReview._id, editForm);
      if (response.success) {
        alert('Review updated successfully!');
        setEditingReview(null);
        setEditForm({ rating: 5, comment: '' });
        fetchMyReviews(); // Refresh the list
      } else {
        alert(response.message || 'Failed to update review');
      }
    } catch (error) {
      console.error('Error updating review:', error);
      alert(error?.response?.data?.message || 'Failed to update review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      const response = await deleteReview(reviewId);
      if (response.success) {
        alert('Review deleted successfully!');
        fetchMyReviews(); // Refresh the list
      } else {
        alert(response.message || 'Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert(error?.response?.data?.message || 'Failed to delete review');
    }
  };

  const startEdit = (review) => {
    setEditingReview(review);
    setEditForm({
      rating: review.rating,
      comment: review.comment
    });
  };

  const cancelEdit = () => {
    setEditingReview(null);
    setEditForm({ rating: 5, comment: '' });
  };

  const renderStars = (rating, interactive = false, onChange = null) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : 'button'}
            disabled={!interactive}
            onClick={interactive ? () => onChange(star) : undefined}
            className={`text-2xl ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
      <div className="mb-6 text-center">
        <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
          ⭐ Blood Bank Reviews
        </h2>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Share your experience with blood banks you visited
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-white/20 rounded-full p-1 backdrop-blur-md">
          <button
            onClick={() => setActiveSubTab('write')}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeSubTab === 'write' ? 'bg-pink-600 text-white' : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            ✍️ Write Review
          </button>
          <button
            onClick={() => setActiveSubTab('my')}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeSubTab === 'my' ? 'bg-pink-600 text-white' : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            📝 My Reviews
          </button>
          <button
            onClick={() => setActiveSubTab('browse')}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeSubTab === 'browse' ? 'bg-pink-600 text-white' : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            👀 Browse Reviews
          </button>
        </div>
      </div>

      {activeSubTab === 'write' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Write a Review for a Blood Bank You Visited</h3>
            <form onSubmit={handleCreateReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Blood Bank to Review
                </label>
                <select
                  value={reviewForm.bloodBankId}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, bloodBankId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Choose a blood bank you visited...</option>
                  {reviewableBloodBanks.map((bloodBank) => (
                    <option key={bloodBank._id} value={bloodBank._id}>
                      {bloodBank.name} - {bloodBank.location}
                    </option>
                  ))}
                </select>
                {reviewableBloodBanks.length === 0 && !loading && (
                  <p className="text-sm text-gray-500 mt-1">
                    No blood banks available for review. You can only review blood banks you've visited through completed donation requests.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rating
                </label>
                {renderStars(reviewForm.rating, true, (rating) =>
                  setReviewForm(prev => ({ ...prev, rating }))
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Comment
                </label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={4}
                  placeholder="Share your experience with this blood bank..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !reviewForm.bloodBankId}
                className="w-full bg-pink-600 text-white py-2 px-4 rounded-lg hover:bg-pink-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeSubTab === 'my' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Reviews ({myReviews.length})</h3>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading your reviews...</p>
            </div>
          ) : myReviews.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">You haven't written any reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myReviews.map((review) => (
                <div key={review._id} className="border border-white/20 bg-white/10 p-4 rounded-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                  {editingReview && editingReview._id === review._id ? (
                    <form onSubmit={handleUpdateReview} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Rating
                        </label>
                        {renderStars(editForm.rating, true, (rating) =>
                          setEditForm(prev => ({ ...prev, rating }))
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Comment
                        </label>
                        <textarea
                          value={editForm.comment}
                          onChange={(e) => setEditForm(prev => ({ ...prev, comment: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          rows={3}
                          required
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          {submitting ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="bg-gray-600 text-white py-1 px-3 rounded text-sm hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {review.type === 'bloodbank' ? (review.bloodBankId?.name || 'Unknown Blood Bank') : (review.donorId?.userId?.username || 'Unknown Donor')}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {review.type === 'bloodbank' ? 'Blood Bank' : 'Donor'} Review
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {renderStars(review.rating)}
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(review)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review._id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'browse' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Browse Blood Bank Reviews</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Blood Bank
            </label>
            <select
              value={selectedDonor?.bloodBankId || ''}
              onChange={(e) => {
                if (e.target.value) {
                  fetchBloodBankReviews(e.target.value);
                } else {
                  setSelectedDonor(null);
                  setDonorReviews([]);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">
                Choose a blood bank to view reviews...
              </option>
              {reviewableBloodBanks.map((entity) => (
                <option key={entity._id} value={entity._id}>
                  {entity.name} - {entity.location || entity.district}
                </option>
              ))}
            </select>
          </div>

          {selectedDonor && selectedDonor.bloodBankId && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {selectedDonor.bloodBankName || 'Selected Blood Bank'}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Average Rating: {selectedDonor.averageRating}/5 ({selectedDonor.totalReviews} reviews)
              </p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading reviews...</p>
            </div>
          ) : donorReviews.length === 0 && selectedDonor ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No reviews found for this blood bank.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {donorReviews.map((review) => (
                <div key={review._id} className="border border-white/20 bg-white/10 p-4 rounded-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {review.reviewerId?.username || 'Anonymous'}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewTab;
