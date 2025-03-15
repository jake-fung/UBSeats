import React, {useEffect, useState} from 'react';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import SpotCard from '@/components/SpotCard';
import SpotDetail from '@/components/SpotDetail';
import SpotMap from '@/components/SpotMap';
import ReviewCard from '@/components/ReviewCard';
import {useRecentReviews, useReviews, useStudySpots} from '@/hooks/useStudySpots';
import {Filter, StudySpot} from '@/utils/types';
import {Library, MapPin, Search} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';

const Index = () => {
  const [activeFilters, setActiveFilters] = useState<Filter>({});
  const [selectedSpot, setSelectedSpot] = useState<StudySpot | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const { toast } = useToast();
  
  const { spots: filteredSpots, isLoading, error } = useStudySpots(activeFilters);
  const { data: recentReviews = [] } = useRecentReviews();
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading study spots",
        description: "Could not load study spots data. Please try again later.",
        variant: "destructive"
      });
    }
  }, [error, toast]);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowIntro(false);
      } else {
        setShowIntro(true);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleFilterChange = (filters: Filter) => {
    setActiveFilters(filters);
  };
  
  const handleSpotSelect = (spot: StudySpot) => {
    setSelectedSpot(spot);
  };
  
  const handleCloseDetail = () => {
    setSelectedSpot(null);
  };
  
  const handleSearchChange = (query: string) => {
    if (!query) {
      setActiveFilters({ ...activeFilters, search: undefined });
      return;
    }
    
    setActiveFilters({ ...activeFilters, search: query });
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header onSearchChange={handleSearchChange} />
      
      <section className="relative h-[80vh] bg-gradient-to-b from-blue-300 to-blue-700 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://news.ubc.ca/wp-content/uploads/2024/08/53910533763_abd0ab98cc_k.jpg"
            alt="UBC Campus"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-300/20 to-blue-700/20" />
        </div>
        
        <div 
          className={`absolute inset-0 flex flex-col items-center justify-center text-center p-6 transition-opacity duration-700 ${
            showIntro ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="max-w-3xl fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Find Your Perfect <span className="text-blue-200">Study Spot</span> at UBC
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Discover libraries, cafés, quiet zones, and outdoor areas across campus. 
              Filter by amenities, noise levels, and more.
            </p>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <a 
                href="#spots"
                className="px-6 py-3 bg-white text-blue-700 rounded-lg shadow-lg hover:shadow-xl transition-shadow font-medium flex items-center"
              >
                <Library className="mr-2 h-5 w-5" />
                Browse Study Spots
              </a>
              <a 
                href="#map"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:shadow-xl hover:bg-blue-500 transition-all font-medium flex items-center"
              >
                <MapPin className="mr-2 h-5 w-5" />
                View Map
              </a>
            </div>
          </div>
        </div>
      </section>
      
      <FilterBar onFilterChange={handleFilterChange} activeFilters={activeFilters} />
      
      <main className="container max-w-7xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-gray-600">Loading study spots...</p>
          </div>
        )}
        
        {!isLoading && (
          <>
            {filteredSpots.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Study Spot</h2>
                <SpotCard 
                  spot={filteredSpots[0]} 
                  onClick={() => handleSpotSelect(filteredSpots[0])} 
                  featured={true}
                />
              </section>
            )}
            
            <section id="map" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Map View</h2>
              <SpotMap 
                spots={filteredSpots} 
                onSpotSelect={handleSpotSelect} 
                selectedSpot={selectedSpot || undefined}
                className="h-[500px]"
              />
            </section>
            
            <section id="spots" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">All Study Spots</h2>
              
              {filteredSpots.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">No study spots found</h3>
                  <p className="text-gray-500">Try adjusting your filters or search criteria</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSpots.map((spot) => (
                    <SpotCard 
                      key={spot.id} 
                      spot={spot} 
                      onClick={() => handleSpotSelect(spot)}
                    />
                  ))}
                </div>
              )}
            </section>
            
            <section id="reviews" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Reviews</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recentReviews.slice(0, 4).map(review =>
                  <ReviewCard key={review.id} review={review} />
                )}
              </div>
            </section>
          </>
        )}
      </main>
      
      <footer className="bg-gray-900 text-white py-12">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center">
                <MapPin className="h-6 w-6 text-blue-400 mr-2" />
                <h2 className="text-xl font-semibold">UBSeats</h2>
              </div>
              <p className="text-gray-400 mt-2">Find your perfect study spot at UBC</p>
            </div>
            
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8">
              <div>
                <h3 className="text-sm font-semibold uppercase text-gray-400 mb-2">Navigation</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors ">Home</a></li>
                  <li><a href="#spots" className="text-gray-300 hover:text-white transition-colors">Study Spots</a></li>
                  <li><a href="#map" className="text-gray-300 hover:text-white transition-colors">Map</a></li>
                  <li><a href="#reviews" className="text-gray-300 hover:text-white transition-colors">Reviews</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold uppercase text-gray-400 mb-2">Connect</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors">About</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Contact</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Feedback</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} UBSeats. All rights reserved.
          </div>
        </div>
      </footer>
      
      {selectedSpot && (
        <SpotDetail spot={selectedSpot} onClose={handleCloseDetail} />
      )}
    </div>
  );
};

export default Index;
