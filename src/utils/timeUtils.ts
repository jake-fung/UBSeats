import { StudySpot } from '../supabase/schema/types';

export const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export const todayOpenHours = (spot: StudySpot) => {
  const now = new Date();
  const currentDay = dayOfWeek[now.getDay()];
  return spot.hours.periods[`${currentDay}Open`];
};

export const todayClosingHours = (spot: StudySpot) => {
  const now = new Date();
  const currentDay = dayOfWeek[now.getDay()];
  return spot.hours.periods[`${currentDay}Close`];
};

export const formatTimeRange = (start: string, end: string) => {
  if (start === '00:00:00' && end === '24:00:00') {
    return 'Open 24 Hours';
  } else if (start === '00:00:00' && end === '00:00:00') {
    return 'Closed';
  }
  return `${formatTime(start)} - ${formatTime(end)}`;
};

export const formatTime = (timeString: string) => {
  if (!timeString) return '';

  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;

  return `${displayHours}${minutes > 0 ? ':' + minutes.toString().padStart(2, '0') : ''} ${period}`;
};

export const isSpotOpenNow = (spot: StudySpot) => {
  const now = new Date();
  const currentDay = dayOfWeek[now.getDay()];
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  if (spot.hours.open24) {
    return true;
  }

  const openPeriod = spot.hours.periods[`${currentDay}Open`];
  const closePeriod = spot.hours.periods[`${currentDay}Close`];

  const [openingHour, openingMinute] = openPeriod.split(':').map(Number);
  const [closingHour, closingMinute] = closePeriod.split(':').map(Number);

  const openTime = openingHour * 60 + openingMinute;
  const closeTime = closingHour * 60 + closingMinute;
  const currentTime = currentHour * 60 + currentMinute;

  if (closeTime < openTime) {
    return currentTime >= openTime || currentTime < closeTime;
  } else {
    return currentTime >= openTime && currentTime < closeTime;
  }
};

export const todayOpeningTimeString = (spot: StudySpot) => {
  if (spot.hours.open24) {
    return 'Open 24 hours';
  }
  return formatTimeRange(todayOpenHours(spot), todayClosingHours(spot));
};
