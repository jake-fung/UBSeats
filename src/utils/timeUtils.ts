import { StudySpot } from './types';

export const todayOpenHours = (spot: StudySpot) => {
    const now = new Date();
    const currentDay = now.getDay();
    return spot.hours.periods[currentDay]
        ? `${spot.hours.periods[currentDay].open.hour}:${spot.hours.periods[currentDay].open.minute}`
        : '00:00';
};

export const todayClosingHours = (spot: StudySpot) => {
    const now = new Date();
    const currentDay = now.getDay();
    return spot.hours.periods[currentDay]
        ? `${spot.hours.periods[currentDay].close.hour}:${spot.hours.periods[currentDay].close.minute}`
        : '00:00';
};

export const formatTimeRange = (start: string, end: string) => {
    if (start === '00:00' && end === '23:59') {
        return 'Open all day';
    } else if (start === '00:00' && end === '00:00') {
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

export const checkIfOpen24Hours = (spot: StudySpot) => {
    return spot.hours.periods.every(
        (period) =>
            period.open.hour === 0 &&
            period.open.minute === 0 &&
            period.close.hour === 23 &&
            period.close.minute === 59,
    );
};

export const todayOpeningTimeString = (spot: StudySpot) => {
    if (checkIfOpen24Hours(spot)) {
        return 'Open 24 hours';
    }
    return formatTimeRange(todayOpenHours(spot), todayClosingHours(spot));
};
