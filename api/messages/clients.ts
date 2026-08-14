import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SupabaseClient } from '@supabase/supabase-js';
import { canDeleteGroupChatMessage } from './chatDeleteAuth';

type PlatformRole = 'client' | 'guard' | 'support' | 'moderator' | 'administrator' | 'manager' | 'director' | 'owner';

function resolvePlatformRole(input: {
  isStaff?: boolean;
  staffRole?: 'Founder' | 'Owner' | 'Director' | 'Manager' | 'Administrator' | 'Moderator' | 'Support';
  legacyRole?: string;
}): PlatformRole {
  if (input.legacyRole === 'client') return 'client';
  if (input.isStaff && input.staffRole) {
    switch (input.staffRole) {
      case 'Founder':
      case 'Owner':
        return 'owner';
      case 'Director':
        return 'director';
      case 'Manager':
        return 'manager';
      case 'Administrator':
        return 'administrator';
      case 'Moderator':
        return 'moderator';
      case 'Support':
        return 'support';
    }
  }
  if (input.legacyRole === 'auditor') return 'moderator';
  if (input.legacyRole === 'staff') return 'administrator';
  return 'guard';
}

function isStaffPlatformRole(role: PlatformRole): boolean {
  return (
    role === 'support' ||
    role === 'moderator' ||
    role === 'administrator' ||
    role === 'manager' ||
    role === 'director' ||
    role === 'owner'
  );
}

interface ClientChatSession {
  userId: string;
  email: string;
  platformRole: PlatformRole;
  canPost: boolean;
}

async function verifyStaffSession(
  db: SupabaseClient,
  credentials: { userId: string; email: string; role: string } | null | undefined
): Promise<ClientChatSession | null> {
  if (!credentials?.userId || !credentials?.email || !credentials?.role) {
    return null;
  }

  const email = credentials.email.trim().toLowerCase();
  const { userId } = credentials;

  let { data, error } = await db
    .from('staff')
    .select('id, email, staff_role')
    .eq('id', userId)
    .maybeSingle();

  if (!data && !error) {
    const byEmail = await db
      .from('staff')
      .select('id, email, staff_role')
      .eq('email', email)
      .maybeSingle();
    data = byEmail.data ?? null;
    error = byEmail.error ?? null;
  }

  if (!data && error?.code === '42P01') return null;
  if (!data || data.email?.toLowerCase() !== email) return null;

  const platformRole = resolvePlatformRole({
    isStaff: true,
    staffRole: data.staff_role ?? undefined,
    legacyRole: 'staff',
  });

  if (!isStaffPlatformRole(platformRole)) return null;

  return { userId: data.id, email, platformRole, canPost: true };
}

async function verifyClientSession(
  db: SupabaseClient,
  credentials: { userId: string; email: string; role: string } | null | undefined,
  options: { requireActive: boolean }
): Promise<ClientChatSession | null> {
  if (!credentials?.userId || !credentials?.email || !credentials?.role) {
    return null;
  }

  const email = credentials.email.trim().toLowerCase();
  const { userId } = credentials;

  let { data, error } = await db
    .from('clients')
    .select('id, email, account_status, approved')
    .eq('id', userId)
    .maybeSingle();

  if (!data && !error) {
    const byEmail = await db
      .from('clients')
      .select('id, email, account_status, approved')
      .eq('email', email)
      .maybeSingle();
    data = byEmail.data ?? null;
    error = byEmail.error ?? null;
  }

  if (!data && error?.code === '42P01') return null;
  if (!data || data.email?.toLowerCase() !== email) return null;

  const platformRole = resolvePlatformRole({ legacyRole: 'client' });
  const isActive = data.account_status === 'active';
  if (options.requireActive && !isActive) return null;

  return {
    userId: data.id,
    email,
    platformRole,
    canPost: isActive,
  };
}

async function verifyClientChatSession(
  db: SupabaseClient,
  credentials: { userId: string; email: string; role: string } | null | undefined,
  options: { requirePost: boolean }
): Promise<ClientChatSession | null> {
  const staff = await verifyStaffSession(db, credentials);
  if (staff) return staff;

  return verifyClientSession(db, credentials, {
    requireActive: options.requirePost,
  });
}

interface ClientMessageRow {
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

function mapRow(row: ClientMessageRow) {
  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderRole: row.sender_role,
    body: row.body,
    createdAt: row.created_at,
  };
}

function missingClientMessagesTable(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('client_messages') ||
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
      const session = await verifyClientChatSession(
        db,
        {
          userId: String(query.userId ?? ''),
          email: String(query.email ?? ''),
          role: String(query.role ?? ''),
        },
        { requirePost: false }
      );
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized — staff or client sign-in required' });
      }

      const { data, error } = await db
        .from('client_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        if (missingClientMessagesTable(error.message)) {
          return res.status(500).json({
            error:
              'client_messages table is missing. Run supabase/complete_schema_setup.sql in the Supabase SQL Editor',
          });
        }
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({
        messages: (data ?? []).map((row) => mapRow(row as ClientMessageRow)),
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

      const session = await verifyClientChatSession(
        db,
        {
          userId: body.userId ?? '',
          email: body.email ?? '',
          role: body.role ?? '',
        },
        { requirePost: true }
      );
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized — staff or active client sign-in required' });
      }
      if (!session.canPost) {
        return res.status(403).json({ error: 'Only active clients and staff can post to client chat' });
      }

      const message = body.message;
      if (!message?.id || !message.body?.trim() || !message.senderName || !message.senderRole) {
        return res.status(400).json({ error: 'Valid message payload is required' });
      }
      if (message.senderId && message.senderId !== session.userId) {
        return res.status(403).json({ error: 'Sender does not match signed-in account' });
      }

      const { error } = await db.from('client_messages').upsert({
        id: message.id,
        sender_id: session.userId,
        sender_name: message.senderName,
        sender_role: message.senderRole,
        body: message.body.trim(),
        created_at: message.createdAt ?? new Date().toISOString(),
      });

      if (error) {
        if (missingClientMessagesTable(error.message)) {
          return res.status(500).json({
            error:
              'client_messages table is missing. Run supabase/complete_schema_setup.sql in the Supabase SQL Editor',
          });
        }
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const body = (req.body ?? {}) as {
        userId?: string;
        email?: string;
        role?: string;
        messageId?: string;
      };

      const session = await verifyClientChatSession(
        db,
        {
          userId: body.userId ?? '',
          email: body.email ?? '',
          role: body.role ?? '',
        },
        { requirePost: false }
      );
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized — staff or client sign-in required' });
      }

      const messageId = body.messageId?.trim();
      if (!messageId) {
        return res.status(400).json({ error: 'messageId is required' });
      }

      const { data: row, error: fetchError } = await db
        .from('client_messages')
        .select('id, sender_id, sender_role')
        .eq('id', messageId)
        .maybeSingle();

      if (fetchError) {
        return res.status(500).json({ error: fetchError.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Message not found' });
      }

      if (
        !canDeleteGroupChatMessage({
          actorUserId: session.userId,
          actorRole: session.platformRole,
          senderId: row.sender_id,
          senderRole: row.sender_role,
        })
      ) {
        return res.status(403).json({ error: 'You cannot delete this message' });
      }

      const { error } = await db.from('client_messages').delete().eq('id', messageId);
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Client messages request failed';
    console.error('Client messages API error:', message, err);
    return res.status(500).json({ error: message });
  }
}
