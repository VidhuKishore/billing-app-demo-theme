import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { GODOWNS_SEED } from '@/lib/constants'
import { useInventoryStore } from '@/store/inventoryStore'
import type { PurchaseBill, Role, Section } from '@/types'
import { SECTION_ACCESS } from '@/types'

const MAIN_GODOWN_ID = GODOWNS_SEED[0]?.id ?? 'gd-1'

interface PurchaseDraft {
  vendorName: string
  date: string
  section: Section
  godownId: string
  imageUrl?: string
  items: PurchaseBill['items']
  createdBy: string
}

const SEED_PURCHASES: PurchaseBill[] = [
  {
    id: 'pur-01',
    voucherNumber: 'PUR-2026-0001',
    vendorName: 'Sri Balaji Plywoods',
    date: '2026-05-03T10:20:00.000Z',
    section: 'glass',
    godownId: 'gd-1',
    imageUrl: undefined,
    items: [
      { productId: 'p-02', productName: '12mm Commercial Plywood', quantity: 8, unit: 'sheet', godownId: 'gd-1', unitPrice: 1725, subtotal: 13800 },
      { productId: '', productName: 'Designer Laminate Sheet', quantity: 12, unit: 'sheet', godownId: 'gd-1', unitPrice: 410, subtotal: 4920 },
    ],
    subtotal: 18720,
    total: 18720,
    createdBy: 'u-1',
    createdAt: '2026-05-03T10:20:00.000Z',
    printedAt: '2026-05-03T10:45:00.000Z',
  },
  {
    id: 'pur-02',
    voucherNumber: 'PUR-2026-0002',
    vendorName: 'Metro Hardware Supply',
    date: '2026-05-08T12:10:00.000Z',
    section: 'plywood',
    godownId: 'gd-3',
    items: [
      { productId: 'p-09', productName: '2.5" Wood Screws', quantity: 20, unit: 'box', godownId: 'gd-3', unitPrice: 112, subtotal: 2240 },
      { productId: 'p-13', productName: 'L-Brackets', quantity: 100, unit: 'pcs', godownId: 'gd-3', unitPrice: 22, subtotal: 2200 },
    ],
    subtotal: 4440,
    total: 4440,
    createdBy: 'u-1',
    createdAt: '2026-05-08T12:10:00.000Z',
    printedAt: '2026-05-08T12:28:00.000Z',
  },
  {
    id: 'pur-03',
    voucherNumber: 'PUR-2026-0003',
    vendorName: 'Kaveri Plumbing Traders',
    date: '2026-05-11T09:30:00.000Z',
    section: 'plumbing',
    godownId: 'gd-5',
    items: [
      { productId: 'p-16', productName: '1" PVC Pipe', quantity: 25, unit: 'length', godownId: 'gd-5', unitPrice: 112, subtotal: 2800 },
      { productId: '', productName: 'PVC Coupler 1"', quantity: 80, unit: 'pcs', godownId: 'gd-5', unitPrice: 9, subtotal: 720 },
    ],
    subtotal: 3520,
    total: 3520,
    createdBy: 'u-2',
    createdAt: '2026-05-11T09:30:00.000Z',
    printedAt: '2026-05-11T09:55:00.000Z',
  },
  {
    id: 'pur-04',
    voucherNumber: 'PUR-2026-0004',
    vendorName: 'Bright Paint Depot',
    date: '2026-05-18T15:05:00.000Z',
    section: 'painting',
    godownId: 'gd-2',
    items: [
      { productId: 'p-27', productName: 'Wall Putty 20kg', quantity: 15, unit: 'bag', godownId: 'gd-2', unitPrice: 500, subtotal: 7500 },
    ],
    subtotal: 7500,
    total: 7500,
    createdBy: 'u-2',
    createdAt: '2026-05-18T15:05:00.000Z',
    printedAt: null,
  },
  {
    id: 'pur-05',
    voucherNumber: 'PUR-2026-0005',
    vendorName: 'South Star Electricals',
    date: '2026-05-19T11:40:00.000Z',
    section: 'electrical',
    godownId: 'gd-4',
    items: [
      { productId: 'p-38', productName: '20W Tube Light', quantity: 24, unit: 'pcs', godownId: 'gd-4', unitPrice: 132, subtotal: 3168 },
      { productId: '', productName: 'Ceiling Rose', quantity: 50, unit: 'pcs', godownId: 'gd-4', unitPrice: 18, subtotal: 900 },
    ],
    subtotal: 4068,
    total: 4068,
    createdBy: 'u-2',
    createdAt: '2026-05-19T11:40:00.000Z',
    printedAt: null,
  },
]

function getPrimaryGodownId(items: PurchaseBill['items']) {
  const counts = new Map<string, number>()

  for (const item of items) {
    counts.set(item.godownId, (counts.get(item.godownId) ?? 0) + 1)
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? items[0]?.godownId ?? MAIN_GODOWN_ID
}

function normalizePurchase(purchase: PurchaseBill): PurchaseBill {
  const items = purchase.items.map((item) => ({
    ...item,
    godownId: item.godownId || MAIN_GODOWN_ID,
  }))

  return {
    ...purchase,
    godownId: getPrimaryGodownId(items),
    items,
  }
}

interface PurchaseState {
  purchases: PurchaseBill[]
  _nextCounter: number
  addPurchase: (draft: PurchaseDraft) => string
  getPurchase: (id: string) => PurchaseBill | undefined
  getPurchasesForRole: (role: Role) => PurchaseBill[]
  applyAndPrint: (id: string) => void
}

export const usePurchaseStore = create<PurchaseState>()(
  persist(
    (set, get) => ({
      purchases: SEED_PURCHASES,
      _nextCounter: 6,

      addPurchase: (draft) => {
        const counter = get()._nextCounter
        const year = new Date(draft.date).getFullYear()
        const voucherNumber = `PUR-${year}-${String(counter).padStart(4, '0')}`
        const now = new Date().toISOString()
        const items = draft.items.map((item) => ({
          ...item,
          godownId: item.godownId || MAIN_GODOWN_ID,
          subtotal: item.quantity * item.unitPrice,
        }))
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
        const id = crypto.randomUUID()
        const primaryGodownId = getPrimaryGodownId(items)

        const bill: PurchaseBill = {
          id,
          voucherNumber,
          vendorName: draft.vendorName,
          date: draft.date,
          section: draft.section,
          godownId: primaryGodownId,
          imageUrl: draft.imageUrl,
          items,
          subtotal,
          total: subtotal,
          createdBy: draft.createdBy,
          createdAt: now,
          printedAt: null,
        }

        set((state) => ({
          purchases: [...state.purchases, bill],
          _nextCounter: counter + 1,
        }))

        return id
      },

      getPurchase: (id) => get().purchases.find((purchase) => purchase.id === id),

      getPurchasesForRole: (role) => {
        const sections = SECTION_ACCESS[role]
        return get().purchases.filter((purchase) => sections.includes(purchase.section))
      },

      applyAndPrint: (id) => {
        const bill = get().getPurchase(id)
        if (!bill || bill.printedAt) return

        const inventory = useInventoryStore.getState()

        for (const item of bill.items) {
          inventory.applyPurchaseStock({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            section: bill.section,
            godownId: item.godownId,
          })
        }

        set((state) => ({
          purchases: state.purchases.map((purchase) =>
            purchase.id === id
              ? { ...purchase, printedAt: new Date().toISOString() }
              : purchase
          ),
        }))
      },
    }),
    {
      name: 'billing-app-purchases',
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as Partial<PurchaseState> | undefined

        return {
          ...state,
          purchases: (state?.purchases ?? SEED_PURCHASES).map(normalizePurchase),
          _nextCounter: state?._nextCounter ?? 6,
        } as PurchaseState
      },
    }
  )
)
