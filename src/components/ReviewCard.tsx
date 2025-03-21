import React from "react";
import { Review } from "@/utils/types";
import RatingStars from "./RatingStars";
import { Flag, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewCardProps {
  review: Review;
  className?: string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, className }) => {
  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg bg-white border border-gray-100 shadow-soft transition-all duration-200 hover:shadow-md",
        className
      )}
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
            <p className="text-xs text-gray-500">{formatDate(review.date)}</p>
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
        <button className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ThumbsUp className="h-4 w-4 mr-1" />
          <span>Helpful ({review.helpful})</span>
        </button>
        <button className="flex items-center text-sm text-gray-400 hover:text-red-500 transition-colors">
          <Flag className="h-4 w-4 mr-1" />
          <span>Report</span>
        </button>
      </div>
    </div>
  );
};

export default ReviewCard;
