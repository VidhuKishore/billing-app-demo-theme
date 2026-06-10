import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { BillStatus, CreateBillInput, SalesBill } from '@/types'

function getBillStatus(total: number, discount: number, paidAmount: number): BillStatus {
  const finalAmount = Math.max(total - discount, 0)
  if (paidAmount >= finalAmount) return 'paid'
  if (paidAmount > 0) return 'partial'
  return 'pending'
}

// ── 10 historical bills for demo richness ─────────────────────────────────────
const SEED_BILLS: SalesBill[] = [
  {
    id: 'bill-01', billNumber: 1, date: '2026-04-21T10:15:00.000Z',
    customerName: 'Rajesh Kumar', customerAddress: '12 Gandhi Nagar, Melpuram',
    customerPhone: '+91 98765 10001', section: 'glass',
    bookingDate: '2026-04-20', deliveryDate: '2026-04-25',
    transport: 'Own vehicle', transportTime: '10 AM',
    items: [
      { productId: 'p-01', productName: '18mm Marine Plywood', quantity: 2, unit: 'sheet', glassSize: '8×4 ft', model: 'BWR', sqFt: 64, unitPrice: 100, subtotal: 6400 },
      { productId: 'p-05', productName: '8mm Toughened Glass',  quantity: 1, unit: 'sheet', glassSize: '4×3 ft', model: 'Clear', sqFt: 13, unitPrice: 400, subtotal: 5200 },
    ],
    subtotal: 11600, total: 11600, discount: 200, paidAmount: 10000, status: 'partial',
    createdBy: 'u-1', createdAt: '2026-04-21T10:15:00.000Z',
  },
  {
    id: 'bill-02', billNumber: 2, date: '2026-04-23T14:30:00.000Z',
    customerName: 'Suresh Nair', customerPhone: '+91 94432 20002', section: 'plywood',
    items: [
      { productId: 'p-09', productName: '2.5" Wood Screws',  quantity: 5, unit: 'box',  unitPrice: 145, subtotal: 725 },
      { productId: 'p-11', productName: '4" SS Door Hinges', quantity: 4, unit: 'pair', unitPrice: 220, subtotal: 880 },
    ],
    subtotal: 1605, total: 1605, discount: 0, paidAmount: 1605, status: 'paid',
    createdBy: 'u-1', createdAt: '2026-04-23T14:30:00.000Z',
  },
  {
    id: 'bill-03', billNumber: 3, date: '2026-04-26T09:00:00.000Z',
    customerName: 'Priya Menon', customerPhone: '+91 87654 30003', section: 'plumbing',
    items: [
      { productId: 'p-16', productName: '1" PVC Pipe',  quantity: 10, unit: 'length', unitPrice: 145, subtotal: 1450 },
      { productId: 'p-19', productName: 'PVC Elbow 1"', quantity: 20, unit: 'pcs',    unitPrice: 18,  subtotal: 360  },
    ],
    subtotal: 1810, total: 1810, discount: 0, paidAmount: 1500, status: 'partial',
    createdBy: 'u-2', createdAt: '2026-04-26T09:00:00.000Z',
  },
  {
    id: 'bill-04', billNumber: 4, date: '2026-04-29T11:20:00.000Z',
    customerName: 'Anand Krishnan', customerPhone: '+91 90000 40004', section: 'painting',
    items: [
      { productId: 'p-24', productName: 'Asian Paints Apex 4L', quantity: 3, unit: 'tin', unitPrice: 1680, subtotal: 5040 },
      { productId: 'p-26', productName: 'White Primer 4L',       quantity: 2, unit: 'tin', unitPrice: 580,  subtotal: 1160 },
    ],
    subtotal: 6200, total: 6200, discount: 100, paidAmount: 6100, status: 'paid',
    createdBy: 'u-2', createdAt: '2026-04-29T11:20:00.000Z',
  },
  {
    id: 'bill-05', billNumber: 5, date: '2026-05-02T15:45:00.000Z',
    customerPhone: '+91 99887 50005', section: 'glass',
    bookingDate: '2026-05-01', deliveryDate: '2026-05-05',
    items: [
      { productId: 'p-02', productName: '12mm Commercial Plywood', quantity: 6, unit: 'sheet', glassSize: '7×4 ft', model: 'MR', sqFt: 126, unitPrice: 100, subtotal: 12600 },
      { productId: 'p-07', productName: 'Laminated Sunmica',       quantity: 10, unit: 'sheet', glassSize: '9×2 ft', model: 'Teak',   sqFt: 90,  unitPrice: 50,  subtotal: 4500  },
    ],
    subtotal: 17100, total: 17100, discount: 0, paidAmount: 15000, status: 'partial',
    createdBy: 'u-1', createdAt: '2026-05-02T15:45:00.000Z',
  },
  {
    id: 'bill-06', billNumber: 6, date: '2026-05-06T10:00:00.000Z',
    customerName: 'Deepa Raman', customerPhone: '+91 96543 60006', section: 'electrical',
    items: [
      { productId: 'p-34', productName: '6A Modular Switch',  quantity: 20, unit: 'pcs', unitPrice: 75,  subtotal: 1500 },
      { productId: 'p-35', productName: '16A Modular Socket', quantity: 10, unit: 'pcs', unitPrice: 115, subtotal: 1150 },
      { productId: 'p-37', productName: '9W LED Bulb',        quantity: 15, unit: 'pcs', unitPrice: 95,  subtotal: 1425 },
    ],
    subtotal: 4075, total: 4075, discount: 0, paidAmount: 4075, status: 'paid',
    createdBy: 'u-2', createdAt: '2026-05-06T10:00:00.000Z',
  },
  {
    id: 'bill-07', billNumber: 7, date: '2026-05-09T13:15:00.000Z',
    customerName: 'Balaji Iyer', customerPhone: '+91 88776 70007', section: 'plywood',
    items: [
      { productId: 'p-12', productName: 'Cabinet Locks', quantity: 12, unit: 'pcs', unitPrice: 120, subtotal: 1440 },
      { productId: 'p-13', productName: 'L-Brackets',    quantity: 30, unit: 'pcs', unitPrice: 35,  subtotal: 1050 },
    ],
    subtotal: 2490, total: 2490, discount: 90, paidAmount: 2000, status: 'partial',
    createdBy: 'u-1', createdAt: '2026-05-09T13:15:00.000Z',
  },
  {
    id: 'bill-08', billNumber: 8, date: '2026-05-14T09:30:00.000Z',
    customerName: 'Kavitha Sundaram', customerPhone: '+91 91234 80008', section: 'plumbing',
    items: [
      { productId: 'p-22', productName: '1" Ball Valve',       quantity: 4, unit: 'pcs', unitPrice: 220, subtotal: 880 },
      { productId: 'p-23', productName: 'Water Tank Fittings', quantity: 2, unit: 'set', unitPrice: 390, subtotal: 780 },
    ],
    subtotal: 1660, total: 1660, discount: 0, paidAmount: 1660, status: 'paid',
    createdBy: 'u-2', createdAt: '2026-05-14T09:30:00.000Z',
  },
  {
    id: 'bill-09', billNumber: 9, date: '2026-05-17T14:00:00.000Z',
    customerName: 'Murugan P.', customerAddress: '45 Lake View, Thoothukudi',
    customerPhone: '+91 77665 90009', section: 'glass',
    bookingDate: '2026-05-16', deliveryDate: '2026-05-20',
    transport: 'Lorry', transportTime: '2 PM',
    items: [
      { productId: 'p-03', productName: '9mm MDF Board', quantity: 5, unit: 'sheet', glassSize: '8×3 ft', model: 'Plain', sqFt: 75, unitPrice: 110, subtotal: 8250 },
      { productId: 'p-08', productName: 'Veneer Sheets',  quantity: 8, unit: 'sheet', glassSize: '4×2.5 ft', model: 'Oak', sqFt: 80, unitPrice: 62, subtotal: 4960 },
    ],
    subtotal: 13210, total: 13210, discount: 210, paidAmount: 7000, status: 'partial',
    createdBy: 'u-1', createdAt: '2026-05-17T14:00:00.000Z',
  },
  {
    id: 'bill-10', billNumber: 10, date: '2026-05-19T11:45:00.000Z',
    customerName: 'Saranya V.', customerPhone: '+91 82345 00010', section: 'painting',
    items: [
      { productId: 'p-25', productName: 'Asian Paints Royale 4L', quantity: 2, unit: 'tin', unitPrice: 2550, subtotal: 5100 },
      { productId: 'p-27', productName: 'Wall Putty 20kg',         quantity: 3, unit: 'bag', unitPrice: 640,  subtotal: 1920 },
      { productId: 'p-28', productName: '2" Paint Brush',          quantity: 5, unit: 'pcs', unitPrice: 60,   subtotal: 300  },
    ],
    subtotal: 7320, total: 7320, discount: 20, paidAmount: 7300, status: 'paid',
    createdBy: 'u-2', createdAt: '2026-05-19T11:45:00.000Z',
  },
]

interface BillingState {
  bills: SalesBill[]
  _nextCounter: number
  createBill: (input: CreateBillInput) => SalesBill
  getBillById: (id: string) => SalesBill | undefined
  getBillsByDateRange: (start: string, end: string) => SalesBill[]
  getTodaysBills: (userId?: string) => SalesBill[]
  getBillsByUser: (userId: string) => SalesBill[]
}

export const useBillingStore = create<BillingState>()(
  persist(
    (set, get) => ({
      bills: SEED_BILLS,
      _nextCounter: 11,

      createBill: (input) => {
        const counter = get()._nextCounter
        const billNumber = counter
        const now = new Date().toISOString()
        const items = input.items.map((item) => ({
          ...item,
          subtotal: item.sqFt && item.sqFt > 0
            ? item.sqFt * item.unitPrice
            : item.quantity * item.unitPrice,
        }))
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
        const bill: SalesBill = {
          id: crypto.randomUUID(),
          billNumber,
          date: now,
          customerName:    input.customerName,
          customerAddress: input.customerAddress,
          customerPhone:   input.customerPhone,
          bookingDate:     input.bookingDate,
          deliveryDate:    input.deliveryDate,
          transport:       input.transport,
          transportTime:   input.transportTime,
          section:         input.section,
          items,
          subtotal,
          total:           subtotal,
          discount:        input.discount  ?? 0,
          paidAmount:      input.paidAmount ?? 0,
          hardPercent:     input.hardPercent ?? 0,
          branch:          input.branch,
          status:          getBillStatus(subtotal, input.discount ?? 0, input.paidAmount ?? 0),
          createdBy:       input.createdBy,
          createdAt:       now,
        }
        set((state) => ({ bills: [...state.bills, bill], _nextCounter: counter + 1 }))
        return bill
      },

      getBillById: (id) => get().bills.find((b) => b.id === id),

      getBillsByDateRange: (start, end) => {
        const s = new Date(start).getTime()
        const e = new Date(end).getTime()
        return get().bills.filter((b) => {
          const t = new Date(b.date).getTime()
          return t >= s && t <= e
        })
      },

      getTodaysBills: (userId) => {
        const today = new Date().toDateString()
        return get().bills.filter((b) => {
          const sameDay = new Date(b.date).toDateString() === today
          return sameDay && (userId === undefined || b.createdBy === userId)
        })
      },

      getBillsByUser: (userId) => get().bills.filter((b) => b.createdBy === userId),
    }),
    {
      name: 'billing-app-bills',
      version: 3,
      migrate: (persisted: unknown) => {
        const state = persisted as { bills?: unknown[]; _nextCounter?: number }
        state.bills = ((state.bills ?? []) as Record<string, unknown>[]).map((bill) => {
          const total    = typeof bill.total    === 'number' ? bill.total    : (typeof bill.subtotal === 'number' ? bill.subtotal : 0)
          const subtotal = typeof bill.subtotal === 'number' ? bill.subtotal : total
          const discount = typeof bill.discount === 'number' ? bill.discount : 0
          const paidAmount = typeof bill.paidAmount === 'number' ? bill.paidAmount : 0
          const billNumber = typeof bill.billNumber === 'number'
            ? bill.billNumber
            : Number(String(bill.billNumber ?? '').match(/\d+$/)?.[0] ?? 0)
          return {
            ...bill,
            billNumber,
            section: bill.section === 'hardware' ? 'plywood' : bill.section,
            total,
            subtotal,
            discount,
            paidAmount,
            hardPercent: typeof bill.hardPercent === 'number' ? bill.hardPercent : 0,
            branch: typeof bill.branch === 'string' ? bill.branch : undefined,
            status: typeof bill.status === 'string'
              ? bill.status
              : getBillStatus(total, discount, paidAmount),
            items: ((bill.items ?? []) as Record<string, unknown>[]).map((item) => {
              const qty   = typeof item.quantity  === 'number' ? item.quantity  : 0
              const price = typeof item.unitPrice === 'number' ? item.unitPrice : 0
              const sqFt  = typeof item.sqFt      === 'number' ? item.sqFt      : 0
              return {
                ...item,
                quantity:  qty,
                unitPrice: price,
                subtotal:  typeof item.subtotal === 'number'
                  ? item.subtotal
                  : sqFt > 0 ? sqFt * price : qty * price,
              }
            }),
          }
        })
        return state
      },
    }
  )
)
