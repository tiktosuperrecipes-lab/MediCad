export const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateShort = (dateStr: string | undefined) => {
  if (!dateStr) return '-';
  // If it's an ISO string (contains T), just take the date part
  const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const [year, month, day] = cleanDate.split('-').map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
};

export const formatDateLong = (dateStr: string | undefined) => {
  if (!dateStr) return '-';
  const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const [year, month, day] = cleanDate.split('-').map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};
