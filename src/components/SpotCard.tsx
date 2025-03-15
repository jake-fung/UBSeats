import React, {useState} from 'react';
import {StudySpot} from '@/utils/types';
import {useCategories} from '@/hooks/useStudySpots';
import {ArrowRight, Clock, MapPin, User, VolumeX, Wifi} from 'lucide-react';
import RatingStars from './RatingStars';
import {cn} from '@/lib/utils';

interface SpotCardProps {
  spot: StudySpot;
  onClick: () => void;
  className?: string;
  featured?: boolean;
}

const SpotCard: React.FC<SpotCardProps> = ({ spot, onClick, className, featured = false }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { data: categories = [] } = useCategories();
  
  // Get the categories for this spot
  const spotCategories = categories.filter(category => 
    spot.categories.includes(category.id)
  );
  
  // Conditionally render appropriate icons for metrics
  const renderMetricIcons = () => (
    <div className="flex space-x-3 text-gray-600">
      <div className="flex items-center">
        <VolumeX className="h-4 w-4 mr-1" />
        <span className="text-xs">{spot.noise === 1 ? 'Very Quiet' : spot.noise === 2 ? 'Quiet' : spot.noise === 3 ? 'Moderate' : spot.noise === 4 ? 'Noisy' : 'Very Noisy'}</span>
      </div>
      <div className="flex items-center">
        <Wifi className="h-4 w-4 mr-1" />
        <span className="text-xs">{spot.wifi} / 5</span>
      </div>
      <div className="flex items-center">
        <User className="h-4 w-4 mr-1" />
        <span className="text-xs">{spot.seating} / 5</span>
      </div>
    </div>
  );
  
  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-xl bg-white transition-all duration-300",
        "border border-gray-100 shadow-soft hover:shadow-card hover:-translate-y-1",
        featured ? "md:flex md:h-80" : "h-full",
        className
      )}
      onClick={onClick}
    >
      <div 
        className={cn(
          "aspect-video relative overflow-hidden",
          featured ? "md:w-1/2 md:aspect-auto md:h-full" : ""
        )}
      >
        <div className={cn("absolute inset-0 bg-gray-200 animate-pulse", imageLoaded ? "hidden" : "block")} />
        {spot.images.length > 0 && (
          <img 
            src={spot.images[0]} 
            alt={spot.name}
            onLoad={() => setImageLoaded(true)}
            className={cn(
              "h-full w-full object-cover transition-transform duration-700 ease-out",
              "group-hover:scale-105",
              imageLoaded ? "block" : "invisible"
            )}
          />
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10">
          <div className="flex flex-wrap gap-2">
            {spotCategories.map((category) => (
              <span 
                key={category.id}
                className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium text-white bg-black/40 backdrop-blur-sm"
              >
                {category.name}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <div className={cn("p-4", featured ? "md:w-1/2 md:p-6" : "")}>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center">
            <RatingStars rating={spot.rating} size="sm" />
            <span className="ml-2 text-sm text-gray-500">{spot.reviewCount} reviews</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="mr-1 h-4 w-4" />
            <span>{spot.hours.open} - {spot.hours.close}</span>
          </div>
        </div>
        
        <h3 className={cn("font-semibold text-gray-900 group-hover:text-primary transition-colors", featured ? "text-xl mb-2" : "text-lg mb-1")}>
          {spot.name}
        </h3>
        
        <div className="mb-3 flex items-center text-sm text-gray-500">
          <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
          <span className="truncate">{spot.location.address}</span>
        </div>
        
        {featured ? (
          <div>
            <p className="mb-4 text-gray-600 line-clamp-3">{spot.description}</p>
            {renderMetricIcons()}
          </div>
        ) : (
          renderMetricIcons()
        )}
        
        <button 
          className={cn(
            "mt-4 inline-flex items-center text-sm font-medium transition-colors",
            "text-primary hover:text-primary/80"
          )}
        >
          View details <ArrowRight className="ml-1 h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default SpotCard;
