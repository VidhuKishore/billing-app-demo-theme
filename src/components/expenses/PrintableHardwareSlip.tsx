import { amountInWords } from '@/lib/amountInWords'
import type { HardwareExpense } from '@/store/hardwareExpenseStore'
import { cn } from '@/lib/utils'

interface PrintableHardwareSlipProps {
  expense: HardwareExpense
  className?: string
}

const NUM = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function words(amount: number) {
  return amountInWords(amount).replace(/\s+Only$/i, '')
}

function displayDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function PrintableHardwareSlip({ expense, className }: PrintableHardwareSlipProps) {
  return (
    <div
      className={cn(
        'hardware-slip w-full max-w-[720px] border border-black p-3 text-black',
        className
      )}
      style={{ backgroundColor: '#FFB6C1' }}
    >
      <div className="relative mb-2 min-h-8">
        <p className="absolute left-0 top-0 text-xs">purchase</p>
        <p className="text-center text-base font-bold tracking-wide">HARDWARE</p>
      </div>

      <div className="mb-2 grid grid-cols-[1fr_auto_1fr] gap-3 text-xs">
        <p><span className="font-bold">Company Name:</span> {expense.companyName}</p>
        <p><span className="font-bold">Date:</span> {displayDate(expense.date)}</p>
        <p><span className="font-bold">Staff Name:</span> {expense.staffName}</p>
      </div>

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="border border-black px-2 py-1 font-bold">Sr.No</th>
            <th className="border border-black px-2 py-1 font-bold">Date</th>
            <th className="border border-black px-2 py-1 font-bold">Product Name</th>
            <th className="border border-black px-2 py-1 text-right font-bold">Amount₹</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black px-2 py-1 text-center">{expense.srNo}</td>
            <td className="border border-black px-2 py-1 text-center">{displayDate(expense.date)}</td>
            <td className="border border-black px-2 py-1">{expense.productName}</td>
            <td className="border border-black px-2 py-1 text-right tabular-nums">{NUM.format(expense.amount)}</td>
          </tr>
          <tr>
            <td colSpan={3} className="border border-black px-2 py-1">
              Rupees {words(expense.amount)} Only
            </td>
            <td className="border border-black px-2 py-1">
              <div className="flex justify-between gap-3">
                <span className="font-bold">Total</span>
                <span className="tabular-nums">{NUM.format(expense.amount)}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
