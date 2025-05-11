import React, { useState } from "react";
import RatingStars from "@/components/RatingStars.tsx";
import { SendHorizontal, X } from "lucide-react";
import {StudySpot} from "@/utils/types.ts";
import { toast } from "sonner";
import {submitReviewByReviewId} from "@/services/studySpotService.ts";

interface WritingReviewProps {
  onClose: () => void;
  spot?: StudySpot; // Optional prop to identify which spot is being reviewed
  // onSubmit: () => void;
}

interface RatingValues {
  overall: number;
  comfort: number;
  noise: number;
  amenities: number;
  comment: string;
}

const WritingReview: React.FC<WritingReviewProps> = ({ onClose, spot }) => {
  // State for managing rating values
  const [ratings, setRatings] = useState<RatingValues>({
    overall: 0,
    comfort: 0,
    noise: 0,
    amenities: 0,
    comment: ""
  });

  // State for managing the review text
  const [reviewText, setReviewText] = useState("");

  // State for handling loading during submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for error handling
  const [error, setError] = useState<string | null>(null);

  // Update individual rating values
  const handleRatingChange = (category: keyof RatingValues, value: number) => {
    setRatings(prev => ({
      ...prev,
      [category]: value
    }));
  };

  // Handle review text changes
  const handleReviewTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReviewText(e.target.value);
  };

  // Submit the review to the backend
  const submitReview = async () => {
    // Validate inputs
    if (ratings.overall === 0) {
      toast.error("Please provide an overall rating");
      return;
    }

    if (ratings.comfort === 0) {
      toast.error("Please provide a comfort rating");
      return;
    }

    if (ratings.noise === 0) {
      toast.error("Please provide a noise rating");
      return;
    }

    if (ratings.amenities === 0) {
      toast.error("Please provide an amenities rating");
      return;
    }

    if (reviewText.trim().length === 0) {
      toast.error("Please provide a comment");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Prepare the review data
      const reviewData = {
        spotId : spot?.id,
        ratings,
        comment: reviewText,
        date: new Date().toDateString(),
        time: new Date().toLocaleTimeString(),

      };

      // Make API request to backend
      await submitReviewByReviewId(reviewData);

      // Close the review modal on success
      onClose();

    } catch (submitError) {
      console.error('Error submitting review:', submitError);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
      toast.success("Thanks for your feedback on " + spot.name + "!");
    }
  };

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm fade-in">
        <div className="relative w-full max-w-3xl p-3 px-5 max-h-[90vh] bg-white rounded-xl shadow-xl overflow-hidden scale-in">
          <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 p-2 rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
              aria-label="Close details"
          >
            <X className="h-5 w-5 text-gray-700" />
          </button>
          <h2 className="text-3xl font-bold text-gray-800 text-center my-8">Write a Review</h2>
          <div className="flex items-center justify-between px-3 my-5">
            <h3 className="font-semibold text-lg text-gray-800">Overall Rating</h3>
            <RatingStars
                rating={ratings.overall}
                size="xl"
                clickable={true}
                onRatingChange={(value) => handleRatingChange('overall', value)}
            />
          </div>
          <div className="flex items-center justify-between px-3 my-5">
            <h3 className="font-semibold text-lg text-gray-800">Comfort</h3>
            <RatingStars
                rating={ratings.comfort}
                size="xl"
                clickable={true}
                onRatingChange={(value) => handleRatingChange('comfort', value)}
            />
          </div>
          <div className="flex items-center justify-between px-3 my-5">
            <h3 className="font-semibold text-lg text-gray-800">Noise</h3>
            <RatingStars
                rating={ratings.noise}
                size="xl"
                clickable={true}
                onRatingChange={(value) => handleRatingChange('noise', value)}
            />
          </div>
          <div className="flex items-center justify-between px-3 my-5">
            <h3 className="font-semibold text-lg text-gray-800">Amenities</h3>
            <RatingStars
                rating={ratings.amenities}
                size="xl"
                clickable={true}
                onRatingChange={(value) => handleRatingChange('amenities', value)}
            />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 text-center my-1">Comment</h3>
          <textarea
              id="review"
              name="review"
              value={reviewText}
              onChange={handleReviewTextChange}
              required
              className="justify-center items-center border-2 border-gray-200 rounded-2xl p-3 w-full max-h-60 resize-none"
          />

          {error && (
              <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
          )}

          <div className="mt-4 flex justify-center space-x-10">
            <button
                className={`mt-6 w-full py-3 flex items-center justify-center text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                onClick={submitReview}
                disabled={isSubmitting}
            >
              <SendHorizontal className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
  );
};

export default WritingReview;