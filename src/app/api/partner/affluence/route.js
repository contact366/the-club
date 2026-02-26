import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { partnerId, status } = await req.json();

    if (!partnerId || !status) {
      return NextResponse.json({ error: 'partnerId et status sont requis' }, { status: 400 });
    }

    const allowedStatuses = ['calme', 'modere', 'plein'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Statut invalide. Valeurs acceptées : calme, modere, plein' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabaseAdmin
      .from('partners')
      .update({ affluence_status: status, affluence_updated_at: new Date().toISOString() })
      .eq('id', partnerId);

    if (error) {
      console.error('Erreur mise à jour affluence:', error.message);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour du statut.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Erreur API affluence:', error.message);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
