require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const Groq = require('groq-sdk')

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ── Auth middleware ──────────────────────────────────────────────────────────
async function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: 'Invalid token' });
  req.user = data.user;
  next();
}

// ── GROUPS ───────────────────────────────────────────────────────────────────
app.get('/api/groups', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('groups')
    .select('*, participants(*)')
    .eq('created_by', req.user.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error });
  res.json(data);
});

app.post('/api/groups', auth, async (req, res) => {
  const { name, participants } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  if (participants && participants.length > 3)
    return res.status(400).json({ error: 'Max 3 participants allowed' });

  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name, created_by: req.user.id })
    .select()
    .single();
  if (error) return res.status(400).json({ error });

  // Add primary user as participant
  const allParticipants = [
    { group_id: group.id, name: req.user.email.split('@')[0], user_id: req.user.id, color: '#6366f1' },
    ...(participants || []).map(p => ({ group_id: group.id, name: p.name, color: p.color || '#10b981' }))
  ];

  const { error: pErr } = await supabase.from('participants').insert(allParticipants);
  if (pErr) return res.status(400).json({ error: pErr });

  res.json(group);
});

app.put('/api/groups/:id', auth, async (req, res) => {
  const { name } = req.body;
  const { data, error } = await supabase
    .from('groups')
    .update({ name })
    .eq('id', req.params.id)
    .eq('created_by', req.user.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error });
  res.json(data);
});

app.delete('/api/groups/:id', auth, async (req, res) => {
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', req.params.id)
    .eq('created_by', req.user.id);
  if (error) return res.status(400).json({ error });
  res.json({ success: true });
});

// ── PARTICIPANTS ─────────────────────────────────────────────────────────────
app.post('/api/groups/:groupId/participants', auth, async (req, res) => {
  const { name, color } = req.body;
  // Check count
  const { count } = await supabase
    .from('participants')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', req.params.groupId);
  if (count >= 4) return res.status(400).json({ error: 'Max 4 participants (3 + you)' });

  const { data, error } = await supabase
    .from('participants')
    .insert({ group_id: req.params.groupId, name, color: color || '#10b981' })
    .select()
    .single();
  if (error) return res.status(400).json({ error });
  res.json(data);
});

app.put('/api/participants/:id', auth, async (req, res) => {
  const { name, color } = req.body;
  const { data, error } = await supabase
    .from('participants')
    .update({ name, color })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error });
  res.json(data);
});

app.delete('/api/participants/:id', auth, async (req, res) => {
  // Nullify or reassign expenses where this participant was the payer
  // We'll set paid_by to null — frontend should handle null payer gracefully
  await supabase
    .from('expenses')
    .update({ paid_by: null })
    .eq('paid_by', req.params.id)

  // Delete their split entries (expense_splits cascade handles this,
  // but let's be explicit so balance recalculation is immediate)
  await supabase
    .from('expense_splits')
    .delete()
    .eq('participant_id', req.params.id)

  // Now delete the participant
  const { error } = await supabase
    .from('participants')
    .delete()
    .eq('id', req.params.id)

  if (error) return res.status(400).json({ error })
  res.json({ success: true })
})

// ── EXPENSES ─────────────────────────────────────────────────────────────────
app.get('/api/groups/:groupId/expenses', auth, async (req, res) => {
  const { search, participant, dateFrom, dateTo, amountMin, amountMax } = req.query;

  let query = supabase
    .from('expenses')
    .select('*, expense_splits(*), participants!expenses_paid_by_fkey(*)')
    .eq('group_id', req.params.groupId)
    .order('date', { ascending: false });

  if (search) query = query.ilike('description', `%${search}%`);
  if (participant) query = query.eq('paid_by', participant);
  if (dateFrom) query = query.gte('date', dateFrom);
  if (dateTo) query = query.lte('date', dateTo);
  if (amountMin) query = query.gte('amount', amountMin);
  if (amountMax) query = query.lte('amount', amountMax);

  const { data, error } = await query;
  if (error) return res.status(400).json({ error });
  res.json(data);
});

app.post('/api/expenses', auth, async (req, res) => {
  const { group_id, description, amount, paid_by, split_mode, participants, date, category } = req.body;

  const { data: expense, error } = await supabase
    .from('expenses')
    .insert({ group_id, description, amount, paid_by, split_mode, date, category })
    .select()
    .single();
  if (error) return res.status(400).json({ error });

  // Calculate splits
  let splits = [];
  if (split_mode === 'equal') {
    const share = Math.round((amount / participants.length) * 100) / 100;
    const remainder = Math.round((amount - share * participants.length) * 100) / 100;
    splits = participants.map((pid, i) => ({
      expense_id: expense.id,
      participant_id: pid,
      amount: i === 0 ? share + remainder : share
    }));
  } else if (split_mode === 'custom') {
    splits = participants.map(p => ({
      expense_id: expense.id,
      participant_id: p.id,
      amount: p.amount
    }));
  } else if (split_mode === 'percentage') {
    splits = participants.map(p => ({
      expense_id: expense.id,
      participant_id: p.id,
      amount: Math.round((amount * p.percentage / 100) * 100) / 100,
      percentage: p.percentage
    }));
  }

  const { error: sErr } = await supabase.from('expense_splits').insert(splits);
  if (sErr) return res.status(400).json({ error: sErr });

  res.json(expense);
});

app.put('/api/expenses/:id', auth, async (req, res) => {
  const { description, amount, paid_by, split_mode, participants, date, category } = req.body;

  const { data: expense, error } = await supabase
    .from('expenses')
    .update({ description, amount, paid_by, split_mode, date, category })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error });

  // Recalculate splits
  await supabase.from('expense_splits').delete().eq('expense_id', req.params.id);

  let splits = [];
  if (split_mode === 'equal') {
    const share = Math.round((amount / participants.length) * 100) / 100;
    const remainder = Math.round((amount - share * participants.length) * 100) / 100;
    splits = participants.map((pid, i) => ({
      expense_id: expense.id,
      participant_id: pid,
      amount: i === 0 ? share + remainder : share
    }));
  } else if (split_mode === 'custom') {
    splits = participants.map(p => ({ expense_id: expense.id, participant_id: p.id, amount: p.amount }));
  } else if (split_mode === 'percentage') {
    splits = participants.map(p => ({
      expense_id: expense.id,
      participant_id: p.id,
      amount: Math.round((amount * p.percentage / 100) * 100) / 100,
      percentage: p.percentage
    }));
  }

  await supabase.from('expense_splits').insert(splits);
  res.json(expense);
});

app.delete('/api/expenses/:id', auth, async (req, res) => {
  const { error } = await supabase.from('expenses').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error });
  res.json({ success: true });
});

// ── BALANCE ENGINE ────────────────────────────────────────────────────────────
app.get('/api/groups/:groupId/balances', auth, async (req, res) => {
  const { data: participants } = await supabase
    .from('participants').select('*').eq('group_id', req.params.groupId);
  const { data: expenses } = await supabase
    .from('expenses').select('*, expense_splits(*)').eq('group_id', req.params.groupId);

  // net[A][B] = amount A owes B (positive means A owes B)
  const net = {};
  participants.forEach(p => { net[p.id] = {}; participants.forEach(q => { net[p.id][q.id] = 0; }); });

  expenses?.forEach(expense => {
    expense.expense_splits.forEach(split => {
      if (split.participant_id !== expense.paid_by) {
        net[split.participant_id][expense.paid_by] += split.amount;
        net[expense.paid_by][split.participant_id] -= split.amount;
      }
    });
  });

  // Compute net balances
  const balances = participants.map(p => {
    const totalOwed = participants.reduce((sum, q) => sum + Math.max(0, net[p.id][q.id] || 0), 0);
    const totalOwes = participants.reduce((sum, q) => sum + Math.max(0, net[q.id][p.id] || 0), 0);
    return {
      participant: p,
      netBalance: totalOwes - totalOwed,
      owes: participants
        .filter(q => q.id !== p.id && net[p.id][q.id] > 0.005)
        .map(q => ({ to: q, amount: Math.round(net[p.id][q.id] * 100) / 100 }))
    };
  });

  // Minimal settlements (greedy)
  const debtors = balances.filter(b => b.netBalance < -0.005).map(b => ({ ...b, bal: b.netBalance }));
  const creditors = balances.filter(b => b.netBalance > 0.005).map(b => ({ ...b, bal: b.netBalance }));
  const settlements = [];

  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(-debtors[i].bal, creditors[j].bal);
    settlements.push({
      from: debtors[i].participant,
      to: creditors[j].participant,
      amount: Math.round(amount * 100) / 100
    });
    debtors[i].bal += amount;
    creditors[j].bal -= amount;
    if (Math.abs(debtors[i].bal) < 0.005) i++;
    if (Math.abs(creditors[j].bal) < 0.005) j++;
  }

  res.json({ balances, settlements });
});

// ── AI — MintSense ────────────────────────────────────────────────────────────
app.post('/api/mintsense', auth, async (req, res) => {
  const { text, participants } = req.body
  const participantList = participants.map(p => p.name).join(', ')

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 500,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: 'You are an expense parser. You ONLY respond with valid JSON, no markdown, no backticks, no explanation. Just raw JSON.'
        },
        {
          role: 'user',
          content: `Parse this expense statement into JSON. Participants available: ${participantList}.
Statement: "${text}"

Return ONLY this JSON structure:
{
  "description": "string",
  "amount": number,
  "paid_by_name": "string (must exactly match one of: ${participantList})",
  "split_mode": "equal",
  "participants": ["name1", "name2"],
  "category": "food|travel|entertainment|utilities|shopping|general",
  "date": "YYYY-MM-DD or null"
}`
        }
      ]
    })

    const rawText = completion.choices[0].message.content.trim()
    // Strip markdown code blocks if model adds them anyway
    const cleaned = rawText.replace(/```json|```/g, '').trim()
    const json = JSON.parse(cleaned)
    res.json(json)

  } catch (err) {
    console.error('MintSense error:', err.message)
    res.status(503).json({
      error: 'AI feature unavailable',
      message: err.message
    })
  }
})

// ── AI — Group Summary ────────────────────────────────────────────────────────
app.post('/api/groups/:groupId/summary', auth, async (req, res) => {
  const { balances, totalSpent } = req.body

  try {
    const settlementText = balances?.settlements
      ?.map(s => `${s.from.name} pays ${s.to.name} ₹${s.amount}`)
      .join(', ') || 'no settlements needed'

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: 'You are a friendly expense summarizer. Write clear, concise summaries in 2-3 sentences.'
        },
        {
          role: 'user',
          content: `Generate a friendly group expense summary. Total spent: ₹${totalSpent}. Settlements: ${settlementText}.`
        }
      ]
    })

    res.json({ summary: completion.choices[0].message.content })

  } catch (err) {
    console.error('Summary error:', err.message)
    res.status(503).json({
      error: 'AI feature unavailable',
      message: err.message
    })
  }
})

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`SplitMint API running on port ${PORT}`));


// ── AI — Smart Settlement Suggestions ────────────────────────────────────────
app.post('/api/groups/:groupId/settlement-advice', auth, async (req, res) => {
  const { settlements, participants } = req.body

  if (!settlements || settlements.length === 0) {
    return res.json({ advice: "🎉 Everyone is settled up! No payments needed." })
  }

  try {
    const settlementList = settlements
      .map((s, i) => `${i + 1}. ${s.from.name} pays ${s.to.name} ₹${s.amount}`)
      .join('\n')

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful expense settlement advisor. Give friendly, clear, step-by-step advice on how a group should settle their debts. Be encouraging and practical.'
        },
        {
          role: 'user',
          content: `Here are the minimum settlements needed for our group:

${settlementList}

Please explain these settlement steps in a friendly, easy-to-understand way. Mention the most efficient order to settle, and any tips to make it easy (like using UPI, splitting a payment, etc). Keep it under 5 sentences.`
        }
      ]
    })

    res.json({ advice: completion.choices[0].message.content })
  } catch (err) {
    console.error('Settlement advice error:', err.message)
    res.status(503).json({
      advice: 'AI settlement advice unavailable. Please check your Groq API key.'
    })
  }
})