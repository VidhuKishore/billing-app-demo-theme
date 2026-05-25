import * as React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { format, isSameDay } from 'date-fns'
import { toast } from 'sonner'
import {
  AlertTriangle,
  ArrowRight,
  Package,
  Receipt,
  TrendingUp,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { WeeklyBarChart } from '@/components/reports/WeeklyBarChart'
import { SECTION_COLORS, SECTIONS } from '@/lib/constants'
import { getUserSections } from '@/lib/userSections'
import {
  getBillFinalAmount,
  getBillStatus,
  getYearlyData,
  selectCollectionStats,
  selectFulfilmentStats,
  selectWeeklyRevenue,
} from '@/lib/reportSelectors'
import { useAuthStore } from '@/store/authStore'
import { useBillingStore } from '@/store/billingStore'
import { useInventoryStore } from '@/store/inventoryStore'
import { cn } from '@/lib/utils'
import type { SalesBill } from '@/types'

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})
const NUM = new Intl.NumberFormat('en-IN')

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function moneyAxis(value: number) {
  return `₹${Math.round(value / 1000)}k`
}

function KpiCard({
  label,
  value,
  icon,
  sub,
  accent = 'primary',
}: {
  label: string
  value: string
  icon: React.ReactNode
  sub?: string
  accent?: 'primary' | 'soft' | 'paid' | 'danger'
}) {
  const accentClass = {
    primary: 'border-t-brand-mid text-brand-mid shadow-[0_0_16px_#5F959820] dark:text-brand-light',
    soft: 'border-t-brand-light text-brand-dark shadow-[0_0_16px_#F3F4F420] dark:text-brand-light',
    paid: 'border-t-[#4CAF50] text-[#4CAF50] shadow-[0_0_16px_#4CAF5020]',
    danger: 'border-t-[#EF5350] text-[#EF5350] shadow-[0_0_16px_#EF535020]',
  }[accent]

  return (
    <Card className={cn('h-full border-border bg-card transition duration-200 hover:-translate-y-0.5 hover:border-brand-mid', accentClass)}>
      <CardContent className="flex h-full min-h-28 items-start justify-between gap-3 pt-5 pb-4">
        <div className="min-w-0">
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <p className="truncate font-mono text-3xl font-semibold tabular-nums text-foreground">{value}</p>
          {sub && <p className="mt-1 truncate text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className="mt-0.5 shrink-0">{icon}</div>
      </CardContent>
    </Card>
  )
}

function StatBar({
  label,
  pct,
  caption,
}: {
  label: string
  pct: number
  caption?: string
}) {
  const clamped = Math.min(100, Math.max(0, pct))
  const color = clamped > 75 ? 'bg-[#4CAF50]' : clamped >= 25 ? 'bg-[#FFB74D]' : 'bg-[#EF5350]'

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium tabular-nums text-foreground">{Math.round(clamped)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {caption && <p className="text-[10px] text-muted-foreground">{caption}</p>}
    </div>
  )
}

function StatusBadge({ status }: { status: 'paid' | 'partial' | 'pending' }) {
  if (status === 'paid') return <Badge className="border-[#4CAF50]/40 bg-[#4CAF50]/10 text-[10px] text-[#4CAF50] shadow-[0_0_12px_#4CAF5025]">Paid</Badge>
  if (status === 'partial') return <Badge className="border-[#FFB74D]/40 bg-[#FFB74D]/10 text-[10px] text-[#FFB74D] shadow-[0_0_12px_#FFB74D25]">Partial</Badge>
  return <Badge className="border-[#EF5350]/40 bg-[#EF5350]/10 text-[10px] text-[#EF5350] shadow-[0_0_12px_#EF535025]">Pending</Badge>
}

function WeeklyRevenueCard({ bills, today }: { bills: SalesBill[]; today: Date }) {
  const weekDays = selectWeeklyRevenue(bills, today)
  const weeklyTotal = weekDays.reduce((sum, day) => sum + day.revenue, 0)
  const avgPerDay = weeklyTotal / 7

  return (
    <Card className="h-full rounded-xl border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-foreground">Weekly Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <WeeklyBarChart days={weekDays} />
        <Separator className="my-4" />
        <div className="flex gap-8 text-xs">
          <div>
            <p className="text-muted-foreground">Weekly total</p>
            <p className="mt-0.5 font-mono text-base font-semibold tabular-nums text-foreground">{INR.format(weeklyTotal)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Avg / day</p>
            <p className="mt-0.5 font-mono text-base font-semibold tabular-nums text-foreground">{INR.format(Math.round(avgPerDay))}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function YearlyRevenueCard({ bills, year }: { bills: SalesBill[]; year: number }) {
  const yearly = getYearlyData(bills, year)

  return (
    <Card className="h-full rounded-xl border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-foreground">Yearly Revenue</CardTitle>
        <p className="text-xs text-muted-foreground">Jan - Dec {year}</p>
      </CardHeader>
      <CardContent>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={yearly.months}>
              <defs>
                <linearGradient id="dashboardYearlyRevenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5F9598" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#5F9598" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
              <YAxis tickFormatter={moneyAxis} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" width={46} />
              <Tooltip
                cursor={{ stroke: 'hsl(var(--border))' }}
                formatter={(value) => [INR.format(Number(value)), 'Revenue']}
                labelFormatter={(label) => yearly.months.find((month) => month.month === label)?.monthName ?? label}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#5F9598"
                strokeWidth={2}
                fill="url(#dashboardYearlyRevenueFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <Separator className="my-4" />
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Year to date</p>
            <p className="mt-0.5 font-mono text-xl font-semibold tabular-nums text-foreground">{INR.format(yearly.totalRevenue)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Monthly avg</p>
            <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">{INR.format(yearly.avgMonthlyRevenue)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ChartSection({ bills, today }: { bills: SalesBill[]; today: Date }) {
  const year = today.getFullYear()
  const user = useAuthStore((s) => s.currentUser)!

  return (
    <div className={cn(user.role === 'admin' ? 'flex gap-4' : 'grid grid-cols-1 gap-4')}>
      <div className={user.role === 'admin' ? 'w-1/2' : 'w-full'}>
        <WeeklyRevenueCard bills={bills} today={today} />
      </div>

      {user.role === 'admin' && (
        <div className="w-1/2">
          <YearlyRevenueCard bills={bills} year={year} />
        </div>
      )}
    </div>
  )
}

function QuickStatsCard({
  collectionRate,
  collectionCaption,
  fulfilmentRate,
  fulfilmentCaption,
  stockRate,
  stockCaption,
}: {
  collectionRate: number
  collectionCaption: string
  fulfilmentRate: number
  fulfilmentCaption: string
  stockRate: number
  stockCaption: string
}) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-foreground">Quick Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <StatBar label="Collection Rate" pct={collectionRate} caption={collectionCaption} />
        <StatBar label="Bill Fulfillment" pct={fulfilmentRate} caption={fulfilmentCaption} />
        <StatBar label="Stock Health" pct={stockRate} caption={stockCaption} />
      </CardContent>
    </Card>
  )
}

function AdminDashboard({ name }: { name: string }) {
  const bills = useBillingStore((state) => state.bills)
  const products = useInventoryStore((state) => state.products)
  const today = new Date()

  const todayBills = bills.filter((bill) => isSameDay(new Date(bill.date), today))
  const todayRevenue = todayBills.reduce((sum, bill) => sum + getBillFinalAmount(bill), 0)
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0)
  const collectionStats = selectCollectionStats(bills)
  const fulfilmentStats = selectFulfilmentStats(bills)
  const outstanding = bills.filter((bill) => getBillStatus(bill) !== 'paid')
  const healthy = products.filter((product) => product.stock > product.lowStockThreshold).length
  const stockRate = products.length > 0 ? (healthy / products.length) * 100 : 0
  const recentBills = [...bills].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{greeting()}, {name.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-brand-mid dark:text-brand-light">
          {format(today, 'EEEE, d MMMM yyyy')} - Admin overview
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard accent="primary" label="Today's Revenue" value={INR.format(todayRevenue)} icon={<TrendingUp size={18} />} sub={`${todayBills.length} bill${todayBills.length !== 1 ? 's' : ''} today`} />
        <KpiCard accent="soft" label="Bills Today" value={String(todayBills.length)} icon={<Receipt size={18} />} sub="all sections" />
        <KpiCard accent="paid" label="Items in Stock" value={NUM.format(totalStock)} icon={<Package size={18} />} sub={`${products.length} products`} />
        <KpiCard accent="danger" label="Pending Payments" value={INR.format(collectionStats.pending)} icon={<AlertTriangle size={18} />} sub={`${outstanding.length} bill${outstanding.length !== 1 ? 's' : ''} outstanding`} />
      </div>

      <ChartSection bills={bills} today={today} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base text-foreground">Recent Bills</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
              <Link to="/billing">
                All bills <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Bill #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead className="pr-6 text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBills.map((bill) => {
                  const sectionLabel = SECTIONS.find((section) => section.key === bill.section)?.label ?? bill.section
                  return (
                    <TableRow key={bill.id} className="hover:bg-muted/60">
                      <TableCell className="pl-6">
                        <Link to={`/billing/${bill.id}`} className="font-mono text-xs hover:underline">
                          {bill.billNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[130px] truncate text-sm">
                        {bill.customerName ?? <span className="text-muted-foreground italic">Walk-in</span>}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[10px]"
                          style={{
                            backgroundColor: `${SECTION_COLORS[sectionLabel]}20`,
                            borderColor: `${SECTION_COLORS[sectionLabel]}40`,
                            color: SECTION_COLORS[sectionLabel],
                          }}
                        >
                          {sectionLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-right font-mono text-xs tabular-nums">
                        {INR.format(getBillFinalAmount(bill))}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <QuickStatsCard
          collectionRate={collectionStats.collectionRate}
          collectionCaption={`${INR.format(collectionStats.paid)} collected of ${INR.format(collectionStats.total)}`}
          fulfilmentRate={fulfilmentStats.fulfilmentRate}
          fulfilmentCaption={`${fulfilmentStats.fulfilledBills} of ${fulfilmentStats.totalBills} bills fully paid`}
          stockRate={stockRate}
          stockCaption={`${healthy} of ${products.length} products above threshold`}
        />
      </div>
    </div>
  )
}

function BillingDashboard({ name, userId }: { name: string; userId: string }) {
  const bills = useBillingStore((state) => state.bills)
  const products = useInventoryStore((state) => state.products)
  const today = new Date()
  const allowedSections = getUserSections(userId)
  const sectionNames = allowedSections.map((section) => SECTIONS.find((item) => item.key === section)?.label ?? section).join(' & ')
  const myProducts = products.filter((product) => allowedSections.includes(product.section))
  const myBills = bills.filter((bill) => bill.createdBy === userId)
  const myTodayBills = myBills.filter((bill) => isSameDay(new Date(bill.date), today))
  const myTotalStock = myProducts.reduce((sum, product) => sum + product.stock, 0)
  const collectionStats = selectCollectionStats(myBills)
  const fulfilmentStats = selectFulfilmentStats(myBills)
  const healthy = myProducts.filter((product) => product.stock > product.lowStockThreshold).length
  const stockRate = myProducts.length > 0 ? (healthy / myProducts.length) * 100 : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{greeting()}, {name.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-brand-mid dark:text-brand-light">
          {format(today, 'EEEE, d MMMM yyyy')} - {sectionNames}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard accent="soft" label="My Bills Today" value={String(myTodayBills.length)} icon={<Receipt size={18} />} sub={myTodayBills.length === 0 ? 'none yet today' : 'created by you'} />
        <KpiCard accent="paid" label="Items in Stock" value={NUM.format(myTotalStock)} icon={<Package size={18} />} sub={`${myProducts.length} products - ${sectionNames}`} />
        <KpiCard accent="primary" label="Revenue Today" value={INR.format(myTodayBills.reduce((sum, bill) => sum + getBillFinalAmount(bill), 0))} icon={<TrendingUp size={18} />} sub="created by you" />
      </div>

      <ChartSection bills={myBills} today={today} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base text-foreground">Today's Bills</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
              <Link to="/billing">
                All bills <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className={myTodayBills.length === 0 ? undefined : 'px-0 pb-0'}>
            {myTodayBills.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No bills created today.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Bill #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myTodayBills.map((bill) => (
                    <TableRow key={bill.id} className="hover:bg-muted/60">
                      <TableCell className="pl-6">
                        <Link to={`/billing/${bill.id}`} className="font-mono text-xs hover:underline">
                          {bill.billNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate text-sm">
                        {bill.customerName ?? <span className="text-muted-foreground italic">Walk-in</span>}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">{bill.items.length}</TableCell>
                      <TableCell className="pr-6">
                        <StatusBadge status={getBillStatus(bill)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <QuickStatsCard
          collectionRate={collectionStats.collectionRate}
          collectionCaption={`${INR.format(collectionStats.paid)} collected of ${INR.format(collectionStats.total)}`}
          fulfilmentRate={fulfilmentStats.fulfilmentRate}
          fulfilmentCaption={`${fulfilmentStats.fulfilledBills} of ${fulfilmentStats.totalBills} bills fully paid`}
          stockRate={stockRate}
          stockCaption={`${healthy} of ${myProducts.length} products above threshold`}
        />
      </div>
    </div>
  )
}

export function DashboardPage() {
  const currentUser = useAuthStore((state) => state.currentUser)!
  const location = useLocation()
  const navigate = useNavigate()

  React.useEffect(() => {
    if (location.state?.denied) {
      toast.error("You don't have access to that page")
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])

  if (currentUser.role === 'admin') return <AdminDashboard name={currentUser.name} />

  return <BillingDashboard name={currentUser.name} userId={currentUser.id} />
}
