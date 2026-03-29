import apiClient from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse } from '@/api/types';
import type {
  CheckoutSession,
  ConfirmCheckoutSessionPayload,
  CreateCheckoutSessionPayload,
  CheckoutSource,
  Order,
} from '@/types/order';

interface ConfirmCheckoutSessionResponse {
  order: Order;
  checkoutSession: CheckoutSession;
}

interface CheckoutCleanupInfo {
  source: CheckoutSource;
  productIds: string[];
}

const CLEANUP_STORAGE_KEY = 'checkout-cleanup';

type CleanupMap = Record<string, CheckoutCleanupInfo>;

const readCleanupMap = (): CleanupMap => {
  if (typeof window === 'undefined') return {};

  try {
    const rawValue = window.sessionStorage.getItem(CLEANUP_STORAGE_KEY);
    if (!rawValue) return {};

    const parsedValue = JSON.parse(rawValue) as unknown;
    return typeof parsedValue === 'object' && parsedValue !== null
      ? (parsedValue as CleanupMap)
      : {};
  } catch {
    return {};
  }
};

const writeCleanupMap = (value: CleanupMap) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(CLEANUP_STORAGE_KEY, JSON.stringify(value));
};

export const createCheckoutSession = async (
  payload: CreateCheckoutSessionPayload,
) => {
  const response = await apiClient.post<ApiResponse<CheckoutSession>>(
    ENDPOINTS.CHECKOUT_SESSIONS.BASE,
    payload,
  );
  return response.data.data;
};

export const getCheckoutSession = async (sessionId: string) => {
  const response = await apiClient.get<ApiResponse<CheckoutSession>>(
    ENDPOINTS.CHECKOUT_SESSIONS.BY_ID(sessionId),
  );
  return response.data.data;
};

export const confirmCheckoutSession = async (
  sessionId: string,
  payload: ConfirmCheckoutSessionPayload,
) => {
  const response =
    await apiClient.post<ApiResponse<ConfirmCheckoutSessionResponse>>(
      ENDPOINTS.CHECKOUT_SESSIONS.CONFIRM(sessionId),
      payload,
    );
  return response.data.data;
};

export const cancelCheckoutSession = async (sessionId: string) => {
  await apiClient.delete(ENDPOINTS.CHECKOUT_SESSIONS.BY_ID(sessionId));
};

export const saveCheckoutCleanup = (
  orderId: string,
  info: CheckoutCleanupInfo,
) => {
  const currentMap = readCleanupMap();
  currentMap[orderId] = info;
  writeCleanupMap(currentMap);
};

export const consumeCheckoutCleanup = (orderId: string) => {
  const currentMap = readCleanupMap();
  const value = currentMap[orderId];

  if (!value) return null;

  delete currentMap[orderId];
  writeCleanupMap(currentMap);
  return value;
};
