import { Badge } from '@/components/ui/badge'
import { COMPANY } from '@/lib/brand'
import { GODOWNS_SEED, SECTIONS } from '@/lib/constants'
import type { PurchaseBill } from '@/types'

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function godownName(godownId: string) {
  return GODOWNS_SEED.find((godown) => godown.id === godownId)?.name ?? godownId
}

export function PrintablePurchase({ bill }: { bill: PurchaseBill }) {
  const sectionLabel = SECTIONS.find((section) => section.key === bill.section)?.label ?? bill.section
  const godownLabel = godownName(bill.godownId)

  return (
    <div className="printable-bill bg-white p-8 text-sm text-gray-800">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-lg font-bold text-center text-[#1D546D]">{COMPANY.name}</p>
          <p className="text-xs text-center text-gray-600">{COMPANY.place}</p>
          <p className="mt-0.5 text-xs text-gray-600">
            123 Mount Road, Chennai - 600 002
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs uppercase tracking-widest text-[#5F9598]">
            PURCHASE VOUCHER
          </p>
          <p className="font-mono text-lg font-bold text-[#061E29]">{bill.voucherNumber}</p>
          <p className="mt-0.5 text-xs text-gray-600">{formatDate(bill.date)}</p>
        </div>
      </div>

      <hr className="mb-6 border-gray-300" />

      <div className="mb-8 flex justify-between">
        <div>
          <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">
            Received from
          </p>
          <p className="font-bold text-gray-900">{bill.vendorName}</p>
        </div>
        <div className="text-right">
          <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">
            Section / Godown
          </p>
          <p className="text-gray-900">{sectionLabel}</p>
          <p className="text-gray-600">{godownLabel}</p>
        </div>
      </div>

      <table className="mb-6 w-full text-sm">
        <thead>
          <tr className="border-b border-gray-300 bg-gray-100 text-xs uppercase tracking-widest text-gray-600">
            <th className="py-2 text-left font-medium text-gray-600">Item</th>
            <th className="py-2 text-right font-medium text-gray-600">Qty</th>
            <th className="py-2 text-right font-medium text-gray-600">Unit price</th>
            <th className="py-2 text-right font-medium text-gray-600">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {bill.items.map((item, index) => (
            <tr key={`${item.productId}-${item.productName}-${index}`} className="border-b border-gray-200 text-gray-800 odd:bg-white even:bg-gray-50">
              <td className="py-2">
                <span>{item.productName}</span>
                <Badge variant="outline" className="ml-2 h-5 px-1.5 text-[10px]">
                  {godownName(item.godownId)}
                </Badge>
                {!item.productId && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                    new
                  </Badge>
                )}
              </td>
              <td className="py-2 text-right font-mono tabular-nums">
                {item.quantity} {item.unit}
              </td>
              <td className="py-2 text-right font-mono tabular-nums">
                {INR.format(item.unitPrice)}
              </td>
              <td className="py-2 text-right font-mono tabular-nums">
                {INR.format(item.subtotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mb-10 flex justify-end">
        <div className="w-48 space-y-1">
          <div className="flex justify-between text-sm text-gray-900">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-mono font-semibold tabular-nums">{INR.format(bill.subtotal)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-300 pt-1 font-semibold text-gray-900">
            <span>Total</span>
            <span className="font-mono tabular-nums">{INR.format(bill.total)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between border-t border-gray-300 pt-4">
        <p className="text-xs text-gray-400">Computer generated voucher</p>
        <div className="text-right">
          <div className="mb-1 w-36 border-t border-gray-300" />
          <p className="text-xs text-gray-400">Authorized signature</p>
        </div>
      </div>
    </div>
  )
}
