export const formatGatewayTime = (value: string): string => {
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
