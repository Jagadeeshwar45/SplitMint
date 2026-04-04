import React, { useState, useEffect } from 'react'
import { api } from '../lib/api'
import ExpenseList from './ExpenseList'
import BalanceView from './BalanceView'
import ExpenseForm from './ExpenseForm'
import MintSense from './MintSense'
import { BarChart2, List, Plus, Sparkles, Edit2, Check, X, Trash2, UserPlus } from 'lucide-react'

export default function GroupDetail({ group, onRefresh }) {
  const [tab, setTab] = useState('expenses')
  const [expenses, setExpenses] = useState([])
  const [balances, setBalances] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editExpense, setEditExpense] = useState(null)
  const [filters, setFilters] = useState({})
  const [aiSummary, setAiSummary] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)

  // Participant editing state
  const [editingParticipantId, setEditingParticipantId] = useState(null)
  const [editParticipantName, setEditParticipantName] = useState('')
  const [editParticipantColor, setEditParticipantColor] = useState('#10b981')
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [newParticipantName, setNewParticipantName] = useState('')
  const [newParticipantColor, setNewParticipantColor] = useState('#f59e0b')

  const load = async () => {
    const [exp, bal] = await Promise.all([
      api.getExpenses(group.id, filters),
      api.getBalances(group.id)
    ])
    setExpenses(exp)
    setBalances(bal)
  }

  useEffect(() => {
    if (group?.id) {
      setAiSummary('')  // ADD THIS LINE
      load()
    }
  }, [group?.id, filters])

  const totalSpent = expenses.reduce((s, e) => s + parseFloat(e.amount), 0)

  const getSummary = async () => {
    setSummaryLoading(true)
    const { summary } = await api.groupSummary(group.id, { balances, totalSpent })
    setAiSummary(summary)
    setSummaryLoading(false)
  }

  const startEditParticipant = (p) => {
    setEditingParticipantId(p.id)
    setEditParticipantName(p.name)
    setEditParticipantColor(p.color || '#6366f1')
  }

  const saveParticipant = async (id) => {
    await api.updateParticipant(id, { name: editParticipantName, color: editParticipantColor })
    setEditingParticipantId(null)
    onRefresh()
  }

  const deleteParticipant = async (id) => {
    // First check if this participant has any expenses linked to them
    const expensesAsPayer = expenses.filter(e => e.paid_by === id)
    const expensesAsSplit = expenses.filter(e =>
      e.expense_splits?.some(s => s.participant_id === id)
    )

    const total = new Set([
      ...expensesAsPayer.map(e => e.id),
      ...expensesAsSplit.map(e => e.id)
    ]).size

    if (total > 0) {
      const confirmed = confirm(
        `⚠️ This participant is linked to ${total} expense(s).\n\n` +
        `• As payer: ${expensesAsPayer.length} expense(s)\n` +
        `• As split member: ${expensesAsSplit.length} expense(s)\n\n` +
        `Removing them will delete their split entries and may affect balance calculations. Continue?`
      )
      if (!confirmed) return
    } else {
      if (!confirm('Remove this participant from the group?')) return
    }

    await api.deleteParticipant(id)
    onRefresh()
    load() // reload expenses so stale paid_by references are cleared
  }

  const addParticipant = async () => {
    if (!newParticipantName.trim()) return
    await api.addParticipant(group.id, { name: newParticipantName, color: newParticipantColor })
    setNewParticipantName('')
    setShowAddParticipant(false)
    onRefresh()
  }

  const tabs = [
    { id: 'expenses', label: 'Expenses', icon: List },
    { id: 'balances', label: 'Balances', icon: BarChart2 },
    { id: 'ai', label: 'MintSense AI', icon: Sparkles },
  ]

  const currentParticipants = group.participants || []
  const canAddMore = currentParticipants.length < 4 // 3 + primary user

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-3xl text-carbon-900 mb-3">{group.name}</h2>

            {/* Participants — editable inline */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-carbon-400 uppercase tracking-wider">Members</p>
              <div className="flex flex-wrap gap-2">
                {currentParticipants.map(p => (
                  <div key={p.id}>
                    {editingParticipantId === p.id ? (
                      <div className="flex items-center gap-1 bg-carbon-50 border border-carbon-200 rounded-xl px-2 py-1">
                        <input
                          autoFocus
                          className="outline-none bg-transparent text-sm w-24 text-carbon-900"
                          value={editParticipantName}
                          onChange={e => setEditParticipantName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveParticipant(p.id); if (e.key === 'Escape') setEditingParticipantId(null) }}
                        />
                        <input
                          type="color"
                          value={editParticipantColor}
                          onChange={e => setEditParticipantColor(e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                          title="Pick color"
                        />
                        <button onClick={() => saveParticipant(p.id)} className="text-mint-600 hover:text-mint-700">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingParticipantId(null)} className="text-carbon-400 hover:text-carbon-600">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="group/pill flex items-center gap-1 pl-1 pr-2 py-1 rounded-xl border border-transparent hover:border-carbon-200 hover:bg-carbon-50 transition-all">
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: p.color || '#6366f1' }}
                        >
                          {p.name[0].toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-carbon-800 max-w-[80px] truncate">{p.name}</span>
                        <div className="hidden group-hover/pill:flex items-center gap-0.5 ml-1">
                          <button
                            onClick={() => startEditParticipant(p)}
                            className="p-0.5 text-carbon-400 hover:text-carbon-700 rounded"
                            title="Edit participant"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => deleteParticipant(p.id)}
                            className="p-0.5 text-carbon-400 hover:text-red-500 rounded"
                            title="Remove participant"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add participant */}
                {canAddMore && !showAddParticipant && (
                  <button
                    onClick={() => setShowAddParticipant(true)}
                    className="flex items-center gap-1 px-2 py-1 rounded-xl border border-dashed border-carbon-300 text-carbon-400 hover:border-mint-400 hover:text-mint-600 text-xs transition-colors"
                  >
                    <UserPlus size={12} /> Add
                  </button>
                )}
                {showAddParticipant && (
                  <div className="flex items-center gap-1 bg-carbon-50 border border-mint-300 rounded-xl px-2 py-1">
                    <input
                      autoFocus
                      className="outline-none bg-transparent text-sm w-24 text-carbon-900"
                      placeholder="Name..."
                      value={newParticipantName}
                      onChange={e => setNewParticipantName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addParticipant(); if (e.key === 'Escape') setShowAddParticipant(false) }}
                    />
                    <input
                      type="color"
                      value={newParticipantColor}
                      onChange={e => setNewParticipantColor(e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <button onClick={addParticipant} className="text-mint-600 hover:text-mint-700"><Check size={14} /></button>
                    <button onClick={() => setShowAddParticipant(false)} className="text-carbon-400"><X size={14} /></button>
                  </div>
                )}
              </div>
              <p className="text-xs text-carbon-400">Hover a member to edit name or color · Max 4 members</p>
            </div>
          </div>

          <button className="btn-primary flex items-center gap-2 flex-shrink-0 ml-4" onClick={() => { setEditExpense(null); setShowForm(true) }}>
            <Plus size={18} /> Add Expense
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-mint-50 rounded-xl p-4 border border-mint-100">
            <p className="text-xs text-mint-600 font-medium mb-1 uppercase tracking-wider">Total Spent</p>
            <p className="font-display text-2xl text-carbon-900">₹{totalSpent.toFixed(2)}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <p className="text-xs text-amber-600 font-medium mb-1 uppercase tracking-wider">Settlements</p>
            <p className="font-display text-2xl text-carbon-900">{balances?.settlements?.length || 0}</p>
          </div>
          <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
            <p className="text-xs text-indigo-600 font-medium mb-1 uppercase tracking-wider">Expenses</p>
            <p className="font-display text-2xl text-carbon-900">{expenses.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t.id ? 'bg-carbon-900 text-white' : 'bg-white text-carbon-500 hover:bg-carbon-100 border border-carbon-200'}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'expenses' && (
        <ExpenseList
          expenses={expenses}
          participants={group.participants}
          filters={filters}
          onFilter={setFilters}
          onEdit={exp => { setEditExpense(exp); setShowForm(true) }}
          onDelete={async id => { await api.deleteExpense(id); load() }}
        />
      )}
      {tab === 'balances' && (
        <BalanceView
          key={group.id} 
          balances={balances}
          summary={aiSummary}
          summaryLoading={summaryLoading}
          onGetSummary={getSummary}
          totalSpent={totalSpent}
          group={group}
        />
      )}
      {tab === 'ai' && (
        <MintSense group={group} onExpenseCreated={() => { load(); setTab('expenses') }} />
      )}

      {showForm && (
        <ExpenseForm
          group={group}
          expense={editExpense}
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); load() }}
        />
      )}
    </div>
  )
}