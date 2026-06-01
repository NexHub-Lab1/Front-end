import type {
  ApiResponse,
  BalanceResponse,
  PaymentResponse,
  WalletTransactionResponse,
} from '../types/app'
import { handleForbiddenResponse, readStoredUserToken } from './auth-storage'

const PAYMENT_ROOT_ENDPOINT = '/api/payments'
const FUND_TASK_ENDPOINT = (taskId: number) => `${PAYMENT_ROOT_ENDPOINT}/tasks/${taskId}/fund`
const TASK_PAYMENTS_ENDPOINT = (taskId: number) => `${PAYMENT_ROOT_ENDPOINT}/tasks/${taskId}`
const BALANCE_ENDPOINT = `${PAYMENT_ROOT_ENDPOINT}/me/balance`
const TRANSACTIONS_ENDPOINT = `${PAYMENT_ROOT_ENDPOINT}/me/transactions`

function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${readStoredUserToken()}`,
  }
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (response.status === 403) {
    handleForbiddenResponse()
  }

  return response.json()
}

export async function fundTask(taskId: number): Promise<ApiResponse<PaymentResponse>> {
  const response = await fetch(FUND_TASK_ENDPOINT(taskId), {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export async function fetchTaskPayments(taskId: number): Promise<ApiResponse<PaymentResponse[]>> {
  const response = await fetch(TASK_PAYMENTS_ENDPOINT(taskId), {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export async function fetchMyBalance(): Promise<ApiResponse<BalanceResponse>> {
  const response = await fetch(BALANCE_ENDPOINT, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}

export async function fetchMyWalletTransactions(): Promise<ApiResponse<WalletTransactionResponse[]>> {
  const response = await fetch(TRANSACTIONS_ENDPOINT, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse(response)
}
