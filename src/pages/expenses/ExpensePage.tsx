import * as React from 'react'
import { Download, FileSpreadsheet, Pencil, Printer, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { exportCsv } from '@/lib/exportCsv'
import { useAuthStore } from '@/store/authStore'
import { type Expense, useExpenseStore } from '@/store/expenseStore'

const CATEGORIES = ['Rent', 'Salary', 'Transport', 'Utilities', 'Maintenance', 'Miscellaneous']
const PAGE_SIZE = 20
const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

function todayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7)
}

function displayDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function monthYear(date: Date) {
  return date.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
}

function csvRows(expenses: Expense[]) {
  return expenses.map((expense) => [
    expense.date,
    expense.category,
    expense.description,
    expense.amount,
    expense.addedBy,
  ])
}

interface SheetJsGlobal {
  utils: {
    aoa_to_sheet: (data: (string | number)[][]) => unknown
    book_new: () => unknown
    book_append_sheet: (workbook: unknown, worksheet: unknown, name: string) => void
  }
  writeFile: (workbook: unknown, filename: string) => void
}

export function ExpensePage() {
  const currentUser = useAuthStore((state) => state.currentUser)!
  const expenses = useExpenseStore((state) => state.expenses)
  const addExpense = useExpenseStore((state) => state.addExpense)
  const updateExpense = useExpenseStore((state) => state.updateExpense)
  const deleteExpense = useExpenseStore((state) => state.deleteExpense)

  const [date, setDate] = React.useState(todayInputValue())
  const [category, setCategory] = React.useState(CATEGORIES[0])
  const [description, setDescription] = React.useState('')
  const [amount, setAmount] = React.useState('')
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [sortBy, setSortBy] = React.useState<'date' | 'amount'>('date')
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc')
  const [page, setPage] = React.useState(1)

  const visibleExpenses = React.useMemo(() => {
    const scoped = currentUser.role === 'admin'
      ? expenses
      : expenses.filter((expense) => expense.addedBy === currentUser.name)

    return [...scoped].sort((a, b) => {
      const valueA = sortBy === 'date' ? new Date(a.date).getTime() : a.amount
      const valueB = sortBy === 'date' ? new Date(b.date).getTime() : b.amount
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA
    })
  }, [currentUser.name, currentUser.role, expenses, sortBy, sortDirection])

  const today = todayInputValue()
  const currentMonth = monthKey(new Date())
  const todaysExpenses = visibleExpenses
    .filter((expense) => expense.date === today)
    .reduce((sum, expense) => sum + expense.amount, 0)
  const monthlyExpenses = visibleExpenses
    .filter((expense) => expense.date.slice(0, 7) === currentMonth)
    .reduce((sum, expense) => sum + expense.amount, 0)

  const pageCount = Math.max(1, Math.ceil(visibleExpenses.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pagedExpenses = visibleExpenses.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  React.useEffect(() => {
    setPage(1)
  }, [expenses.length, sortBy, sortDirection])

  function resetForm() {
    setDate(todayInputValue())
    setCategory(CATEGORIES[0])
    setDescription('')
    setAmount('')
    setEditingId(null)
  }

  function saveExpense(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedAmount = Number(amount)

    if (!description.trim()) {
      toast.error('Description is required')
      return
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error('Amount is required')
      return
    }

    const input = {
      date,
      category,
      description: description.trim(),
      amount: parsedAmount,
      addedBy: currentUser.name,
      addedByRole: currentUser.role,
    }

    if (editingId) {
      updateExpense(editingId, input)
      toast.success('Expense updated')
    } else {
      addExpense(input)
      toast.success('Expense added')
    }

    resetForm()
  }

  function editExpense(expense: Expense) {
    setEditingId(expense.id)
    setDate(expense.date)
    setCategory(expense.category)
    setDescription(expense.description)
    setAmount(String(expense.amount))
  }

  function toggleSort(nextSort: 'date' | 'amount') {
    if (sortBy === nextSort) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(nextSort)
      setSortDirection('desc')
    }
  }

  function exportExpensesCsv(filename = 'expenses.csv') {
    exportCsv(
      filename,
      ['Date', 'Category', 'Description', 'Amount', 'Added By'],
      csvRows(visibleExpenses)
    )
  }

  function exportExcel() {
    const maybeXlsx = (window as Window & { XLSX?: SheetJsGlobal }).XLSX
    if (!maybeXlsx) {
      exportExpensesCsv('expenses.xlsx.csv')
      toast.info('Excel export is unavailable; CSV downloaded instead')
      return
    }

    const worksheet = maybeXlsx.utils.aoa_to_sheet([
      ['Date', 'Category', 'Description', 'Amount', 'Added By'],
      ...csvRows(visibleExpenses),
    ])
    const workbook = maybeXlsx.utils.book_new()
    maybeXlsx.utils.book_append_sheet(workbook, worksheet, 'Expenses')
    maybeXlsx.writeFile(workbook, 'expenses.xlsx')
    toast.success('Expenses exported')
  }

  return (
    <div className="space-y-6">
      <div className="expense-screen-only flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="page-heading">Expenses</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track daily counter and shop expenses.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button type="button" variant="outline" onClick={() => {
            exportExpensesCsv()
            toast.success('Expenses exported')
          }}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button type="button" variant="outline" onClick={exportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      <div className="expense-screen-only grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Today's expenses</p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">{INR.format(todaysExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">This month's expenses</p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">{INR.format(monthlyExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total entries</p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">{visibleExpenses.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="expense-screen-only">
        <CardHeader>
          <CardTitle className="text-base">{editingId ? 'Edit Expense' : 'Add Expense'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveExpense} className="grid gap-3 lg:grid-cols-[10rem_12rem_1fr_10rem_auto]">
            <div className="space-y-2">
              <Label htmlFor="expenseDate">Date</Label>
              <Input id="expenseDate" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expenseDescription">Description</Label>
              <Input
                id="expenseDescription"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Expense details"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expenseAmount">Amount (₹)</Label>
              <Input
                id="expenseAmount"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" className="w-full lg:w-auto">
                {editingId ? 'Save Expense' : 'Add Expense'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="expense-printable">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expense Report — {monthYear(new Date())}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>
                    <button type="button" className="expense-screen-only" onClick={() => toggleSort('date')}>Date</button>
                    <span className="expense-print-only hidden">Date</span>
                  </TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">
                    <button type="button" className="expense-screen-only" onClick={() => toggleSort('amount')}>Amount</button>
                    <span className="expense-print-only hidden">Amount</span>
                  </TableHead>
                  <TableHead>Added by</TableHead>
                  <TableHead className="expense-screen-only text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedExpenses.map((expense, index) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-mono tabular-nums">{(safePage - 1) * PAGE_SIZE + index + 1}</TableCell>
                    <TableCell>{displayDate(expense.date)}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{INR.format(expense.amount)}</TableCell>
                    <TableCell>{expense.addedBy}</TableCell>
                    <TableCell className="expense-screen-only text-right">
                      <div className="flex justify-end gap-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => editExpense(expense)} aria-label="Edit expense">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => deleteExpense(expense.id)} aria-label="Delete expense">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {pagedExpenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No expenses found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="expense-screen-only mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Page {safePage} of {pageCount}
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                  Previous
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={safePage === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
