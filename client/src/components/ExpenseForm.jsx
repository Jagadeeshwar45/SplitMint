import React, { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { X } from 'lucide-react'

const CATEGORIES = ['food', 'travel', 'entertainment', 'utilities', 'shopping', 'general']
const COLORS = { food: 'bg-orange-100 text-orange-700', travel: 'bg-blue-100 text-blue-700', entertainment: 'bg-purple-100 text-purple-700', utilities: 'bg-gray-100 text-gray-700', shopping: 'bg-pink-100 text-pink-700', general: 'bg-mint-100 text-mint-700' }

export default function ExpenseForm({ group, expense, onClose, onSave }) {
  const [form, setForm] = useState({
    description: '', amount: '', paid_by: '', split_mode: 'equal',
    date: new Date().toISOString().slice(0, 10), category: 'general',
    participants: group.participants?.map(p => p.id) || [],
    customAmounts: {}, percentages: {}
  })

  useEffect(() => {
    if (expense) {
      const splits = expense.expense_splits || []
      const customAmounts = {}
      const percentages = {}
      splits.forEach(s => { customAmounts[s.participant_id] = s.amount; percentages[s.participant_id] = s.percentage })
      setForm({
        description: expense.description, amount: expense.amount,
        paid_by: expense.paid_by, split_mode: expense.split_mode,
        date: expense.date, category: expense.category || 'general',
        participants: splits.map(s => s.participant_id),
        customAmounts, percentages
      })
    } else {
      setForm(f => ({ ...f, paid_by: group.participants?.[0]?.id || '' }))
    }
  }, [expense])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleParticipant = (id) => {
    set('participants', form.participants.includes(id)
      ? form.participants.filter(p => p !== id)
      : [...form.participants, id])
  }

  const submit = async () => {
    const base = { group_id: group.id, description: form.description, amount: parseFloat(form.amount), paid_by: form.paid_by, split_mode: form.split_mode, date: form.date, category: form.category }
    let participants
    if (form.split_mode === 'equal') participants = form.participants
    else if (form.split_mode === 'custom') participants = form.participants.map(id => ({ id, amount: parseFloat(form.customAmounts[id] || 0) }))
    else participants = form.participants.map(id => ({ id, percentage: parseFloat(form.percentages[id] || 0) }))

    if (expense) await api.updateExpense(expense.id, { ...base, participants })
    else await api.createExpense({ ...base, participants })
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-2xl">{expense ? 'Edit Expense' : 'Add Expense'}</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Description</label>
            <input className="input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="What's this for?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (₹)</label>
              <input className="input" type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Paid by</label>
            <select className="input" value={form.paid_by} onChange={e => set('paid_by', e.target.value)}>
              {group.participants?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => set('category', c)}
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize border transition-all ${form.category === c ? COLORS[c] + ' border-current' : 'border-carbon-200 text-carbon-500'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Split Mode</label>
            <div className="flex gap-2">
              {['equal', 'custom', 'percentage'].map(m => (
                <button key={m} onClick={() => set('split_mode', m)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all capitalize ${form.split_mode === m ? 'bg-carbon-900 text-white border-carbon-900' : 'bg-white text-carbon-500 border-carbon-200'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Participants</label>
            <div className="space-y-2">
              {group.participants?.map(p => (
                <div key={p.id} className="flex items-center gap-3">
                  <button onClick={() => toggleParticipant(p.id)}
                    className={`w-5 h-5 rounded border-2 flex-shrink-0 transition-colors ${form.participants.includes(p.id) ? 'bg-mint-500 border-mint-500' : 'border-carbon-300'}`} />
                  <span className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-medium flex-shrink-0"
                    style={{ backgroundColor: p.color }}>{p.name[0]}</span>
                  <span className="flex-1 text-sm">{p.name}</span>
                  {form.split_mode === 'custom' && form.participants.includes(p.id) && (
                    <input type="number" className="input w-24 py-1 text-sm" placeholder="₹ amount"
                      value={form.customAmounts[p.id] || ''}
                      onChange={e => set('customAmounts', { ...form.customAmounts, [p.id]: e.target.value })} />
                  )}
                  {form.split_mode === 'percentage' && form.participants.includes(p.id) && (
                    <input type="number" className="input w-20 py-1 text-sm" placeholder="%"
                      value={form.percentages[p.id] || ''}
                      onChange={e => set('percentages', { ...form.percentages, [p.id]: e.target.value })} />
                  )}
                </div>
              ))}
            </div>
          </div>
          <button className="btn-primary w-full" onClick={submit}>
            {expense ? 'Update Expense' : 'Add Expense'}
          </button>
        </div>
      </div>
    </div>
  )
}