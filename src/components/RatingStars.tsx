import React, { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg" | "xl";
  showValue?: boolean;
  className?: string;
  clickable?: boolean;
  onRatingChange?: (newRating: number) => void;
}

const RatingStars: React.FC<RatingStarsProps> = ({
                                                   rating: initialRating,
                                                   max = 5,
                                                   size = "md",
                                                   showValue = false,
                                                   className,
                                                   clickable = false,
                                                   onRatingChange,
                                                 }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [rating, setRating] = useState(initialRating);

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
    xl: "h-8 w-8",
  };

  const starClass = sizeClasses[size];

  const handleStarClick = (index: number) => {
    if (!clickable) return;

    const newRating = index + 1;
    setRating(newRating);
    if (onRatingChange) {
      onRatingChange(newRating);
    }
  };

  const handleMouseEnter = (index: number) => {
    if (!clickable) return;
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    if (!clickable) return;
    setHoveredIndex(null);
  };

  return (
      <div className={cn("flex items-center", className)}>
        <div className="flex">
          {[...Array(max)].map((_, i) => {
            const isActive = hoveredIndex !== null
                ? i <= hoveredIndex
                : i < fullStars || (i === fullStars && hasHalfStar);

            return (
                <span
                    key={i}
                    className={cn("relative", { "cursor-pointer": clickable })}
                    onClick={() => handleStarClick(i)}
                    onMouseEnter={() => handleMouseEnter(i)}
                    onMouseLeave={handleMouseLeave}
                >
              <Star
                  className={cn(
                      starClass,
                      "text-gray-300",
                      "transition-transform duration-200 ease-in-out hover:scale-110"
                  )}
                  fill="currentColor"
              />
                  {isActive ? (
                      <Star
                          className={cn(
                              starClass,
                              "absolute top-0 left-0 text-yellow-400",
                              "transition-transform duration-200 ease-in-out hover:scale-110",
                              {
                                "clip-path: polygon(0 0, 50% 0, 50% 100%, 0 100%)":
                                    hoveredIndex === null && i === fullStars && hasHalfStar,
                              }
                          )}
                          fill="currentColor"
                      />
                  ) : null}
            </span>
            );
          })}
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