import React, { useState } from 'react'
import { api } from '../lib/api'
import { Plus, Users, Trash2, Edit2, Check, X } from 'lucide-react'

export default function GroupList({ groups, selected, onSelect, onRefresh }) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newParticipants, setNewParticipants] = useState([{ name: '', color: '#10b981' }])
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  const create = async () => {
    if (!newName.trim()) return
    const participants = newParticipants.filter(p => p.name.trim())
    await api.createGroup({ name: newName, participants })
    setNewName(''); setNewParticipants([{ name: '', color: '#10b981' }]); setCreating(false)
    onRefresh()
  }

  const del = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Delete this group and all its expenses?')) return
    await api.deleteGroup(id)
    onRefresh()
  }

  const saveEdit = async (id) => {
    await api.updateGroup(id, { name: editName })
    setEditingId(null); onRefresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-carbon-900">Your Groups</h2>
        <button className="btn-primary flex items-center gap-1 text-sm py-1.5" onClick={() => setCreating(!creating)}>
          <Plus size={16} /> New
        </button>
      </div>

      {creating && (
        <div className="card p-4 space-y-3">
          <input className="input" placeholder="Group name (e.g. Goa Trip)" value={newName} onChange={e => setNewName(e.target.value)} />
          <p className="text-xs text-carbon-400 font-medium">Add up to 3 participants</p>
          {newParticipants.map((p, i) => (
            <div key={i} className="flex gap-2">
              <input className="input" placeholder={`Participant ${i + 1} name`} value={p.name}
                onChange={e => { const arr = [...newParticipants]; arr[i].name = e.target.value; setNewParticipants(arr) }} />
              <input type="color" value={p.color}
                onChange={e => { const arr = [...newParticipants]; arr[i].color = e.target.value; setNewParticipants(arr) }}
                className="w-10 h-10 rounded cursor-pointer border border-carbon-200" />
            </div>
          ))}
          {newParticipants.length < 3 && (
            <button className="text-mint-600 text-sm font-medium" onClick={() => setNewParticipants([...newParticipants, { name: '', color: '#f59e0b' }])}>
              + Add another
            </button>
          )}
          <div className="flex gap-2">
            <button className="btn-primary flex-1" onClick={create}>Create Group</button>
            <button className="btn-secondary" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </div>
      )}

      {groups.map(group => (
        <div key={group.id}
          onClick={() => onSelect(group.id)}
          className={`card p-4 cursor-pointer hover:border-mint-400 transition-colors ${selected === group.id ? 'border-mint-500 bg-mint-50' : ''}`}>
          {editingId === group.id ? (
            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
              <input className="input flex-1 py-1" value={editName} onChange={e => setEditName(e.target.value)} />
              <button onClick={() => saveEdit(group.id)} className="text-mint-600"><Check size={18} /></button>
              <button onClick={() => setEditingId(null)} className="text-carbon-400"><X size={18} /></button>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-carbon-900">{group.name}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <Users size={12} className="text-carbon-400" />
                  <span className="text-xs text-carbon-400">{group.participants?.length || 0} members</span>
                </div>
              </div>
              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                <button className="p-1 text-carbon-400 hover:text-carbon-700"
                  onClick={() => { setEditingId(group.id); setEditName(group.name) }}>
                  <Edit2 size={14} />
                </button>
                <button className="p-1 text-carbon-400 hover:text-red-500" onClick={e => del(e, group.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}
          {group.participants?.length > 0 && (
            <div className="flex gap-1 mt-2">
              {group.participants.map(p => (
                <span key={p.id} className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                  style={{ backgroundColor: p.color || '#6366f1' }}>{p.name[0]}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}