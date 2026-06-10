import * as React from 'react'
import { AlertTriangle, CheckCircle2, Download, PackagePlus, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { exportCsv } from '@/lib/exportCsv'
import { GODOWNS_SEED, SECTION_COLORS, SECTIONS } from '@/lib/constants'
import { getUserSections } from '@/lib/userSections'
import { useAuthStore } from '@/store/authStore'
import { useInventoryStore } from '@/store/inventoryStore'
import type { Product, Section } from '@/types'

const ALL = '__all__'
type StatusFilter = typeof ALL | 'out' | 'critical' | 'low'
type LowStockStatus = 'Out of Stock' | 'Critical' | 'Low'

function sectionLabel(section: Section) {
  return SECTIONS.find((item) => item.key === section)?.label ?? section
}

function godownName(godownId: string) {
  return GODOWNS_SEED.find((godown) => godown.id === godownId)?.name ?? godownId
}

function sectionBadgeStyle(section: Section) {
  const label = sectionLabel(section)
  const color = SECTION_COLORS[label] ?? SECTION_COLORS.Glass
  return {
    backgroundColor: `${color}20`,
    borderColor: `${color}40`,
    color,
  }
}

function lowStockStatus(product: Product): LowStockStatus {
  if (product.stock === 0) return 'Out of Stock'
  if (product.stock <= product.lowStockThreshold / 2) return 'Critical'
  return 'Low'
}

function statusFilterValue(product: Product): Exclude<StatusFilter, typeof ALL> {
  const status = lowStockStatus(product)
  if (status === 'Out of Stock') return 'out'
  if (status === 'Critical') return 'critical'
  return 'low'
}

function statusBadgeStyle(status: LowStockStatus) {
  if (status === 'Out of Stock') return undefined

  const color = status === 'Critical' ? SECTION_COLORS.Plywood : SECTION_COLORS.Electrical
  return {
    backgroundColor: `${color}20`,
    borderColor: `${color}40`,
    color,
  }
}

function statusBarStyle(status: LowStockStatus) {
  if (status === 'Out of Stock') return undefined
  return {
    backgroundColor: status === 'Critical' ? SECTION_COLORS.Plywood : SECTION_COLORS.Electrical,
  }
}

function stockRatio(product: Product) {
  if (product.lowStockThreshold <= 0) return 0
  return Math.min((product.stock / product.lowStockThreshold) * 100, 100)
}

function csvRows(products: Product[]) {
  return products.map((product) => [
    product.name,
    sectionLabel(product.section),
    godownName(product.godownId),
    product.stock,
    `${product.lowStockThreshold} ${product.unit}`,
    lowStockStatus(product),
  ])
}

export function LowStockPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.currentUser)!
  const products = useInventoryStore((state) => state.products)
  const allowedSections = getUserSections(currentUser.id)
  const accessibleSections = SECTIONS.filter((section) => allowedSections.includes(section.key))

  const [sectionFilter, setSectionFilter] = React.useState<string>(ALL)
  const [godownFilter, setGodownFilter] = React.useState<string>(ALL)
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>(ALL)
  const [query, setQuery] = React.useState('')

  const lowStockProducts = React.useMemo(
    () =>
      products
        .filter((product) => allowedSections.includes(product.section))
        .filter((product) => product.stock <= product.lowStockThreshold),
    [allowedSections, products]
  )

  const filteredProducts = React.useMemo(
    () =>
      lowStockProducts
        .filter((product) => sectionFilter === ALL || product.section === sectionFilter)
        .filter((product) => godownFilter === ALL || product.godownId === godownFilter)
        .filter((product) => statusFilter === ALL || statusFilterValue(product) === statusFilter)
        .filter((product) => product.name.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name)),
    [godownFilter, lowStockProducts, query, sectionFilter, statusFilter]
  )

  const outOfStockCount = lowStockProducts.filter((product) => product.stock === 0).length
  const sectionsAffected = new Set(lowStockProducts.map((product) => product.section)).size

  function exportLowStock() {
    exportCsv(
      'low-stock.csv',
      ['Product', 'Section', 'Godown', 'Stock', 'Min Stock', 'Status'],
      csvRows(filteredProducts)
    )
    toast.success('Low stock exported')
  }

  function restockAll() {
    navigate('/purchases/new')
    toast.info('Select products to restock')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="page-heading">Low Stock</h1>
          <p className="mt-1 text-sm text-muted-foreground">Products below minimum threshold</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" variant="outline" onClick={exportLowStock}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button type="button" onClick={restockAll}>
            <PackagePlus className="mr-2 h-4 w-4" />
            Restock All
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total low stock items</p>
            <p className="mt-2 font-mono text-3xl font-semibold tabular-nums">{lowStockProducts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Critical items</p>
            <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-destructive">{outOfStockCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Sections affected</p>
            <p className="mt-2 font-mono text-3xl font-semibold tabular-nums">{sectionsAffected}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Products needing attention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_12rem_12rem_12rem]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search product name"
                className="pl-9"
              />
            </div>
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Sections</SelectItem>
                {accessibleSections.map((section) => (
                  <SelectItem key={section.key} value={section.key}>
                    {section.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={godownFilter} onValueChange={setGodownFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Godowns</SelectItem>
                {GODOWNS_SEED.map((godown) => (
                  <SelectItem key={godown.id} value={godown.id}>
                    {godown.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Statuses</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">
                {lowStockProducts.length === 0 ? 'All stock levels are healthy' : 'No low stock items match'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {lowStockProducts.length === 0
                  ? 'Every accessible product is above its minimum threshold.'
                  : 'Adjust the filters or search to see more items.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Godown</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const status = lowStockStatus(product)
                  const ratio = stockRatio(product)

                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{product.name}</p>
                          <p className="font-mono text-xs text-muted-foreground">{product.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" style={sectionBadgeStyle(product.section)}>
                          {sectionLabel(product.section)}
                        </Badge>
                      </TableCell>
                      <TableCell>{godownName(product.godownId)}</TableCell>
                      <TableCell>
                        <div className="min-w-36">
                          <div className="mb-1 flex justify-between font-mono text-sm tabular-nums">
                            <span>{product.stock}</span>
                            <span className="text-muted-foreground">/ {product.lowStockThreshold} {product.unit}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className={status === 'Out of Stock' ? 'h-full rounded-full bg-destructive' : 'h-full rounded-full'}
                              style={{ width: `${ratio}%`, ...statusBarStyle(status) }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={status === 'Out of Stock' ? 'border-destructive/40 bg-destructive/10 text-destructive' : undefined}
                          style={statusBadgeStyle(status)}
                        >
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/purchases/new', { state: { restockProductId: product.id } })}
                        >
                          <PackagePlus className="mr-2 h-4 w-4" />
                          Restock
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
