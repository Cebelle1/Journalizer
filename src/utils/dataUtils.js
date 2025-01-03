import { format } from 'date-fns';

export const formatYearMonthDay = (date) => {
    return format(new Date(date), 'yyyy-MM-dd');
}

export const formatYearMonthDayTime = (date) => {
    return format(new Date(date), 'yyyy-MM-dd HH:mm:ss');
}

export const formatTime = (date) => {
    return format(new Date(date), 'HH:mm:ss');
}

export const formatYear = (date) => {
    return format(new Date(date), 'yyyy');
}

export const formatDateString = (date) => {
    return format(new Date(date), 'MMMM dd, yyyy');
}
