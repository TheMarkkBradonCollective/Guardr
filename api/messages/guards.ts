import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SupabaseClient } from '@supabase/supabase-js';
import { verifyAccountSession } from '../../lib/accountSessionAuth';

interface GuardMessageRow {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  body: string;
  created_at: string;
}

async function getSupabaseAdmin(): Promise<SupabaseClient | null> {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !serviceKey) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function mapRow(row: GuardMessageRow) {
  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderRole: row.sender_role,
    body: row.body,
    createdAt: row.created_at,
  };
}

function missingGuardMessagesTable(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('guard_messages') ||
    lower.includes('does not exist') ||
    lower.includes('42p01')
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const db = await getSupabaseAdmin();
    if (!db) {
      return res.status(503).json({ error: 'Database is not configured' });
    }

    if (req.method === 'GET') {
      const query = req.query as { userId?: string; email?: string; role?: string };
      const session = await verifyAccountSession(db, {
        userId: String(query.userId ?? ''),
        email: String(query.email ?? ''),
        role: String(query.role ?? ''),
      });
      if (!session || session.platformRole !== 'guard') {
        return res.status(401).json({ error: 'Unauthorized — guard sign-in required' });
      }

      const { data, error } = await db
        .from('guard_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        if (missingGuardMessagesTable(error.message)) {
          return res.status(500).json({
            error:
              'guard_messages table is missing. Run supabase/migrations/20260706120000_guard_messages.sql',
          });
        }
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({
        messages: (data ?? []).map((row) => mapRow(row as GuardMessageRow)),
      });
    }

    if (req.method === 'POST') {
      const body = (req.body ?? {}) as {
        userId?: string;
        email?: string;
        role?: string;
        message?: {
          id?: string;
          senderId?: string;
          senderName?: string;
          senderRole?: string;
          body?: string;
          createdAt?: string;
        };
      };

      const session = await verifyAccountSession(db, {
        userId: body.userId ?? '',
        email: body.email ?? '',
        role: body.role ?? '',
      });
      if (!session || session.platformRole !== 'guard') {
        return res.status(401).json({ error: 'Unauthorized — guard sign-in required' });
      }

      const message = body.message;
      if (!message?.id || !message.body?.trim() || !message.senderName || !message.senderRole) {
        return res.status(400).json({ error: 'Valid message payload is required' });
      }
      if (message.senderId && message.senderId !== session.userId) {
        return res.status(403).json({ error: 'Sender does not match signed-in guard' });
      }

      const { error } = await db.from('guard_messages').upsert({
        id: message.id,
        sender_id: session.userId,
        sender_name: message.senderName,
        sender_role: message.senderRole,
        body: message.body.trim(),
        created_at: message.createdAt ?? new Date().toISOString(),
      });

      if (error) {
        if (missingGuardMessagesTable(error.message)) {
          return res.status(500).json({
            error:
              'guard_messages table is missing. Run supabase/migrations/20260706120000_guard_messages.sql',
          });
        }
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Guard messages request failed';
    console.error('Guard messages API error:', message, err);
    return res.status(500).json({ error: message });
  }
}
