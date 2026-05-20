import React, { useState } from 'react';
import { StudySpot } from '@/supabase/schema/types';
import { useAmenities, useCategories } from '@/hooks/useBuildings';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Wifi,
  X,
  Accessibility,
  Tv,
  UtensilsCrossed,
  Moon,
  Plug,
  ParkingCircle,
} from 'lucide-react';
import { cn } from '@/utils/cnUtils';
import { todayOpeningTimeString, formatTimeRange } from '@/utils/timeUtils';

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

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % spot.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + spot.images.length) % spot.images.length);
  };

  const spotCategories = categories.filter((category) => spot.categories.includes(category.id));

  const spotAmenities = amenities.filter((amenity) => spot.amenities.includes(amenity.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm fade-in">
      <div className="scale-in relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 shadow-md transition-colors hover:bg-white"
          aria-label="Close details"
        >
          <X className="h-5 w-5 text-gray-700" />
        </button>

        <div className="max-h-[90vh] overflow-y-auto">
          {/* Image Gallery */}
          <div className="relative h-64 bg-gray-900 md:h-80">
            <img src={spot.images[currentImageIndex]} alt={spot.name} className="h-full w-full object-cover" />

            {spot.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md transition-colors hover:bg-white"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-900" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md transition-colors hover:bg-white"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5 text-gray-900" />
                </button>
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 space-x-2">
                  {spot.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        'h-2 w-2 rounded-full transition-all',
                        index === currentImageIndex ? 'scale-125 bg-white' : 'bg-white/50',
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
              <div className="mb-2 flex flex-wrap gap-2">
                {spotCategories.map((category) => (
                  <span
                    key={category.id}
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                    style={{ backgroundColor: category.color, color: 'white' }}
                  >
                    {category.name}
                  </span>
                ))}
              </div>

              <h2 className="mb-1 text-2xl font-bold text-gray-900">{spot.name}</h2>

              <div className="mb-2 flex items-center text-sm text-gray-600">
                <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
                <span>{spot.location.address}</span>
              </div>

              {/* <div className="mb-4 flex items-center">
                <RatingStars rating={spot.rating} showValue size="md" />
              </div> */}

              <p className="mb-6 text-gray-700">{spot.description}</p>

              {/* Hours & Peak Times */}
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">Hours & Peak Times</h3>
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex-1 rounded-lg bg-gray-50 p-4">
                    <div className="flex justify-between">
                      <div className="mb-2 flex items-center">
                        <Clock className="mr-2 h-5 w-5 text-gray-700" />
                        <h4 className="text-sm font-medium text-gray-900">
                          {showAllTimes ? 'All Opening Hours' : "Today's Opening Hours"}
                        </h4>
                      </div>
                      <button
                        onClick={() => setShowAllTimes(!showAllTimes)}
                        className="mb-2 text-xs font-medium text-primary"
                      >
                        {showAllTimes ? "Show today's time" : 'Show all times'}
                      </button>
                    </div>
                    {showAllTimes ? (
                      <p className="text-gray-700">
                        <strong>Sun: </strong>
                        {formatTimeRange(spot.hours.periods.sunOpen, spot.hours.periods.sunClose)}
                        <br />
                        <strong>Mon: </strong>
                        {formatTimeRange(spot.hours.periods.monOpen, spot.hours.periods.monClose)}
                        <br />
                        <strong>Tue: </strong>
                        {formatTimeRange(spot.hours.periods.tueOpen, spot.hours.periods.tueClose)}
                        <br />
                        <strong>Wed: </strong>
                        {formatTimeRange(spot.hours.periods.wedOpen, spot.hours.periods.wedClose)}
                        <br />
                        <strong>Thu: </strong>
                        {formatTimeRange(spot.hours.periods.thuOpen, spot.hours.periods.thuClose)}
                        <br />
                        <strong>Fri: </strong>
                        {formatTimeRange(spot.hours.periods.friOpen, spot.hours.periods.friClose)}
                        <br />
                        <strong>Sat: </strong>
                        {formatTimeRange(spot.hours.periods.satOpen, spot.hours.periods.satClose)}
                      </p>
                    ) : (
                      <p className="text-gray-700">{todayOpeningTimeString(spot)}</p>
                    )}
                  </div>

                  <div className="flex-1 rounded-lg bg-gray-50 p-4">
                    <div className="mb-2 flex items-center">
                      <Calendar className="mr-2 h-5 w-5 text-gray-700" />
                      <h4 className="text-sm font-medium text-gray-900">Peak Hours</h4>
                    </div>
                    <div className="space-y-1">
                      {spot.hours.peakHours.map((peakHour, index) => (
                        <div key={index} className="flex items-center">
                          <div className="mr-2 h-2 w-2 rounded-full bg-yellow-500"></div>
                          <p className="text-gray-700">{peakHour}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">Amenities</h3>
                <div className="flex flex-wrap gap-3">
                  {spotAmenities.map((amenity) => {
                    const IconComponent = iconMap[amenity.icon as keyof typeof iconMap];
                    return (
                      <div key={amenity.id} className="flex items-center rounded-lg bg-gray-50 p-3">
                        <IconComponent className="mr-2 h-5 w-5 text-gray-700" />
                        <span className="text-sm text-gray-700">{amenity.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotDetail;
