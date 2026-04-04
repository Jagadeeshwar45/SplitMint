import React, { useState } from 'react'
import { Trash2, Edit2, Search, ChevronDown, X, Calendar } from 'lucide-react'
import { format } from 'date-fns'

const CAT_COLORS = {
  food: 'bg-orange-100 text-orange-700',
  travel: 'bg-blue-100 text-blue-700',
  entertainment: 'bg-purple-100 text-purple-700',
  utilities: 'bg-gray-100 text-gray-700',
  shopping: 'bg-pink-100 text-pink-700',
  general: 'bg-mint-100 text-mint-700'
}

const CAT_EMOJI = {
  food: '🍽️', travel: '✈️', entertainment: '🎬',
  utilities: '⚡', shopping: '🛍️', general: '📌'
}

export default function ExpenseList({ expenses, participants, filters, onFilter, onEdit, onDelete }) {
  const [showFilters, setShowFilters] = useState(false)

  const setFilter = (k, v) => onFilter(f => ({ ...f, [k]: v || undefined }))

  const clearDateRange = () => onFilter(f => ({ ...f, dateFrom: undefined, dateTo: undefined }))

  const activeFilterCount = [
    filters.search,
    filters.participant,
    filters.dateFrom || filters.dateTo,
    filters.amountMin || filters.amountMax
  ].filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* Search + Filter toggle bar */}
      <div className="card p-3 flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 px-2">
          <Search size={16} className="text-carbon-400 flex-shrink-0" />
          <input
            className="flex-1 outline-none text-sm bg-transparent text-carbon-900 placeholder-carbon-400"
            placeholder="Search expenses by description..."
            value={filters.search || ''}
            onChange={e => setFilter('search', e.target.value)}
          />
          {filters.search && (
            <button onClick={() => setFilter('search', '')} className="text-carbon-400 hover:text-carbon-600">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="w-px h-6 bg-carbon-200" />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${showFilters || activeFilterCount > 0 ? 'bg-mint-100 text-mint-700' : 'text-carbon-500 hover:bg-carbon-100'}`}
        >
          <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-mint-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Expanded filters panel */}
      {showFilters && (
        <div className="card p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Person filter */}
            <div>
              <label className="label">Paid by</label>
              <select
                className="input text-sm"
                value={filters.participant || ''}
                onChange={e => setFilter('participant', e.target.value)}
              >
                <option value="">All people</option>
                {participants?.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Amount range */}
            <div>
              <label className="label">Amount range (₹)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="input text-sm"
                  placeholder="Min"
                  value={filters.amountMin || ''}
                  onChange={e => setFilter('amountMin', e.target.value)}
                />
                <span className="text-carbon-400 text-sm flex-shrink-0">to</span>
                <input
                  type="number"
                  className="input text-sm"
                  placeholder="Max"
                  value={filters.amountMax || ''}
                  onChange={e => setFilter('amountMax', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Date range — single row, clearly labeled */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0 flex items-center gap-1.5">
                <Calendar size={14} className="text-carbon-400" />
                Date range
              </label>
              {(filters.dateFrom || filters.dateTo) && (
                <button onClick={clearDateRange} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                  <X size={12} /> Clear dates
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-carbon-400 mb-1">From</p>
                <input
                  type="date"
                  className="input text-sm"
                  value={filters.dateFrom || ''}
                  onChange={e => setFilter('dateFrom', e.target.value)}
                  max={filters.dateTo || undefined}
                />
              </div>
              <div className="w-4 h-px bg-carbon-300 mt-4 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-carbon-400 mb-1">To</p>
                <input
                  type="date"
                  className="input text-sm"
                  value={filters.dateTo || ''}
                  onChange={e => setFilter('dateTo', e.target.value)}
                  min={filters.dateFrom || undefined}
                />
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 pt-1 border-t border-carbon-100">
              <span className="text-xs text-carbon-400">Active:</span>
              {filters.participant && (
                <span className="text-xs bg-mint-100 text-mint-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  {participants?.find(p => p.id === filters.participant)?.name}
                  <button onClick={() => setFilter('participant', '')}><X size={10} /></button>
                </span>
              )}
              {(filters.dateFrom || filters.dateTo) && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  {filters.dateFrom || '…'} → {filters.dateTo || '…'}
                  <button onClick={clearDateRange}><X size={10} /></button>
                </span>
              )}
              {(filters.amountMin || filters.amountMax) && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  ₹{filters.amountMin || 0} – ₹{filters.amountMax || '∞'}
                  <button onClick={() => onFilter(f => ({ ...f, amountMin: undefined, amountMax: undefined }))}><X size={10} /></button>
                </span>
              )}
              <button
                onClick={() => onFilter({})}
                className="ml-auto text-xs text-red-400 hover:text-red-600 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}

      {/* Expense list */}
      <div className="space-y-2">
        {expenses.length === 0 && (
          <div className="card p-10 text-center">
            <p className="text-3xl mb-2">🧾</p>
            <p className="font-medium text-carbon-600 mb-1">No expenses found</p>
            <p className="text-sm text-carbon-400">
              {activeFilterCount > 0 ? 'Try adjusting your filters' : 'Add your first expense to get started'}
            </p>
          </div>
        )}
        {expenses.map(exp => {
          const payer = participants?.find(p => p.id === exp.paid_by) || exp.participants
          const splitParticipants = exp.expense_splits?.length || 0

          return (
            <div key={exp.id} className="card p-4 flex items-center gap-4 hover:border-carbon-300 transition-all hover:shadow-sm group">
              {/* Category icon */}
              <div className="w-10 h-10 rounded-xl bg-carbon-50 flex items-center justify-center text-xl flex-shrink-0">
                {CAT_EMOJI[exp.category] || CAT_EMOJI.general}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-carbon-900 truncate">{exp.description}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0 ${CAT_COLORS[exp.category] || CAT_COLORS.general}`}>
                    {exp.category}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-carbon-400 flex-wrap">
                  <span>{format(new Date(exp.date), 'dd MMM yyyy')}</span>
                  {payer && (
                    <span className="flex items-center gap-1">
                      Paid by
                      <span
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white font-bold"
                        style={{ backgroundColor: payer.color || '#6366f1', fontSize: '9px' }}
                      >
                        {payer.name?.[0]?.toUpperCase()}
                      </span>
                      <span className="text-carbon-700 font-medium">{payer.name}</span>
                    </span>
                  )}
                  <span className="capitalize bg-carbon-100 px-1.5 py-0.5 rounded-md text-carbon-500">
                    {exp.split_mode} split · {splitParticipants} people
                  </span>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-display text-xl text-carbon-900">₹{parseFloat(exp.amount).toFixed(2)}</p>
                <p className="text-xs text-carbon-400">
                  {exp.split_mode === 'equal' && splitParticipants > 0
                  ? `₹${(parseFloat(exp.amount) / splitParticipants).toFixed(2)} each`
                  : exp.split_mode === 'percentage'
                  ? 'Custom % split'
                  : exp.split_mode === 'custom'
                  ? 'Custom amounts'
                  : ''}
                </p>
              </div>

              <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="p-2 text-carbon-400 hover:text-carbon-700 hover:bg-carbon-100 rounded-lg transition-colors"
                  onClick={() => onEdit(exp)}
                  title="Edit expense"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  className="p-2 text-carbon-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  onClick={() => onDelete(exp.id)}
                  title="Delete expense"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {expenses.length > 0 && (
        <p className="text-center text-xs text-carbon-400">
          Showing {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
          {activeFilterCount > 0 ? ' (filtered)' : ''}
        </p>
      )}
    </div>
  )
}