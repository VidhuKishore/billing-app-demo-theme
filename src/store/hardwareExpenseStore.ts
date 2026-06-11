import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface HardwareExpense {
  id: string
  srNo: number
  companyName: string
  date: string
  staffName: string
  productName: string
  amount: number
  createdAt: string
}

type HardwareExpenseInput = Omit<HardwareExpense, 'id' | 'srNo' | 'createdAt'>

interface HardwareExpenseState {
  expenses: HardwareExpense[]
  addExpense: (input: HardwareExpenseInput) => void
  updateExpense: (id: string, input: HardwareExpenseInput) => void
  deleteExpense: (id: string) => void
}

function nextSrNo(expenses: HardwareExpense[]) {
  return expenses.reduce((max, expense) => Math.max(max, expense.srNo), 0) + 1
}

export const useHardwareExpenseStore = create<HardwareExpenseState>()(
  persist(
    (set) => ({
      expenses: [],

      addExpense: (input) =>
        set((state) => ({
          expenses: [
            ...state.expenses,
            {
              ...input,
              id: crypto.randomUUID(),
              srNo: nextSrNo(state.expenses),
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateExpense: (id, input) =>
        set((state) => ({
          expenses: state.expenses.map((expense) =>
            expense.id === id ? { ...expense, ...input } : expense
          ),
        })),

      deleteExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((expense) => expense.id !== id),
        })),
    }),
    {
      name: 'sr-hardware-expense',
      version: 1,
    }
  )
)
