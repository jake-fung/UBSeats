import React, {useEffect, useState} from "react";
import { Review } from "@/utils/types";
import RatingStars from "./RatingStars";
import { Flag, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import {updateReviewHelpfulCount} from "@/services/studySpotService.ts";

interface ReviewCardProps {
  review: Review;
  className?: string;
  onClick?: () => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, className, onClick }) => {
  const [helpfulCount, setHelpfulCount] = useState(review.helpful);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  // Set initial helpful count from review prop
  useEffect(() => {
    setHelpfulCount(review.helpful);
  }, [review.helpful]);

  useEffect(() => {
    const storedVote = localStorage.getItem(`review-${review.id}-voted`);
    if (storedVote) {
      setHasVoted(true);
    }
    }, [review.id]);

  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time
    const formatTime = (timeString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
        };
        return new Date(`1970-01-01T${timeString}`).toLocaleTimeString(undefined, options);
    }

  const handleHelpfulClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent onClick

    if (hasVoted || isUpdating) return;

    // Check if the user has already voted
    const storedVote = localStorage.getItem(`review-${review.id}-voted`);
    if (storedVote) {
      toast.error("You have already voted.");
      return;
    }

    // Store the vote in local storage
    localStorage.setItem(`review-${review.id}-voted`, "true");

    try {
      setIsUpdating(true);

      const newHelpfulCount = await updateReviewHelpfulCount(review.id, helpfulCount + 1);

      setHelpfulCount(newHelpfulCount);
      setHasVoted(true);

      toast.success('Thanks for your feedback!');
    } catch (helpfulError) {
        console.error('Error updating helpful count:', helpfulError);
        toast.error('Failed to update helpful count. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg bg-white border border-gray-100 shadow-soft transition-all duration-200 hover:shadow-md",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <img
            src={review.user.avatar}
            alt={review.user.name}
            className="w-10 h-10 rounded-full object-cover border border-gray-200"
          />
          <div className="ml-3">
            <h4 className="font-medium text-gray-900">{review.user.name}</h4>
            <p className="text-xs text-gray-500">{formatDate(review.date)} at {formatTime(review.time)}</p>
          </div>
        </div>
        <RatingStars rating={review.rating} size="sm" />
      </div>

      <div className="mb-4">
        <p className="text-gray-700 text-sm">{review.content}</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex flex-col items-center px-3 py-1.5 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-500 mb-1">Comfort</span>
          <RatingStars rating={review.categories.comfort} size="sm" />
        </div>
        <div className="flex flex-col items-center px-3 py-1.5 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-500 mb-1">Noise</span>
          <RatingStars rating={review.categories.noise} size="sm" />
        </div>
        <div className="flex flex-col items-center px-3 py-1.5 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-500 mb-1">Amenities</span>
          <RatingStars rating={review.categories.amenities} size="sm" />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button className={cn(
            "flex items-center text-sm transition-colors",
            hasVoted ? "text-green-600" : "text-gray-500 hover:text-gray-700 hover:-translate-y-0.5 transition-all",
            isUpdating && "opacity-50 cursor-not-allowed"
        )} onClick={handleHelpfulClick}  disabled={isUpdating || hasVoted}>
          <ThumbsUp className={cn("h-4 w-4 mr-1", hasVoted && "fill-green-600")} />
          <span>Helpful ({helpfulCount})</span>
        </button>
        <button className="flex items-center text-sm text-gray-400 hover:text-red-500 transition-colors" onClick={(e) => e.stopPropagation()}>
          <Flag className="h-4 w-4 mr-1" />
          <span>Report</span>
        </button>
      </div>
    </div>
  );
};

export default ReviewCard;
