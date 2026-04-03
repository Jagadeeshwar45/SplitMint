import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import GroupList from '../components/GroupList'
import GroupDetail from '../components/GroupDetail'
import { LogOut, Leaf } from 'lucide-react'

export default function Dashboard({ session }) {
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadGroups = async () => {
    try {
      const data = await api.getGroups()
      setGroups(data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => { loadGroups() }, [])

  const logout = () => supabase.auth.signOut()

  return (
    <div className="min-h-screen bg-carbon-50">
      {/* Header */}
      <header className="bg-white border-b border-carbon-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Leaf className="text-mint-600" size={24} />
          <span className="font-display text-2xl text-carbon-900">SplitMint</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-carbon-500">{session.user.email}</span>
          <button onClick={logout} className="btn-secondary flex items-center gap-2 text-sm py-1.5">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-6">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0">
          <GroupList
            groups={groups}
            selected={selectedGroup}
            onSelect={setSelectedGroup}
            onRefresh={loadGroups}
          />
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {selectedGroup ? (
            <GroupDetail
              group={groups.find(g => g.id === selectedGroup) || selectedGroup}
              onRefresh={() => { loadGroups() }}
            />
          ) : (
            <div className="card p-12 text-center">
              <Leaf className="mx-auto text-mint-300 mb-4" size={48} />
              <h3 className="font-display text-2xl text-carbon-700 mb-2">Select a group</h3>
              <p className="text-carbon-400">Choose a group from the sidebar or create a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}