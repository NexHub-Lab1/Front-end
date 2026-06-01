import { CircleDollarSign, RefreshCw, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '../../../components/ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../../../components/ui/card'
import { fetchMyBalance, fetchMyWalletTransactions } from '../../../lib/payment-storage'
import { formatMoney } from '../../../lib/payment-utils'
import type { BalanceResponse, WalletTransactionResponse } from '../../../types/app'

function transactionLabel(type: string) {
  switch (type) {
    case 'escrow_funded':
      return 'Reward held in escrow'
    case 'escrow_released':
      return 'Reward released'
    case 'reward_received':
      return 'Reward received'
    case 'escrow_refunded':
      return 'Reward refunded'
    default:
      return type.replaceAll('_', ' ')
  }
}

export function WalletTab() {
  const [balance, setBalance] = useState<BalanceResponse | null>(null)
  const [transactions, setTransactions] = useState<WalletTransactionResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadWallet() {
    setIsLoading(true)
    setError(null)

    try {
      const [balanceResponse, transactionsResponse] = await Promise.all([
        fetchMyBalance(),
        fetchMyWalletTransactions(),
      ])

      if (balanceResponse.status === 'error' || !balanceResponse.data) {
        throw new Error(balanceResponse.message || 'Unable to load balance.')
      }
      if (transactionsResponse.status === 'error' || !transactionsResponse.data) {
        throw new Error(transactionsResponse.message || 'Unable to load transactions.')
      }

      setBalance(balanceResponse.data)
      setTransactions(transactionsResponse.data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load wallet.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadWallet()
  }, [])

  return (
    <Card className="overflow-hidden">
      <CardBody className="space-y-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-3xl">Wallet</CardTitle>
            <CardDescription className="mt-2 text-base">
              Funds held for tasks and rewards already released to you.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadWallet()} disabled={isLoading}>
            <RefreshCw size={15} className="mr-2" />
            Refresh
          </Button>
        </div>

        {error ? (
          <Card className="border-red-100 bg-red-50/70 shadow-none">
            <CardBody className="p-4">
              <CardDescription className="text-red-700">{error}</CardDescription>
            </CardBody>
          </Card>
        ) : null}

        {isLoading && !balance ? (
          <Card className="shadow-none">
            <CardBody className="p-6 text-center">
              <CardDescription>Loading wallet...</CardDescription>
            </CardBody>
          </Card>
        ) : balance ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-green-100 bg-green-50/50 shadow-none">
                <CardBody className="space-y-2 p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                    <CircleDollarSign size={16} />
                    Available balance
                  </div>
                  <CardTitle className="text-3xl">{formatMoney(balance.availableBalance, 'ARS')}</CardTitle>
                </CardBody>
              </Card>
              <Card className="border-blue-100 bg-blue-50/50 shadow-none">
                <CardBody className="space-y-2 p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                    <ShieldCheck size={16} />
                    Held in escrow
                  </div>
                  <CardTitle className="text-3xl">{formatMoney(balance.escrowBalance, 'ARS')}</CardTitle>
                </CardBody>
              </Card>
            </div>

            <section className="space-y-3">
              <CardTitle className="text-xl">Activity</CardTitle>
              {transactions.length === 0 ? (
                <Card className="shadow-none">
                  <CardBody className="p-5">
                    <CardDescription>No wallet movements yet.</CardDescription>
                  </CardBody>
                </Card>
              ) : (
                <div className="max-h-[25rem] space-y-3 overflow-y-auto pr-1">
                  {transactions.map((transaction) => (
                    <Card key={transaction.id} className="shadow-none">
                      <CardBody className="flex items-center justify-between gap-4 p-4">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">{transactionLabel(transaction.type)}</p>
                          <CardDescription className="truncate">
                            {transaction.taskTitle} · {new Date(transaction.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <p className="shrink-0 font-semibold text-slate-900">
                          {formatMoney(transaction.amount, transaction.currency)}
                        </p>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </CardBody>
    </Card>
  )
}
