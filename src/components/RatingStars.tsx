import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  max = 5,
  size = "md",
  showValue = false,
  className,
}) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const starClass = sizeClasses[size];

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex">
        {[...Array(max)].map((_, i) => (
          <span key={i} className="relative">
            <Star
              className={cn(
                starClass,
                "text-gray-300",
                "transition-transform duration-200 ease-in-out hover:scale-110"
              )}
              fill="currentColor"
            />
            {i < fullStars || (i === fullStars && hasHalfStar) ? (
              <Star
                className={cn(
                  starClass,
                  "absolute top-0 left-0 text-yellow-400",
                  "transition-transform duration-200 ease-in-out hover:scale-110",
                  {
                    "clip-path: polygon(0 0, 50% 0, 50% 100%, 0 100%)":
                      i === fullStars && hasHalfStar,
                  }
                )}
                fill="currentColor"
              />
            ) : null}
          </span>
        ))}
      </div>

      {showValue && (
        <span className="ml-2 text-sm font-medium text-gray-700">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
