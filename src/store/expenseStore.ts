import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Expense {
  id: string
  date: string
  category: string
  description: string
  amount: number
  addedBy: string
  addedByRole: string
  createdAt: string
}

type ExpenseInput = Omit<Expense, 'id' | 'createdAt'>

interface ExpenseState {
  expenses: Expense[]
  addExpense: (input: ExpenseInput) => void
  updateExpense: (id: string, input: ExpenseInput) => void
  deleteExpense: (id: string) => void
}

export const useExpenseStore = create<ExpenseState>()(
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
      name: 'billing-app-expenses',
      version: 1,
    }
  )
)
