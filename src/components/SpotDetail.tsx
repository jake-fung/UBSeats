import React, { useState } from "react";
import { StudySpot } from "@/utils/types";
import { useAmenities, useCategories, useReviews } from "@/hooks/useStudySpots";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  ThumbsUp,
  User,
  Wifi,
  X,
  Accessibility,
  Tv,
  UtensilsCrossed,
  Moon,
  Plug,
  ParkingCircle,
  Volume,
  Volume1,
  Volume2,
} from "lucide-react";
import RatingStars from "./RatingStars";
import ReviewCard from "./ReviewCard";
import { cn } from "@/lib/utils";
import WritingReview from "@/components/WritingReview.tsx";

interface SpotDetailProps {
  spot: StudySpot;
  onClose: () => void;
}

const SpotDetail: React.FC<SpotDetailProps> = ({ spot, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReviews, setShowReviews] = useState(false);
  const [showAllTimes, setShowAllTimes] = useState(false);
  const [writingReview, setWritingReview] = useState(false);

  const iconMap = {
    Accessibility: Accessibility,
    Tv: Tv,
    UtensilsCrossed: UtensilsCrossed,
    Clock: Clock,
    Moon: Moon,
    Plug: Plug,
    ParkingCircle: ParkingCircle,
    Wifi: Wifi,
  };

  const { data: categories = [] } = useCategories();
  const { data: amenities = [] } = useAmenities();
  const { data: reviews = [] } = useReviews(spot.id);

  const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

  const todayOpenHours = () => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    return spot.hours.opening_hours[`${dayNames[currentDay]}_open`];
  }

  const todayClosingHours = () => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    return spot.hours.opening_hours[`${dayNames[currentDay]}_close`];
  }

  const formatTimeRange = (start: string, end: string) => {
    if (start === "00:00:00" && end === "24:00:00") {
      return "Open all day";
    } else if (start === "00:00:00" && end === "00:00:00") {
      return "Closed";
    }
    return `${formatTime(start)} - ${formatTime(end)}`;
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return "";

    const [hours, minutes] = timeString.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;

    return `${displayHours}${minutes > 0 ? ":" + minutes.toString().padStart(2, "0") : ""} ${period}`;
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % spot.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + spot.images.length) % spot.images.length
    );
  };

  // Get category details
  const spotCategories = categories.filter((category) =>
    spot.categories.includes(category.id)
  );

  // Get amenity details
  const spotAmenities = amenities.filter((amenity) =>
    spot.amenities.includes(amenity.id)
  );

    const writeReview = () => {
        setWritingReview(true);
    };

    const handleOnClose = () => {
        setWritingReview(false);
    };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-xl overflow-hidden scale-in">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-2 rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
          aria-label="Close details"
        >
          <X className="h-5 w-5 text-gray-700" />
        </button>

        <div className="overflow-y-auto max-h-[90vh]">
          {/* Image Gallery */}
          <div className="relative h-64 md:h-80 bg-gray-900">
            <img
              src={spot.images[currentImageIndex]}
              alt={spot.name}
              className="w-full h-full object-cover"
            />

            {spot.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-900" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5 text-gray-900" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                  {spot.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        index === currentImageIndex
                          ? "bg-white scale-125"
                          : "bg-white/50"
                      )}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 mb-2">
                {spotCategories.map((category) => (
                  <span
                    key={category.id}
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                    style={{ backgroundColor: category.color, color: "white" }}
                  >
                    {category.name}
                  </span>
                ))}
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {spot.name}
              </h2>

              <div className="flex items-center mb-2">
                <RatingStars rating={spot.rating} showValue size="md" />
                <span className="ml-2 text-sm text-gray-500">
                  {spot.reviewCount} reviews
                </span>
              </div>

              <div className="flex items-center text-sm text-gray-600 mb-4">
                <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
                <span>{spot.location.address}</span>
              </div>

              <p className="text-gray-700 mb-6">{spot.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center">
                  {spot.noise == 1 ? (
                    <Volume className="h-5 w-5 mr-1" />
                  ) : spot.noise == 2 ? (
                    <Volume1 className="h-5 w-5 mr-1" />
                  ) : spot.noise == 3 ? (
                    <Volume1 className="h-5 w-5 mr-1" />
                  ) : spot.noise == 4 ? (
                    <Volume2 className="h-5 w-5 mr-1" />
                  ) : (
                    <Volume2 className="h-5 w-5 mr-1" />
                  )}
                  <div className="text-center">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      Noise Level
                    </h4>
                    <RatingStars rating={spot.noise} max={5} />
                    <p className="text-xs text-gray-500 mt-1">
                      {spot.noise === 1
                        ? "Very Quiet"
                        : spot.noise === 2
                          ? "Quiet"
                          : spot.noise === 3
                            ? "Moderate"
                            : spot.noise === 4
                              ? "Noisy"
                              : "Very Noisy"}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center">
                  <Wifi className="h-5 w-5 text-gray-700 mb-2" />
                  <div className="text-center">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      WiFi Strength
                    </h4>
                    <RatingStars rating={spot.wifi} max={5} />
                    <p className="text-xs text-gray-500 mt-1">
                      {spot.wifi === 1
                        ? "Poor"
                        : spot.wifi === 2
                          ? "Fair"
                          : spot.wifi === 3
                            ? "Good"
                            : spot.wifi === 4
                              ? "Very Good"
                              : "Excellent"}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center">
                  <User className="h-5 w-5 text-gray-700 mb-2" />
                  <div className="text-center">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      Seating
                    </h4>
                    <RatingStars rating={spot.seating} max={5} />
                    <p className="text-xs text-gray-500 mt-1">
                      {spot.seating === 1
                        ? "Very Limited"
                        : spot.seating === 2
                          ? "Limited"
                          : spot.seating === 3
                            ? "Moderate"
                            : spot.seating === 4
                              ? "Abundant"
                              : "Very Abundant"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Hours & Peak Times */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Hours & Peak Times
                </h3>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between">
                      <div className="flex items-center mb-2">
                        <Clock className="h-5 w-5 text-gray-700 mr-2" />
                        <h4 className="text-sm font-medium text-gray-900">
                          {showAllTimes?
                                "All Opening Hours"
                                :
                                "Today's Opening Hours"
                            }
                        </h4>
                      </div>
                      <button
                          onClick={() => setShowAllTimes(!showAllTimes)}
                          className="text-xs text-primary font-medium mb-2">
                        {showAllTimes ? "Show today's time" : "Show all times"}
                      </button>
                    </div>
                      {showAllTimes?
                          <p className="text-gray-700">
                            {"Sunday: "} {formatTimeRange(spot.hours.opening_hours.sunday_open, spot.hours.opening_hours.sunday_close)}
                            <br/>
                            {"Monday: "} {formatTimeRange(spot.hours.opening_hours.monday_open, spot.hours.opening_hours.monday_close)}
                              <br/>
                            {"Tuesday: "} {formatTimeRange(spot.hours.opening_hours.tuesday_open, spot.hours.opening_hours.tuesday_close)}
                            <br/>
                            {"Wednesday: "} {formatTimeRange(spot.hours.opening_hours.wednesday_open, spot.hours.opening_hours.wednesday_close)}
                            <br/>
                            {"Thursday: "} {formatTimeRange(spot.hours.opening_hours.thursday_open, spot.hours.opening_hours.thursday_close)}
                            <br/>
                            {"Friday: "} {formatTimeRange(spot.hours.opening_hours.friday_open, spot.hours.opening_hours.friday_close)}
                            <br/>
                            {"Saturday: "} {formatTimeRange(spot.hours.opening_hours.saturday_open, spot.hours.opening_hours.saturday_close)}
                            </p>
                          :
                          <p className="text-gray-700">
                            {formatTimeRange(todayOpenHours(), todayClosingHours())}
                          </p>
                      }

                  </div>

                  <div className="flex-1 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Calendar className="h-5 w-5 text-gray-700 mr-2" />
                      <h4 className="text-sm font-medium text-gray-900">
                        Peak Hours
                      </h4>
                    </div>
                    <div className="space-y-1">
                      {spot.hours.peakHours.map((peakHour, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                          <p className="text-gray-700">{peakHour}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Amenities
                </h3>
                <div className="flex flex-wrap gap-3">
                  {spotAmenities.map((amenity) => {
                    const IconComponent =
                      iconMap[amenity.icon as keyof typeof iconMap];
                    return (
                      <div
                        key={amenity.id}
                        className="flex items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <IconComponent className="h-5 w-5 text-gray-700 mr-2" />
                        <span className="text-sm text-gray-700">
                          {amenity.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Reviews
                  </h3>
                  <button
                    onClick={() => setShowReviews(!showReviews)}
                    className="text-sm text-primary font-medium"
                  >
                    {showReviews ? "Hide all reviews" : "Show all reviews"}
                  </button>
                </div>

                {reviews.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No reviews yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {showReviews
                      ? reviews.map((review) => (
                          <ReviewCard key={review.id} review={review} />
                        ))
                      : reviews
                          .slice(0, 2)
                          .map((review) => (
                            <ReviewCard key={review.id} review={review} />
                          ))}
                  </div>
                )}

                {!showReviews && reviews.length > 2 && (
                  <button
                    onClick={() => setShowReviews(true)}
                    className="mt-4 w-full py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    Show all {reviews.length} reviews
                  </button>
                )}

                <button className="mt-6 w-full py-3 flex items-center justify-center text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                onClick={writeReview}>
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Write a review
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {writingReview && <WritingReview onClose={handleOnClose} spot={spot} />}
    </div>
  );
};

export default SpotDetail;
