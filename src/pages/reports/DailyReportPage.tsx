import { Download, Printer, ReceiptText } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/EmptyState'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SECTIONS } from '@/lib/constants'
import { getUserSections } from '@/lib/userSections'
import { exportCsv } from '@/lib/exportCsv'
import {
  getBillFinalAmount,
  scopeBillsForUser,
  selectBillsForDate,
} from '@/lib/reportSelectors'
import { useAuthStore } from '@/store/authStore'
import { useBillingStore } from '@/store/billingStore'
import type { SalesBill, Section } from '@/types'

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function csvDate(iso?: string) {
  return iso ? new Date(iso).toISOString().slice(0, 10) : ''
}

function displayDate(iso?: string) {
  return iso ? format(new Date(iso), 'dd/MM/yyyy') : '-'
}

function billNumber(bill: SalesBill) {
  const year = new Date(bill.date).getFullYear()
  return `INV-${year}-${String(bill.billNumber).padStart(4, '0')}`
}

function sectionLabel(sectionKey: Section) {
  return SECTIONS.find((section) => section.key === sectionKey)?.label ?? sectionKey
}

function tableTitle(sectionKey: Section) {
  return `${sectionLabel(sectionKey)} Daily Estimate`
}

export function DailyReportPage() {
  const currentUser = useAuthStore((state) => state.currentUser)!
  const bills = useBillingStore((state) => state.bills)
  const today = format(new Date(), 'yyyy-MM-dd')
  const [selectedDate, setSelectedDate] = useState(today)

  const reportDate = parseISO(selectedDate)
  const scopedBills = scopeBillsForUser(bills, currentUser)
  const dayBills = selectBillsForDate(scopedBills, reportDate)
    .sort((a, b) => a.billNumber - b.billNumber)
  const accessibleSections = SECTIONS.filter((section) => getUserSections(currentUser.id).includes(section.key))
  const groupedBills = accessibleSections
    .map((section) => ({
      section: section.key,
      bills: dayBills.filter((bill) => bill.section === section.key),
    }))
    .filter((group) => group.bills.length > 0)
  const grandTotal = dayBills.reduce((sum, bill) => sum + getBillFinalAmount(bill), 0)

  function exportDailyCsv() {
    exportCsv(
      `daily-report-${selectedDate}.csv`,
      ['No.', 'Bill No.', 'Date', 'Customer Name', 'Address', 'Grand Total'],
      dayBills.map((bill, index) => [
        index + 1,
        billNumber(bill),
        csvDate(bill.date),
        bill.customerName || bill.customerPhone,
        bill.customerAddress ?? '',
        getBillFinalAmount(bill),
      ]),
    )
    toast.success('Daily report exported')
  }

  return (
    <div className="space-y-6">
      <div className="report-screen-only flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-medium">Daily Sales Report</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {dayBills.length} bill{dayBills.length !== 1 ? 's' : ''} for {format(reportDate, 'dd MMM yyyy')} · {INR.format(grandTotal)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value || today)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Report date"
          />
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print report
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={exportDailyCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <section className="report-printable space-y-4">
        <div className="report-print-header text-center">
          <p className="text-lg font-semibold">SR PLYWOOD &amp; GLASSES</p>
          <p className="text-sm">SR PLYWOOD &amp; GLASSES · MELPURAM</p>
          <p className="mt-2 font-mono text-sm tabular-nums">{format(reportDate, 'dd MMMM yyyy')}</p>
        </div>

        <div className="space-y-6">
          {groupedBills.map((group) => {
            const sectionTotal = group.bills.reduce((sum, bill) => sum + getBillFinalAmount(bill), 0)
            return (
              <div key={group.section} className="space-y-3">
                <h2 className="text-center text-lg font-semibold text-foreground">{tableTitle(group.section)}</h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No.</TableHead>
                      <TableHead>Or. No</TableHead>
                      <TableHead>Or. Date</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">Grand Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.bills.map((bill, index) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-mono tabular-nums">{index + 1}</TableCell>
                        <TableCell className="font-mono tabular-nums">{billNumber(bill)}</TableCell>
                        <TableCell>{displayDate(bill.date)}</TableCell>
                        <TableCell>{bill.customerName || bill.customerPhone}</TableCell>
                        <TableCell>{bill.customerAddress ?? '-'}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">{INR.format(getBillFinalAmount(bill))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="font-semibold">
                      <TableCell colSpan={5}>Total</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{INR.format(sectionTotal)}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )
          })}
        </div>
        {dayBills.length === 0 && (
          <EmptyState
            icon={ReceiptText}
            title="No bills on this date"
            message="Pick another date or create a bill to populate the daily report."
            className="report-screen-only mt-4"
          />
        )}
      </section>
    </div>
  )
}
