const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export const getPlaceDetails = async (placeId: string) => {
  if (!API_KEY) {
    throw new Error("VITE_GOOGLE_MAPS_API_KEY is not defined");
  }

  const fields = [
    "id",
    "currentOpeningHours",
    "displayName",
    "formattedAddress",
    "location",
  ].join(",");

  const url = `/place-details/${encodeURIComponent(
    placeId,
  )}?fields=${encodeURIComponent(fields)}&key=${encodeURIComponent(API_KEY)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching place details:", error);
    throw error;
  }
};
