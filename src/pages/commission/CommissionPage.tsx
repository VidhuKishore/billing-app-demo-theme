import * as React from 'react'
import { Download, Eye, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { exportCsv } from '@/lib/exportCsv'
import { useAuthStore } from '@/store/authStore'
import { useBillingStore } from '@/store/billingStore'
import type { SalesBill } from '@/types'

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

function commissionValue(bill: SalesBill, key: 'H' | 'M' | 'L') {
  return bill.commission?.[key]?.trim() ?? ''
}

function hasCommission(bill: SalesBill) {
  return Boolean(commissionValue(bill, 'H') || commissionValue(bill, 'M') || commissionValue(bill, 'L'))
}

function finalAmount(bill: SalesBill) {
  return bill.total - bill.discount
}

function displayDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function CommissionPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.currentUser)!
  const bills = useBillingStore((state) => state.bills)
  const [search, setSearch] = React.useState('')

  const commissionBills = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    const scoped = currentUser.role === 'admin'
      ? bills
      : bills.filter((bill) => bill.createdBy === currentUser.id)

    return scoped
      .filter(hasCommission)
      .filter((bill) => {
        if (!query) return true
        return (
          String(bill.billNumber).includes(query) ||
          (bill.customerName ?? '').toLowerCase().includes(query)
        )
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [bills, currentUser.id, currentUser.role, search])

  const stats = React.useMemo(() => ({
    total: commissionBills.length,
    withH: commissionBills.filter((bill) => commissionValue(bill, 'H')).length,
    withMorL: commissionBills.filter((bill) => commissionValue(bill, 'M') || commissionValue(bill, 'L')).length,
  }), [commissionBills])

  function exportCommissionCsv() {
    exportCsv(
      'commission-records.csv',
      ['Bill No', 'Date', 'Customer', 'H', 'M', 'L', 'Final Amount'],
      commissionBills.map((bill) => [
        bill.billNumber,
        bill.date,
        bill.customerName ?? '',
        commissionValue(bill, 'H'),
        commissionValue(bill, 'M'),
        commissionValue(bill, 'L'),
        finalAmount(bill),
      ])
    )
    toast.success('Commission records exported')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="page-heading">Commission Records</h1>
          <p className="mt-1 text-sm text-muted-foreground">H / M / L commission entries from all bills</p>
        </div>
        <Button type="button" variant="outline" onClick={exportCommissionCsv}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total bills with commission</p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Bills with H value</p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">{stats.withH}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Bills with M or L value</p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">{stats.withMorL}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer or bill number"
              className="pl-9"
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>H</TableHead>
                  <TableHead>M</TableHead>
                  <TableHead>L</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissionBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-mono tabular-nums">{bill.billNumber}</TableCell>
                    <TableCell>{displayDate(bill.date)}</TableCell>
                    <TableCell>{bill.customerName || 'Walk-in Customer'}</TableCell>
                    <TableCell>{commissionValue(bill, 'H') || '—'}</TableCell>
                    <TableCell>{commissionValue(bill, 'M') || '—'}</TableCell>
                    <TableCell>{commissionValue(bill, 'L') || '—'}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{INR.format(finalAmount(bill))}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/billing/${bill.id}`)}
                        aria-label={`View bill ${bill.billNumber}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {commissionBills.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No commission records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
