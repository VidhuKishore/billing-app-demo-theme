import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { GODOWNS_SEED } from '@/lib/constants'
import { MOCK_PRODUCTS } from '@/lib/mockData'
import { useAuthStore } from '@/store/authStore'
import type { Godown, Product, Section, TransferLogEntry } from '@/types'

interface ApplyPurchaseStockInput {
  productId: string
  productName: string
  quantity: number
  unit: string
  unitPrice: number
  section: Section
  godownId: string
}

export interface ProductDefinitionInput {
  name: string
  spec?: string
  sku: string
  unit: string
  salePrice: number
  section: Section
  godownId: string
  lowStockThreshold: number
}

interface InventoryState {
  products: Product[]
  transferLog: TransferLogEntry[]
  getBySection: (section: Section) => Product[]
  getByGodown: (godownId: string, section?: Section) => Product[]
  getGodownsForSection: (section: Section) => Godown[]
  getProductCount: (section: Section, godownId: string) => number
  getLowStockCount: (section: Section, godownId: string) => number
  searchProducts: (query: string, allowedSections: Section[]) => Product[]
  addProductDefinition: (input: ProductDefinitionInput) => Product
  updateProductDefinition: (productId: string, input: ProductDefinitionInput) => void
  deleteProduct: (productId: string) => void
  decrementStock: (productId: string, qty: number) => void
  applyPurchaseStock: (input: ApplyPurchaseStockInput) => void
  transferStock: (productId: string, fromGodownId: string, toGodownId: string, qty: number) => void
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
  products: MOCK_PRODUCTS,
  transferLog: [],

  getBySection: (section) =>
    get().products.filter((p) => p.section === section),

  getByGodown: (godownId, section) =>
    get().products.filter(
      (p) => p.godownId === godownId && (section === undefined || p.section === section)
    ),

  getGodownsForSection: (section) => {
    const ids = new Set(
      get().products.filter((p) => p.section === section).map((p) => p.godownId)
    )
    return GODOWNS_SEED.filter((g) => ids.has(g.id))
  },

  getProductCount: (section, godownId) =>
    get().products.filter((p) => p.section === section && p.godownId === godownId).length,

  getLowStockCount: (section, godownId) =>
    get().products.filter(
      (p) => p.section === section && p.godownId === godownId && p.stock <= p.lowStockThreshold
    ).length,

  searchProducts: (query, allowedSections) => {
    const q = query.toLowerCase()
    return get().products.filter(
      (p) =>
        allowedSections.includes(p.section) &&
        `${p.name} ${p.sku} ${p.spec ?? ''}`.toLowerCase().includes(q)
    )
  },

  addProductDefinition: (input) => {
    const now = new Date().toISOString()
    const product: Product = {
      id: crypto.randomUUID(),
      name: input.name,
      spec: input.spec || undefined,
      sku: input.sku,
      unit: input.unit,
      hsnCode: '',
      taxRate: 18,
      section: input.section,
      godownId: input.godownId,
      stock: 0,
      costPrice: 0,
      salePrice: input.salePrice,
      lowStockThreshold: input.lowStockThreshold,
      updatedAt: now,
    }

    set((state) => ({ products: [...state.products, product] }))
    return product
  },

  updateProductDefinition: (productId, input) =>
    set((state) => ({
      products: state.products.map((product) =>
        product.id === productId
          ? {
              ...product,
              name: input.name,
              spec: input.spec || undefined,
              sku: input.sku,
              unit: input.unit,
              salePrice: input.salePrice,
              section: input.section,
              godownId: input.godownId,
              lowStockThreshold: input.lowStockThreshold,
              updatedAt: new Date().toISOString(),
            }
          : product
      ),
    })),

  deleteProduct: (productId) =>
    set((state) => ({
      products: state.products.filter((product) => product.id !== productId),
    })),

  decrementStock: (productId, qty) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId
          ? { ...p, stock: p.stock - qty, updatedAt: new Date().toISOString() }
          : p
      ),
    })),

  applyPurchaseStock: (input) =>
    set((state) => {
      const now = new Date().toISOString()

      if (input.productId) {
        return {
          products: state.products.map((product) =>
            product.id === input.productId
              ? { ...product, godownId: input.godownId, stock: product.stock + input.quantity, updatedAt: now }
              : product
          ),
        }
      }

      const product: Product = {
        id: crypto.randomUUID(),
        name: input.productName,
        sku: `NEW-${Date.now()}`,
        unit: input.unit,
        hsnCode: '',
        taxRate: 18,
        section: input.section,
        godownId: input.godownId,
        stock: input.quantity,
        costPrice: input.unitPrice,
        salePrice: input.unitPrice,
        lowStockThreshold: 5,
        updatedAt: now,
      }

      return { products: [...state.products, product] }
    }),

  transferStock: (productId, fromGodownId, toGodownId, qty) => {
    const product = get().products.find((item) => item.id === productId)
    if (!product || product.godownId !== fromGodownId) {
      throw new Error('Product is not in the selected source godown.')
    }

    if (qty <= 0 || qty > product.stock) {
      throw new Error('Transfer quantity exceeds available stock.')
    }

    const now = new Date().toISOString()
    const currentUser = useAuthStore.getState().currentUser

    set((state) => ({
      products: state.products.map((item) =>
        item.id === productId
          ? { ...item, godownId: toGodownId, updatedAt: now }
          : item
      ),
      transferLog: [
        ...state.transferLog,
        {
          id: crypto.randomUUID(),
          productId,
          productName: product.name,
          fromGodownId,
          toGodownId,
          qty,
          transferredAt: now,
          transferredBy: currentUser?.name ?? 'Unknown',
        },
      ],
    }))
  },
}),
    {
      name: 'billing-app-inventory',
      version: 2,
      migrate: (persistedState) => ({
        ...(persistedState as InventoryState),
        transferLog: (persistedState as Partial<InventoryState> | undefined)?.transferLog ?? [],
      }),
    }
  )
)
