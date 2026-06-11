import * as React from 'react'
import { Download, Eye, Pencil, Plus, Printer, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { PrintableHardwareSlip } from '@/components/expenses/PrintableHardwareSlip'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { exportCsv } from '@/lib/exportCsv'
import { useAuthStore } from '@/store/authStore'
import {
  type HardwareExpense,
  useHardwareExpenseStore,
} from '@/store/hardwareExpenseStore'

interface HardwareExpenseForm {
  companyName: string
  date: string
  staffName: string
  productName: string
  amount: string
}

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
})

function todayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function displayDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function emptyForm(staffName: string): HardwareExpenseForm {
  return {
    companyName: '',
    date: todayInputValue(),
    staffName,
    productName: '',
    amount: '',
  }
}

export function HardwareExpensePage() {
  const currentUser = useAuthStore((state) => state.currentUser)!
  const expenses = useHardwareExpenseStore((state) => state.expenses)
  const addExpense = useHardwareExpenseStore((state) => state.addExpense)
  const updateExpense = useHardwareExpenseStore((state) => state.updateExpense)
  const deleteExpense = useHardwareExpenseStore((state) => state.deleteExpense)

  const [formOpen, setFormOpen] = React.useState(false)
  const [editingExpense, setEditingExpense] = React.useState<HardwareExpense | null>(null)
  const [previewExpense, setPreviewExpense] = React.useState<HardwareExpense | null>(null)
  const [selectedForPrint, setSelectedForPrint] = React.useState<HardwareExpense | null>(null)
  const [form, setForm] = React.useState<HardwareExpenseForm>(() => emptyForm(currentUser.name))

  const visibleExpenses = React.useMemo(
    () =>
      currentUser.role === 'admin'
        ? expenses
        : expenses.filter((expense) => expense.staffName === currentUser.name),
    [currentUser.name, currentUser.role, expenses]
  )

  const totalAmount = visibleExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  function openAddForm() {
    setEditingExpense(null)
    setForm(emptyForm(currentUser.name))
    setFormOpen(true)
  }

  function openEditForm(expense: HardwareExpense) {
    setEditingExpense(expense)
    setForm({
      companyName: expense.companyName,
      date: expense.date,
      staffName: expense.staffName,
      productName: expense.productName,
      amount: String(expense.amount),
    })
    setFormOpen(true)
  }

  function saveExpense() {
    const amount = Number(form.amount)

    if (!form.companyName.trim() || !form.productName.trim()) {
      toast.error('Company name and product name are required')
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Amount is required')
      return
    }

    const input = {
      companyName: form.companyName.trim(),
      date: form.date,
      staffName: form.staffName.trim() || currentUser.name,
      productName: form.productName.trim(),
      amount,
    }

    if (editingExpense) {
      updateExpense(editingExpense.id, input)
      toast.success('Hardware expense updated')
    } else {
      addExpense(input)
      toast.success('Hardware expense added')
    }

    setFormOpen(false)
  }

  function confirmDelete(expense: HardwareExpense) {
    if (!window.confirm(`Delete entry #${expense.srNo}?`)) return
    deleteExpense(expense.id)
    toast.success('Hardware expense deleted')
  }

  function exportHardwareCsv() {
    exportCsv(
      'hardware-expenses.csv',
      ['Sr.No', 'Date', 'Company Name', 'Product Name', 'Staff Name', 'Amount'],
      visibleExpenses.map((expense) => [
        expense.srNo,
        expense.date,
        expense.companyName,
        expense.productName,
        expense.staffName,
        expense.amount,
      ])
    )
    toast.success('Hardware expenses exported')
  }

  function printSlip(expense: HardwareExpense) {
    setSelectedForPrint(expense)
    document.body.classList.add('printing-hardware-slip')
    setTimeout(() => {
      window.print()
      document.body.classList.remove('printing-hardware-slip')
    }, 300)
  }

  function update<K extends keyof HardwareExpenseForm>(key: K, value: HardwareExpenseForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-heading">Hardware Expense</h1>
          <p className="mt-1 text-sm text-muted-foreground">Purchase expense slips for hardware entries.</p>
        </div>
        <Button type="button" onClick={openAddForm}>
          <Plus className="mr-2 h-4 w-4" />
          Add Entry
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sr.No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Company Name</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Staff Name</TableHead>
                <TableHead className="text-right">Amount ₹</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-mono tabular-nums">{expense.srNo}</TableCell>
                  <TableCell>{displayDate(expense.date)}</TableCell>
                  <TableCell>{expense.companyName}</TableCell>
                  <TableCell>{expense.productName}</TableCell>
                  <TableCell>{expense.staffName}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{INR.format(expense.amount)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => setPreviewExpense(expense)} aria-label="Preview slip">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => printSlip(expense)} aria-label="Print slip">
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => openEditForm(expense)} aria-label="Edit entry">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => confirmDelete(expense)} aria-label="Delete entry">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {visibleExpenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No hardware expense entries yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" onClick={exportHardwareCsv}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <p className="font-mono text-lg font-semibold tabular-nums">Total: {INR.format(totalAmount)}</p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Entry' : 'Add Entry'}</DialogTitle>
            <DialogDescription>Record a hardware purchase expense entry.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={(event) => update('companyName', event.target.value)}
                placeholder="COMPANY(HARDWARES)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hardwareDate">Date</Label>
              <Input
                id="hardwareDate"
                type="date"
                value={form.date}
                onChange={(event) => update('date', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staffName">Staff Name</Label>
              <Input
                id="staffName"
                value={form.staffName}
                onChange={(event) => update('staffName', event.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                value={form.productName}
                onChange={(event) => update('productName', event.target.value)}
                placeholder="HARDWARE-BH"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="hardwareAmount">Amount ₹</Label>
              <Input
                id="hardwareAmount"
                type="number"
                min={0}
                step="0.01"
                value={form.amount}
                onChange={(event) => update('amount', event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveExpense}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewExpense} onOpenChange={(open) => { if (!open) setPreviewExpense(null) }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Print Preview</DialogTitle>
            <DialogDescription>Hardware purchase slip preview.</DialogDescription>
          </DialogHeader>
          {previewExpense && (
            <div className="flex justify-center overflow-auto rounded-md border border-border bg-muted p-3">
              <PrintableHardwareSlip expense={previewExpense} />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPreviewExpense(null)}>
              Close
            </Button>
            {previewExpense && (
              <Button type="button" onClick={() => printSlip(previewExpense)}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedForPrint && (
        <PrintableHardwareSlip expense={selectedForPrint} className="hardware-slip-print" />
      )}
    </div>
  )
}
