import * as SecureStore from 'expo-secure-store';
import { connectionErrorMessage, getApiUrl } from './apiConfig';

export type User = {
  id: string;
  phone: string;
  name: string | null;
  hasDriverProfile: boolean;
  driverProfile: { carModel: string; carNumber: string } | null;
  needsName: boolean;
  needsTermsAcceptance: boolean;
};

export type RideRequest = {
  id: string;
  status: 'PENDING' | 'BOOKED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  seatsRequested?: number;
  riderFromCity?: string;
  riderToCity?: string;
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
  pickupStops?: string[];
  matchType?: 'exact' | 'viaStop' | 'partial';
  totalSeats: number;
  seatsAvailable: number;
  pricePerSeat: number;
  status: 'ACTIVE' | 'FULL' | 'CANCELLED' | 'COMPLETED';
  bookingsCount?: number;
  pendingCount?: number;
  seatsBooked?: number;
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
  seatsRequested?: number;
  riderFromCity?: string;
  riderToCity?: string;
  ride: {
    id: string;
    fromCity: string;
    toCity: string;
    date: string;
    time: string;
    pickupPoint: string;
    status: string;
    seatsAvailable: number;
    pricePerSeat?: number;
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
  acceptTerms: () =>
    api<{ user: User }>('/auth/accept-terms', { method: 'POST' }),
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

export const CitiesApi = {
  search: (q: string, signal?: AbortSignal) =>
    api<{ cities: string[] }>(
      `/cities?q=${encodeURIComponent(q)}&limit=15`,
      { auth: true, signal }
    ),
};

export const RoutesApi = {
  getPath: (fromCity: string, toCity: string, signal?: AbortSignal) =>
    api<{
      corridorFound: boolean;
      corridorId: string | null;
      intermediateCities: string[];
      driverFrom: string;
      driverTo: string;
    }>(
      `/routes/path?fromCity=${encodeURIComponent(fromCity)}&toCity=${encodeURIComponent(toCity)}`,
      { auth: true, signal }
    ),
};

export const CorridorsApi = {
  create: (body: { fromCity: string; toCity: string; cities: string[] }) =>
    api<{
      corridor: {
        id: string;
        fromCity: string;
        toCity: string;
        cities: string[];
        existing?: boolean;
      };
    }>('/corridors', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

export const RidesApi = {
  search: (fromCity: string, toCity: string, date: string) =>
    api<{ rides: Ride[] }>(
      `/rides?fromCity=${encodeURIComponent(fromCity)}&toCity=${encodeURIComponent(toCity)}&date=${encodeURIComponent(date)}`
    ),
  mine: (includePast = false) =>
    api<{ rides: Ride[] }>(
      `/rides/mine${includePast ? '?includePast=true' : ''}`
    ),
  getById: (id: string) => api<{ ride: Ride }>(`/rides/${id}`),
  create: (body: {
    fromCity: string;
    toCity: string;
    date: string;
    time: string;
    pickupPoint?: string;
    pickupStops?: string[];
    totalSeats: number;
    pricePerSeat: number;
    carModel: string;
    carNumber: string;
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
  book: (
    id: string,
    body?: { riderFromCity: string; riderToCity: string; seatsRequested?: number }
  ) =>
    api<{
      booking: {
        id: string;
        status: string;
        riderFromCity?: string;
        riderToCity?: string;
        ride: Ride;
      };
      message?: string;
    }>(`/rides/${id}/book`, {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    }),
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
