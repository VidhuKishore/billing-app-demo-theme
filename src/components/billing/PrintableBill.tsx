import { COMPANY } from '@/lib/brand'
import { amountInWords } from '@/lib/amountInWords'
import { SECTIONS } from '@/lib/constants'
import { getUserName } from '@/lib/userSections'
import type { SalesBill } from '@/types'

const NUM = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function fmtDate(iso?: string) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`
}

function fmtDateTime(iso: string) {
  const date = new Date(iso)
  let hours = date.getHours()
  const suffix = hours >= 12 ? 'PM' : 'AM'
  hours %= 12
  if (hours === 0) hours = 12
  return `${fmtDate(iso)} ${pad(hours)}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${suffix}`
}

function qtyLabel(quantity: number, unit: string) {
  const formatted = NUM.format(quantity)
  return unit.trim().toLowerCase() === 'sq.ft' || !unit ? formatted : `${formatted} ${unit}`
}

function wordsWithoutOnly(amount: number) {
  return amountInWords(amount).replace(/\s+Only$/i, '')
}

export function PrintableBill({ bill }: { bill: SalesBill }) {
  const finalAmount = bill.total - bill.discount
  const balanceAmount = finalAmount - bill.paidAmount
  const hardPercent = bill.hardPercent ?? 0
  const hardAmount = finalAmount * hardPercent / 100
  const staffName = getUserName(bill.createdBy)
  const branchName = bill.branch || staffName
  const sectionLabel = SECTIONS.find((section) => section.key === bill.section)?.label ?? bill.section
  const estimateTitle = `${sectionLabel.toUpperCase()} ESTIMATE`
  const totalQty = bill.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="client-bill-print printable-bill bg-white p-6 font-serif text-[12px] leading-tight text-black">
      <style>
        {`
          @media print {
            @page { margin: 10mm; }
            .client-bill-print {
              background: #fff !important;
              color: #000 !important;
              box-shadow: none !important;
              text-shadow: none !important;
              font-family: Georgia, "Times New Roman", serif !important;
              padding: 0 !important;
            }
            .client-bill-print * {
              background: #fff !important;
              color: #000 !important;
              box-shadow: none !important;
              text-shadow: none !important;
            }
            .client-bill-print table,
            .client-bill-print th,
            .client-bill-print td,
            .client-bill-print .bill-border {
              border-color: #000 !important;
            }
          }
        `}
      </style>

      <header className="relative pb-2 text-center">
        <p className="text-[18px] font-bold tracking-wide">{COMPANY.name}</p>
        <p className="mt-0.5 text-[13px] font-semibold">{COMPANY.place}</p>
        <div className="mt-3 grid grid-cols-2 text-[12px]">
          <p className="text-left">{fmtDateTime(bill.date)}</p>
          <p className="text-right">{branchName}</p>
        </div>
      </header>

      <div className="bill-border border border-black py-1 text-center text-[13px] font-bold tracking-wide">
        {estimateTitle}
      </div>

      <section className="bill-border grid grid-cols-2 border-x border-b border-black text-[12px]">
        <div className="space-y-1 border-r border-black p-2">
          <p><span className="inline-block w-20">Bill No</span>: {bill.billNumber}</p>
          <p><span className="inline-block w-20">Name</span>: {bill.customerName ?? ''}</p>
          <p><span className="inline-block w-20">Address</span>: {bill.customerAddress ?? ''}</p>
        </div>
        <div className="space-y-1 p-2">
          <p><span className="inline-block w-24">Booking Date</span>: {fmtDate(bill.bookingDate)}</p>
          <p><span className="inline-block w-24">Delivery Date</span>: {fmtDate(bill.deliveryDate)}</p>
          <p>
            <span className="inline-block w-24">Transport</span>: {bill.transport ?? ''}
            {bill.transportTime ? ` / ${bill.transportTime}` : ''}
          </p>
        </div>
      </section>

      <table className="mt-3 w-full border-collapse text-[12px]">
        <thead>
          <tr>
            <th className="w-10 border border-black px-1 py-1 text-center font-bold">No.</th>
            <th className="border border-black px-2 py-1 text-left font-bold">Particulars</th>
            <th className="w-28 border border-black px-2 py-1 text-right font-bold">Qty</th>
            <th className="w-32 border border-black px-2 py-1 text-right font-bold">Amount Rs/-</th>
          </tr>
        </thead>
        <tbody>
          {bill.items.map((item, index) => (
            <tr key={`${item.productId}-${index}`}>
              <td className="border border-black px-1 py-1 text-center">{index + 1}</td>
              <td className="border border-black px-2 py-1">{item.productName}</td>
              <td className="border border-black px-2 py-1 text-right tabular-nums">
                {qtyLabel(item.quantity, item.unit)}
              </td>
              <td className="border border-black px-2 py-1 text-right tabular-nums">
                {NUM.format(item.subtotal)}
              </td>
            </tr>
          ))}
          <tr className="font-bold">
            <td colSpan={2} className="border border-black px-2 py-1 text-right">Total</td>
            <td className="border border-black px-2 py-1 text-right tabular-nums">{NUM.format(totalQty)}</td>
            <td className="border border-black px-2 py-1 text-right tabular-nums">{NUM.format(bill.subtotal)}</td>
          </tr>
        </tbody>
      </table>

      <section className="mt-3 grid grid-cols-[1fr_230px] gap-6 text-[12px]">
        <div className="pt-2 italic">
          Rupees {wordsWithoutOnly(Math.max(0, finalAmount))} Only
        </div>
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-4">
            <span>Discount</span>
            <span className="text-right tabular-nums">{NUM.format(bill.discount)}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 font-bold">
            <span>Final Amount</span>
            <span className="text-right tabular-nums">{NUM.format(finalAmount)}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <span>Paid Amount</span>
            <span className="text-right tabular-nums">{NUM.format(bill.paidAmount)}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 font-bold">
            <span>Balance Amount</span>
            <span className="text-right tabular-nums">{NUM.format(balanceAmount)}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <span>Hard(%)Amount</span>
            <span className="text-right tabular-nums">{NUM.format(hardAmount)}</span>
          </div>
        </div>
      </section>

      <footer className="mt-8 text-[12px]">
        <div className="grid grid-cols-2">
          <p>O&nbsp;&nbsp;✓&nbsp;&nbsp;{bill.billNumber}&nbsp;&nbsp;%&nbsp;&nbsp; Staff Name : {staffName}</p>
          <p />
        </div>
        <p className="mt-8 flex justify-between gap-6">
          <span>Name:....................................</span>
          <span>Sign:............................</span>
        </p>
      </footer>
    </div>
  )
}
