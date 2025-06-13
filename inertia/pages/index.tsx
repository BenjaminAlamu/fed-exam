import { useState, useCallback, useRef, useEffect } from 'react'
import { Head, router } from '@inertiajs/react'

export type Ticket = {
  id: string
  title: string
  content: string
  creationTime: number
  userEmail: string
  labels?: string[]
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
  }
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

export default function App({ tickets }: AppProps) {
  const [search, setSearch] = useState('')
  const [hiddenItems, setHiddenItems] = useState<Ticket[]>([])
  const [itemsToShow, setItemsToShow] = useState(tickets?.data || [])
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)


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
      router.get('/', value ? { search: value.trim() } : {}, { preserveState: true, replace: true })
    }, 500)
  }, [])

  const handleRestoreItems = () => {
    setHiddenItems([])
    setItemsToShow(tickets?.data || [])
  }

  const ticketData =
    itemsToShow.filter((t) =>
      (t.title.toLowerCase() + t.content.toLowerCase()).includes(search.toLowerCase())
    ) || []

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

            {tickets && (
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
              </div>
            )}

            {ticketData.length > 0 ? (
              <TicketsList tickets={ticketData} hideItem={handleHideItem} />
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
