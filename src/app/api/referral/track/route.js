import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { newUserId, refCode } = await req.json();
    if (!newUserId || !refCode) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: referrer } = await supabaseAdmin
      .from('profiles')
      .select('id, referral_count')
      .eq('referral_code', refCode)
      .maybeSingle();

    if (!referrer || referrer.id === newUserId) {
      return NextResponse.json({ success: false, error: 'Code invalide' });
    }

    await supabaseAdmin
      .from('profiles')
      .update({ referred_by: referrer.id })
      .eq('id', newUserId);

    await supabaseAdmin
      .from('referrals')
      .insert([{
        referrer_id: referrer.id,
        referral_code: refCode,
        referred_user_id: newUserId,
        status: 'completed',
        completed_at: new Date().toISOString(),
      }]);

    await supabaseAdmin
      .from('profiles')
      .update({ referral_count: (referrer.referral_count || 0) + 1 })
      .eq('id', referrer.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur track referral:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
