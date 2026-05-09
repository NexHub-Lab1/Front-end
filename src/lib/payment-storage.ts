import type {
  ApiResponse,
  BalanceResponse,
  PaymentResponse,
  PaymentSimulationRequest,
  TaskPaymentRequest,
  WalletTransactionResponse,
} from '../types/app'
import { handleForbiddenResponse, readStoredUserToken } from './auth-storage'

const PAYMENT_ROOT_ENDPOINT = '/api/payments'
export const CREATE_TASK_PAYMENT_ENDPOINT = PAYMENT_ROOT_ENDPOINT + '/task'
export const SIMULATE_PAYMENT_ENDPOINT = PAYMENT_ROOT_ENDPOINT + '/simulate'
export const PAYMENT_BY_ID_ENDPOINT = (id: number) => PAYMENT_ROOT_ENDPOINT + `/${id}`
export const PAYMENTS_BY_TASK_ENDPOINT = (taskId: number) => PAYMENT_ROOT_ENDPOINT + `/task/${taskId}`
export const PAYMENTS_BY_USER_ENDPOINT = (userId: number) => PAYMENT_ROOT_ENDPOINT + `/user/${userId}`
export const USER_BALANCE_ENDPOINT = (userId: number) => PAYMENT_ROOT_ENDPOINT + `/balance/${userId}`
export const USER_WALLET_TRANSACTIONS_ENDPOINT = (userId: number) =>
  PAYMENT_ROOT_ENDPOINT + `/wallet-transactions/user/${userId}`

function getAuthHeaders(): HeadersInit {
  const token = readStoredUserToken()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (response.status === 403) {
    handleForbiddenResponse()
  }

  return response.json() as Promise<ApiResponse<T>>
}

export async function createTaskPayment(
  payment: TaskPaymentRequest,
): Promise<ApiResponse<PaymentResponse>> {
  const response = await fetch(CREATE_TASK_PAYMENT_ENDPOINT, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payment),
  })
  return handleResponse(response)
}

export async function simulatePaymentResult(
  payment: PaymentSimulationRequest,
): Promise<ApiResponse<PaymentResponse>> {
  const response = await fetch(SIMULATE_PAYMENT_ENDPOINT, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payment),
  })
  return handleResponse(response)
}

export async function fetchPaymentsByTask(taskId: number): Promise<ApiResponse<PaymentResponse[]>> {
  const response = await fetch(PAYMENTS_BY_TASK_ENDPOINT(taskId), {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export async function fetchUserBalance(userId: number): Promise<ApiResponse<BalanceResponse>> {
  const response = await fetch(USER_BALANCE_ENDPOINT(userId), {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export async function fetchUserWalletTransactions(
  userId: number,
): Promise<ApiResponse<WalletTransactionResponse[]>> {
  const response = await fetch(USER_WALLET_TRANSACTIONS_ENDPOINT(userId), {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}
