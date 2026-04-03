import React, { useState } from 'react'
import { api } from '../lib/api'
import { Sparkles, Wand2 } from 'lucide-react'

export default function MintSense({ group, onExpenseCreated }) {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const parse = async () => {
    if (!text.trim()) return
    setLoading(true); setResult(null)
    try {
      const data = await api.mintSense(text, group.participants)
      const payer = group.participants.find(p => p.name.toLowerCase() === data.paid_by_name?.toLowerCase())
      const participantIds = group.participants
        .filter(p => data.participants.map(n => n.toLowerCase()).includes(p.name.toLowerCase()))
        .map(p => p.id)
      setResult({ ...data, paid_by: payer?.id, participantIds, payer })
    } catch (e) { alert('Could not parse. Try rephrasing.') }
    setLoading(false)
  }

  const save = async () => {
    setSaving(true)
    await api.createExpense({
      group_id: group.id,
      description: result.description,
      amount: result.amount,
      paid_by: result.paid_by,
      split_mode: 'equal',
      participants: result.participantIds,
      date: result.date || new Date().toISOString().slice(0, 10),
      category: result.category
    })
    setText(''); setResult(null); setSaving(false)
    onExpenseCreated()
  }

  const EXAMPLES = [
    "Alice paid ₹1200 for dinner for everyone",
    "Bob spent 500 on cab, split between Bob and Charlie",
    "I paid ₹3000 for hotel, split equally among all"
  ]

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="text-mint-500" size={20} />
          <h3 className="font-display text-xl">MintSense AI</h3>
        </div>
        <p className="text-sm text-carbon-500 mb-4">Describe an expense in plain English and AI will structure it for you.</p>

        <div className="space-y-3">
          <textarea className="input resize-none h-24" placeholder="e.g. Alice paid ₹800 for groceries, split equally among everyone"
            value={text} onChange={e => setText(e.target.value)} />
          <button className="btn-primary flex items-center gap-2" onClick={parse} disabled={loading}>
            <Wand2 size={16} /> {loading ? 'Parsing...' : 'Parse with AI'}
          </button>
        </div>

        <div className="mt-4">
          <p className="text-xs text-carbon-400 font-medium mb-2">EXAMPLE PHRASES</p>
          <div className="space-y-1">
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => setText(ex)}
                className="block w-full text-left text-sm text-carbon-500 hover:text-mint-600 hover:bg-mint-50 px-3 py-1.5 rounded-lg transition-colors">
                "{ex}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {result && (
        <div className="card p-6 border-mint-300 bg-mint-50">
          <h4 className="font-medium mb-3 text-mint-800">✓ Parsed successfully</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-carbon-500">Description</span><span className="font-medium">{result.description}</span></div>
            <div className="flex justify-between"><span className="text-carbon-500">Amount</span><span className="font-medium">₹{result.amount}</span></div>
            <div className="flex justify-between"><span className="text-carbon-500">Paid by</span><span className="font-medium">{result.payer?.name || result.paid_by_name}</span></div>
            <div className="flex justify-between"><span className="text-carbon-500">Category</span><span className="font-medium capitalize">{result.category}</span></div>
            <div className="flex justify-between"><span className="text-carbon-500">Participants</span><span className="font-medium">{result.participants?.join(', ')}</span></div>
          </div>
          <button className="btn-primary w-full mt-4" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save This Expense'}
          </button>
        </div>
      )}
    </div>
  )
}