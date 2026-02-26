import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'CLUB-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId manquant' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('referral_code')
      .eq('id', userId)
      .single();

    let code = profile?.referral_code;

    if (!code) {
      let unique = false;
      let attempts = 0;
      while (!unique && attempts < 10) {
        code = generateCode();
        const { data: existing } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('referral_code', code)
          .maybeSingle();
        if (!existing) unique = true;
        attempts++;
      }

      if (!unique) {
        return NextResponse.json({ error: 'Impossible de générer un code unique, veuillez réessayer.' }, { status: 500 });
      }

      await supabaseAdmin
        .from('profiles')
        .update({ referral_code: code })
        .eq('id', userId);
    }

    const host = req.headers.get('host');
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const link = `${protocol}://${host}/?ref=${code}`;

    return NextResponse.json({ link, code });
  } catch (error) {
    console.error('Erreur generate referral:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
