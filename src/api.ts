import * as SecureStore from 'expo-secure-store';
import { connectionErrorMessage, getApiUrl } from './apiConfig';

export type User = {
  id: string;
  phone: string;
  name: string | null;
  hasDriverProfile: boolean;
  driverProfile: { carModel: string; carNumber: string } | null;
  needsName: boolean;
};

export type RideRequest = {
  id: string;
  status: 'PENDING' | 'BOOKED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  rider: {
    id: string;
    name: string | null;
    phone: string;
  };
};

export type Ride = {
  id: string;
  fromCity: string;
  toCity: string;
  date: string;
  time: string;
  pickupPoint: string;
  totalSeats: number;
  seatsAvailable: number;
  status: 'ACTIVE' | 'FULL' | 'CANCELLED' | 'COMPLETED';
  bookingsCount?: number;
  pendingCount?: number;
  requests?: RideRequest[];
  driver: {
    id?: string;
    name: string | null;
    phone?: string;
    carModel: string;
    carNumber?: string;
  };
};

export type Booking = {
  id: string;
  status: 'PENDING' | 'BOOKED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  ride: {
    id: string;
    fromCity: string;
    toCity: string;
    date: string;
    time: string;
    pickupPoint: string;
    status: string;
    seatsAvailable: number;
    driver: {
      name: string | null;
      phone?: string;
      carModel: string;
      carNumber?: string;
    };
  };
};

async function getToken() {
  return SecureStore.getItemAsync('zippycar_token');
}

export async function setToken(token: string | null) {
  if (token) {
    await SecureStore.setItemAsync('zippycar_token', token);
  } else {
    await SecureStore.deleteItemAsync('zippycar_token');
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (auth) {
    const token = await getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${getApiUrl()}${path}`, {
      ...rest,
      headers: finalHeaders,
    });
  } catch {
    throw new ApiError(connectionErrorMessage(), 0);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      typeof data.error === 'string'
        ? data.error
        : 'Something went wrong. Try again.',
      res.status
    );
  }
  return data as T;
}

export const AuthApi = {
  devLogin: (phone: string, name?: string) =>
    api<{ token: string; user: User }>('/auth/dev-login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ phone, name }),
    }),
  firebase: (idToken: string) =>
    api<{ token: string; user: User }>('/auth/firebase', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ idToken }),
    }),
  me: () => api<{ user: User }>('/auth/me'),
  updateMe: (body: { name?: string; expoPushToken?: string | null }) =>
    api<{ user: User }>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
};

export const UsersApi = {
  saveDriverProfile: (carModel: string, carNumber: string) =>
    api<{ driverProfile: { carModel: string; carNumber: string } }>(
      '/users/driver-profile',
      {
        method: 'PUT',
        body: JSON.stringify({ carModel, carNumber }),
      }
    ),
};

export const RidesApi = {
  search: (fromCity: string, toCity: string, date: string) =>
    api<{ rides: Ride[] }>(
      `/rides?fromCity=${encodeURIComponent(fromCity)}&toCity=${encodeURIComponent(toCity)}&date=${encodeURIComponent(date)}`
    ),
  mine: () => api<{ rides: Ride[] }>('/rides/mine'),
  create: (body: {
    fromCity: string;
    toCity: string;
    date: string;
    time: string;
    pickupPoint?: string;
    totalSeats: number;
  }) =>
    api<{ ride: Ride }>('/rides', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateStatus: (id: string, status: string) =>
    api<{ ride: Ride }>(`/rides/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  book: (id: string) =>
    api<{
      booking: { id: string; status: string; ride: Ride };
      message?: string;
    }>(`/rides/${id}/book`, { method: 'POST' }),
};

export const BookingsApi = {
  mine: () => api<{ bookings: Booking[] }>('/bookings/mine'),
  cancel: (id: string) =>
    api<{ ok: boolean }>(`/bookings/${id}/cancel`, { method: 'POST' }),
  approve: (id: string) =>
    api<{ booking: { id: string; status: string }; message?: string }>(
      `/bookings/${id}/approve`,
      { method: 'POST' }
    ),
  reject: (id: string) =>
    api<{ ok: boolean }>(`/bookings/${id}/reject`, { method: 'POST' }),
};
