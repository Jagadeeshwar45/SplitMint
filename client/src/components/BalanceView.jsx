import React, { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Sparkles, ArrowRight, Lightbulb, Bot } from 'lucide-react'
import { api } from '../lib/api'

export default function BalanceView({ balances, totalSpent, summary, summaryLoading, onGetSummary, group }) {
  const [advice, setAdvice] = useState('')
  const [adviceLoading, setAdviceLoading] = useState(false)

  if (!balances) return <div className="card p-8 text-center text-carbon-400">Loading balances...</div>

  const chartData = balances.balances?.map(b => ({
    name: b.participant.name,
    balance: b.netBalance,
    color: b.participant.color || '#6366f1'
  }))

  const getAdvice = async () => {
    setAdviceLoading(true)
    try {
      const { advice } = await api.settlementAdvice(group.id, {
        settlements: balances.settlements,
        participants: balances.balances?.map(b => b.participant)
      })
      setAdvice(advice)
    } catch {
      setAdvice('Could not generate advice. Please try again.')
    }
    setAdviceLoading(false)
  }

  return (
    <div className="space-y-4">

      {/* Settlement suggestions */}
      {balances.settlements?.length > 0 ? (
        <div className="card p-6">
          <h3 className="font-display text-xl mb-4 text-carbon-900">Suggested Settlements</h3>
          <div className="space-y-3 mb-4">
            {balances.settlements.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: s.from.color || '#6366f1' }}>{s.from.name[0]}</span>
                <span className="font-medium text-carbon-900">{s.from.name}</span>
                <ArrowRight size={16} className="text-amber-500 flex-shrink-0" />
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: s.to.color || '#10b981' }}>{s.to.name[0]}</span>
                <span className="font-medium text-carbon-900">{s.to.name}</span>
                <span className="ml-auto font-display text-lg text-amber-700">₹{s.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* AI Settlement Path Advice */}
          <div className="border-t border-carbon-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lightbulb size={16} className="text-amber-500" />
                <span className="text-sm font-medium text-carbon-700">AI Settlement Advice</span>
              </div>
              <button
                onClick={getAdvice}
                disabled={adviceLoading}
                className="btn-secondary flex items-center gap-2 text-xs py-1.5"
              >
                <Bot size={14} />
                {adviceLoading ? 'Thinking...' : 'Get Smart Advice'}
              </button>
            </div>
            {advice ? (
              <p className="text-sm text-carbon-600 leading-relaxed bg-amber-50 rounded-xl p-3 border border-amber-100">
                {advice}
              </p>
            ) : (
              <p className="text-xs text-carbon-400">
                Click "Get Smart Advice" for AI-powered tips on the most efficient way to settle up.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="card p-6 text-center">
          <p className="text-3xl mb-2">🎉</p>
          <p className="font-medium text-carbon-700">All settled up!</p>
          <p className="text-sm text-carbon-400">No payments needed in this group.</p>
        </div>
      )}

      {/* Balance chart */}
      <div className="card p-6">
        <h3 className="font-display text-xl mb-4">Net Balances</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} />
            <Tooltip formatter={v => [`₹${parseFloat(v).toFixed(2)}`, 'Balance']} />
            <Bar dataKey="balance" radius={[6, 6, 0, 0]}>
              {chartData?.map((entry, i) => (
                <Cell key={i} fill={entry.balance >= 0 ? '#14b8a6' : '#f87171'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-carbon-400 mt-2 text-center">Green = owed money · Red = owes money</p>
      </div>

      {/* Detailed breakdown */}
      <div className="card p-6">
        <h3 className="font-display text-xl mb-4">Detailed Breakdown</h3>
        <div className="space-y-4">
          {balances.balances?.map(b => (
            <div key={b.participant.id} className="border-b border-carbon-100 pb-4 last:border-0 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: b.participant.color || '#6366f1' }}>
                    {b.participant.name[0]}
                  </span>
                  <span className="font-medium">{b.participant.name}</span>
                </div>
                <span className={`font-display text-lg font-medium ${b.netBalance >= 0 ? 'text-mint-600' : 'text-red-500'}`}>
                  {b.netBalance >= 0 ? '+' : ''}₹{b.netBalance.toFixed(2)}
                </span>
              </div>
              {b.owes?.map(o => (
                <div key={o.to.id} className="text-sm text-carbon-500 ml-10 flex items-center gap-1">
                  <ArrowRight size={12} className="text-carbon-300" />
                  owes <span className="text-carbon-700 font-medium ml-1">{o.to.name}</span>
                  <span className="ml-auto font-mono text-carbon-700">₹{o.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* AI Group Summary */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-mint-500" />
            <h3 className="font-display text-xl">AI Group Summary</h3>
          </div>
          <button
            onClick={onGetSummary}
            disabled={summaryLoading}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Sparkles size={14} />
            {summaryLoading ? 'Generating...' : 'Generate'}
          </button>
        </div>
        {summary ? (
          <p className="text-carbon-600 leading-relaxed bg-mint-50 rounded-xl p-4 border border-mint-100">
            {summary}
          </p>
        ) : (
          <p className="text-carbon-400 text-sm">
            Click "Generate" for an AI-written summary of your group's spending and settlements.
          </p>
        )}
      </div>

    </div>
  )
}