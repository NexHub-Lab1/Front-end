import { CircleDollarSign, RefreshCw, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '../../../components/ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../../../components/ui/card'
import { readStoredUser } from '../../../lib/auth-storage'
import { fetchUserBalance, fetchUserWalletTransactions } from '../../../lib/payment-storage'
import { formatMoney } from '../../../lib/payment-utils'
import type { BalanceResponse, WalletTransactionResponse } from '../../../types/app'

function transactionTone(type: string) {
  if (type.includes('received') || type.includes('refunded')) {
    return 'text-green-700'
  }

  if (type.includes('released')) {
    return 'text-red-700'
  }

  return 'text-blue-700'
}

export function WalletTab() {
  const currentUser = readStoredUser()
  const [balance, setBalance] = useState<BalanceResponse | null>(null)
  const [transactions, setTransactions] = useState<WalletTransactionResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  async function loadWallet() {
    if (!currentUser) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setLoadError(null)

      const [balanceResponse, transactionsResponse] = await Promise.all([
        fetchUserBalance(currentUser.id),
        fetchUserWalletTransactions(currentUser.id),
      ])

      if (balanceResponse.status === 'success' && balanceResponse.data) {
        setBalance(balanceResponse.data)
      } else {
        setLoadError(balanceResponse.message || 'Unable to load balance.')
      }

      if (transactionsResponse.status === 'success' && transactionsResponse.data) {
        setTransactions(transactionsResponse.data)
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load wallet.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadWallet()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardBody className="space-y-3 p-6">
          <CardTitle className="text-2xl">Wallet</CardTitle>
          <CardDescription>Loading your balance...</CardDescription>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardBody className="flex h-full max-h-full flex-col gap-6 p-6">
        <section className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-3xl">Wallet</CardTitle>
            <CardDescription className="mt-2 text-base">
              Track rewards available to withdraw and task rewards currently held in escrow.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadWallet()}>
            <RefreshCw size={14} />
            Refresh
          </Button>
        </section>

        {loadError ? (
          <Card className="border-red-100 bg-red-50/70 shadow-none">
            <CardBody className="p-4">
              <CardDescription className="text-red-700">{loadError}</CardDescription>
            </CardBody>
          </Card>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-none">
            <CardBody className="space-y-3 p-5">
              <div className="flex items-center gap-2 text-green-700">
                <CircleDollarSign size={18} />
                <p className="text-sm font-semibold uppercase tracking-wide">Available</p>
              </div>
              <CardTitle className="text-3xl">
                {formatMoney(balance?.availableBalance ?? 0)}
              </CardTitle>
              <CardDescription>Rewards released to you after approved submissions.</CardDescription>
            </CardBody>
          </Card>

          <Card className="shadow-none">
            <CardBody className="space-y-3 p-5">
              <div className="flex items-center gap-2 text-blue-700">
                <ShieldCheck size={18} />
                <p className="text-sm font-semibold uppercase tracking-wide">Escrow</p>
              </div>
              <CardTitle className="text-3xl">
                {formatMoney(balance?.escrowBalance ?? 0)}
              </CardTitle>
              <CardDescription>Task rewards funded by you and waiting for approval.</CardDescription>
            </CardBody>
          </Card>
        </section>

        <section className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          <div>
            <CardTitle className="text-xl">Transactions</CardTitle>
            <CardDescription className="mt-1">Internal ledger movements from payments and rewards.</CardDescription>
          </div>

          {transactions.length === 0 ? (
            <Card className="shadow-none">
              <CardBody className="p-6 text-center">
                <CardDescription>No wallet transactions yet.</CardDescription>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <Card key={transaction.id} className="shadow-none">
                  <CardBody className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">
                        {transaction.description || transaction.type}
                      </p>
                      <CardDescription className="mt-1">
                        {transaction.taskTitle || 'Wallet movement'} · {new Date(transaction.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="text-left md:text-right">
                      <p className={`font-semibold ${transactionTone(transaction.type)}`}>
                        {formatMoney(transaction.amount, transaction.currency)}
                      </p>
                      <CardDescription>
                        Available {formatMoney(transaction.availableBalanceAfter, transaction.currency)}
                      </CardDescription>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </section>
      </CardBody>
    </Card>
  )
}
