import { format } from 'date-fns';

export const formatYearMonthDay = (date) => {
    return format(new Date(date), 'yyyy-MM-dd');
}

export const formatYear = (date) => {
    return format(new Date(date), 'yyyy');
}

export const formatDateString = (date) => {
    return format(new Date(date), 'MMMM dd, yyyy');
}
