import axios from 'axios'
import { supabase } from './supabase'

const BASE = import.meta.env.VITE_API_URL

async function getHeaders() {
  const { data } = await supabase.auth.getSession()
  return { Authorization: `Bearer ${data.session?.access_token}` }
}

export const api = {
  // Groups
  getGroups: async () => {
    const h = await getHeaders()
    return (await axios.get(`${BASE}/api/groups`, { headers: h })).data
  },
  createGroup: async (body) => {
    const h = await getHeaders()
    return (await axios.post(`${BASE}/api/groups`, body, { headers: h })).data
  },
  updateGroup: async (id, body) => {
    const h = await getHeaders()
    return (await axios.put(`${BASE}/api/groups/${id}`, body, { headers: h })).data
  },
  deleteGroup: async (id) => {
    const h = await getHeaders()
    return (await axios.delete(`${BASE}/api/groups/${id}`, { headers: h })).data
  },

  // Participants
  addParticipant: async (groupId, body) => {
    const h = await getHeaders()
    return (await axios.post(`${BASE}/api/groups/${groupId}/participants`, body, { headers: h })).data
  },
  updateParticipant: async (id, body) => {
    const h = await getHeaders()
    return (await axios.put(`${BASE}/api/participants/${id}`, body, { headers: h })).data
  },
  deleteParticipant: async (id) => {
    const h = await getHeaders()
    return (await axios.delete(`${BASE}/api/participants/${id}`, { headers: h })).data
  },

  // Expenses
  getExpenses: async (groupId, params = {}) => {
    const h = await getHeaders()
    return (await axios.get(`${BASE}/api/groups/${groupId}/expenses`, { headers: h, params })).data
  },
  createExpense: async (body) => {
    const h = await getHeaders()
    return (await axios.post(`${BASE}/api/expenses`, body, { headers: h })).data
  },
  updateExpense: async (id, body) => {
    const h = await getHeaders()
    return (await axios.put(`${BASE}/api/expenses/${id}`, body, { headers: h })).data
  },
  deleteExpense: async (id) => {
    const h = await getHeaders()
    return (await axios.delete(`${BASE}/api/expenses/${id}`, { headers: h })).data
  },

  // Balances
  getBalances: async (groupId) => {
    const h = await getHeaders()
    return (await axios.get(`${BASE}/api/groups/${groupId}/balances`, { headers: h })).data
  },

  // AI
  mintSense: async (text, participants) => {
    const h = await getHeaders()
    return (await axios.post(`${BASE}/api/mintsense`, { text, participants }, { headers: h })).data
  },
  groupSummary: async (groupId, body) => {
    const h = await getHeaders()
    return (await axios.post(`${BASE}/api/groups/${groupId}/summary`, body, { headers: h })).data
  },
  settlementAdvice: async (groupId, body) => {
    const h = await getHeaders()
    return (await axios.post(`${BASE}/api/groups/${groupId}/settlement-advice`, body, { headers: h })).data
  }
}