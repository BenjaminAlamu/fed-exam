import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Head, router } from '@inertiajs/react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, Users, AlertTriangle } from 'lucide-react';

export type Ticket = {
  id: string
  title: string
  content: string
  creationTime: number
  userEmail: string
  labels?: string[]
}

interface DashboardProps {
  dashboardData: Ticket[];
}

interface AppProps {
  tickets: {
    data: Ticket[]
    meta: {
      total: number
      perPage: number
      currentPage: number
      lastPage: number
    }
  },
  dashboardData: Ticket[]
}

interface PaginationProps {
  current: number;
  total: number;
  onChange: (page: number) => void;
}

interface Analytics {
  labelData: { name: string; value: number }[];
  timeline: { month: string; count: number }[];
  topReporters: { email: string; count: number }[];
  stats: {
    totalTickets: number;
    uniqueReporters: number;
    mostCommonLabel: string;
    avgTicketsPerDay: number;
  };
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  subtitle?: string;
}


function SecurityDashboard({ dashboardData }: DashboardProps) {
  const tickets = dashboardData
  const analytics: Analytics = useMemo(() => {
    const labelCounts: Record<string, number> = {};
    tickets.forEach(ticket => {
      ticket && ticket.labels && ticket.labels.forEach(label => {
        labelCounts[label] = (labelCounts[label] || 0) + 1;
      });
    });

    const labelData = Object.entries(labelCounts)
      .map(([label, count]) => ({ name: label, value: count }))
      .sort((a, b) => b.value - a.value);

    const timelineData: Record<string, number> = {};
    tickets.forEach(ticket => {
      const date = new Date(ticket.creationTime);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      timelineData[monthKey] = (timelineData[monthKey] || 0) + 1;
    });

    const timeline = Object.entries(timelineData)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));


    const reporterCounts: Record<string, number> = {};
    tickets.forEach(ticket => {
      reporterCounts[ticket.userEmail] = (reporterCounts[ticket.userEmail] || 0) + 1;
    });

    const topReporters = Object.entries(reporterCounts)
      .map(([email, count]) => ({ email, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const totalTickets = tickets.length;
    const uniqueReporters = Object.keys(reporterCounts).length;
    const mostCommonLabel = labelData[0]?.name || 'None';
    const avgTicketsPerDay = totalTickets / Math.max(1,
      (Date.now() - Math.min(...tickets.map(t => t.creationTime))) / (1000 * 60 * 60 * 24)
    );

    return {
      labelData,
      timeline,
      topReporters,
      stats: {
        totalTickets,
        uniqueReporters,
        mostCommonLabel,
        avgTicketsPerDay: Math.round(avgTicketsPerDay * 10) / 10
      }
    };
  }, [tickets]);


  const StatCard = ({ icon: Icon, title, value, subtitle }: StatCardProps) => (
    <div className="bg-white rounded-lg border p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="bg-blue-50 p-3 rounded-full">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={AlertTriangle}
            title="Total Issues"
            value={analytics.stats.totalTickets}
            subtitle="All security issues"
          />
          <StatCard
            icon={Users}
            title="Unique Reporters"
            value={analytics.stats.uniqueReporters}
            subtitle="Different email addresses"
          />
          <StatCard
            icon={TrendingUp}
            title="Avg. per Day"
            value={analytics.stats.avgTicketsPerDay}
            subtitle="Issues reported daily"
          />
          <StatCard
            icon={Calendar}
            title="Top Label"
            value={analytics.stats.mostCommonLabel}
            subtitle="Most common severity"
          />
        </div>

        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Issues</h3>
          <div className="space-y-3">
            {tickets
              .sort((a, b) => b.creationTime - a.creationTime)
              .slice(0, 5)
              .map(ticket => (
                <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 truncate">{ticket.title}</h4>
                    <p className="text-sm text-gray-600">
                      {ticket.userEmail} • {new Date(ticket.creationTime).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {ticket.labels.slice(0, 2).map(label => (
                      <span key={label} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {label}
                      </span>
                    ))}
                    {ticket.labels.length > 2 && (
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                        +{ticket.labels.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div >
  );
}


function Pagination({ current, total, onChange }: PaginationProps) {
  if (total <= 1) return null;

  const pages: (number | string)[] = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);

    if (current <= 3) {
      pages.push(2, 3, 4, '...', total);
    } else if (current >= total - 2) {
      pages.push('...', total - 3, total - 2, total - 1, total);
    } else {
      pages.push('...', current - 1, current, current + 1, '...', total);
    }
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((page, i) => (
        page === '...' ? (
          <span key={`ellipsis-${i}`} className="px-3 py-2 text-gray-400">...</span>
        ) : (
          <button
            key={page}
            onClick={() => onChange(page as number)}
            className={`px-3 py-2 rounded text-sm ${current === page
              ? 'bg-blue-500 text-white'
              : 'hover:bg-gray-100'
              }`}
          >
            {page}
          </button>
        )
      ))}

      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}


function SingleTicket({ ticket, hideItem }: { ticket: Ticket, hideItem: (id: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowToggle, setShouldShowToggle] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const checkTextOverflow = () => {
      if (textRef.current) {
        const lineHeight = parseInt(getComputedStyle(textRef.current).lineHeight);
        const maxHeight = lineHeight * 3;
        setShouldShowToggle(textRef.current.scrollHeight > maxHeight);
      }
    };

    checkTextOverflow();
    window.addEventListener('resize', checkTextOverflow);
    return () => window.removeEventListener('resize', checkTextOverflow);
  }, [ticket.content]);

  return (
    <li className="bg-white border border-sand-7 rounded-lg p-6 hover:border-sand-8 hover:shadow-sm transition duration-200 relative">
      <button
        className="text-xs text-sand-12 font-semibold absolute top-6 right-6"
        onClick={() => hideItem(ticket.id)}
      >
        Hide
      </button>
      <h5 className="text-lg font-semibold text-sand-12 mb-2">{ticket.title}</h5>

      <div className="mb-2">
        <p
          ref={textRef}
          className="text-xs text-lighttext-sand-12"
          style={{
            display: !isExpanded && shouldShowToggle ? '-webkit-box' : 'block',
            WebkitLineClamp: !isExpanded && shouldShowToggle ? 3 : 'unset',
            WebkitBoxOrient: !isExpanded && shouldShowToggle ? 'vertical' : 'unset',
            overflow: !isExpanded && shouldShowToggle ? 'hidden' : 'visible'
          }}
        >
          {ticket.content}
        </p>

        {shouldShowToggle && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 block"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      <footer>
        <div className="text-sm text-sand-10">
          By {ticket.userEmail} | {formatDate(ticket.creationTime)}
        </div>
      </footer>

      {ticket.labels && ticket?.labels?.length > 0 && (
        <div className='flex flex-wrap gap-x-2 justify-end'>
          {ticket.labels.map((label) => (
            <div
              key={label}
              className="border border-blue-200 rounded-md bg-blue-100 text-sand-11 text-xs px-2 py-1 font-medium whitespace-nowrap"
            >
              {label}
            </div>
          ))}
        </div>
      )}
    </li>
  );
}

function TicketsList({ tickets, hideItem }: { tickets: Ticket[], hideItem: (id: string) => void }) {
  return (
    <ul className="space-y-4">
      {tickets.map((ticket) => (
        <SingleTicket key={ticket.id} ticket={ticket} hideItem={hideItem} />
      ))}
    </ul>
  )
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="text-center py-12">
      <div className="text-lg text-sand-11">
        {hasSearch ? 'No issues found matching your search.' : 'No security issues found.'}
      </div>
    </div>
  )
}

export default function App({ tickets, dashboardData }: AppProps) {
  const [search, setSearch] = useState('')
  const [hiddenItems, setHiddenItems] = useState<Ticket[]>([])
  const [itemsToShow, setItemsToShow] = useState(tickets?.data || [])
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showDashboard, setShowDashboard] = useState(true)

  const handleHideItem = (id: string) => {
    const itemToBeHidden = itemsToShow.find((item) => item.id === id)
    if (!itemToBeHidden) return
    setHiddenItems([...hiddenItems, itemToBeHidden])
    setItemsToShow(itemsToShow.filter((item) => item.id !== id))
  }

  const handleSearch = useCallback(function handleSearch(value: string) {
    setSearch(value)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      router.get('/', value ? { search: value.trim() } : {}, { preserveState: false, replace: true })
    }, 500)
  }, [])

  const handleRestoreItems = () => {
    setHiddenItems([])
    setItemsToShow(tickets?.data || [])
  }

  const handlePageChange = (page: number) => {
    router.get(
      '/',
      { ...(search && { search: search.trim() }), page },
      { preserveState: true, replace: true }
    )
  }

  const ticketData = tickets.data
    .filter((t) =>
      (t.title.toLowerCase() + t.content.toLowerCase()).includes(search.toLowerCase())
    )
    .filter((t) => !hiddenItems.some((hidden) => hidden.id === t.id));


  return (
    <>
      <Head title="Security Issues" />

      <div className="min-h-screen bg-sand-1">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <main>
            <h1 className="text-3xl font-bold text-sand-12 mb-8">Security Issues List</h1>

            <header className="mb-6">
              <input
                type="search"
                placeholder="Search issues..."
                className="w-full max-w-md px-4 py-2 border border-sand-7 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                onChange={(e) => handleSearch(e.target.value)}
                value={search}
              />


            </header>
            <main className='w-full flex justify-end'>
              <button className="text-sm text-sand-11 mb-4 " onClick={() => setShowDashboard(!showDashboard)}>
                {showDashboard ? "Hide dashboard" : "Show dashboard"}
              </button>
            </main>
            {tickets && (
              <>
                {showDashboard && <SecurityDashboard dashboardData={dashboardData} />}

                <div className="flex gap-x-2 items-center">
                  <p className='text-sm text-sand-11 mb-4'>Showing {ticketData.length} of {tickets.meta.total} issues</p>

                  {hiddenItems.length > 0 && (
                    <span className="text-sm text-sand-11 mb-4">({hiddenItems.length} hidden ticket{hiddenItems.length > 1 && 's'})</span>
                  )}

                  {hiddenItems.length > 0 && (
                    <button className="text-sm text-sand-11 mb-4" onClick={handleRestoreItems}>
                      Restore
                    </button>
                  )}
                </div></>
            )}

            {ticketData.length > 0 ? (
              <>

                <TicketsList tickets={ticketData} hideItem={handleHideItem} />
                <Pagination current={tickets.meta.currentPage} total={Math.ceil(tickets.meta.total / tickets.meta.perPage)} onChange={handlePageChange} />
              </>
            ) : (
              <EmptyState hasSearch={Boolean(search)} />
            )}
          </main>
        </div>
      </div>
    </>
  )
}

function formatDate(unixTimestemp: number) {
  return new Date(unixTimestemp)
    .toISOString()
    .replace('T', ' ')
    .replace(/\.\d{3}Z$/, '')
}
