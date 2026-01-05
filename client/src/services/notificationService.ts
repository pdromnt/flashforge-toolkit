export interface Notification {
  type: string;
  data: any;
  timestamp: number;
}

const getApiUrl = (endpoint: string) => {
  if (import.meta.env.MODE === 'development') {
    return `http://localhost:3000${endpoint}`;
  }
  return endpoint;
};

export const checkNotification = async (): Promise<Notification | null> => {
  const apiUrl = getApiUrl('/notifications');
  const res = await fetch(apiUrl);
  if (res.ok) {
    return await res.json();
  }
  return null;
};

export const sendResponse = async (answer: 'yes' | 'no'): Promise<void> => {
  const apiUrl = getApiUrl('/notifications/response');
  await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ response: answer })
  });
};
