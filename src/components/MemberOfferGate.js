"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * MemberOfferGate — wraps member-only offer content.
 *
 * • Members (active subscription_type ≠ "none") → renders children normally.
 * • Non-members / unauthenticated users → renders children blurred with a
 *   lock-icon overlay and "Unlock this offer with The Club" message.
 *
 * Usage:
 *   <MemberOfferGate>
 *     <YourOfferContent />
 *   </MemberOfferGate>
 */
export default function MemberOfferGate({ children }) {
  const [isMember, setIsMember] = useState(null); // null = loading

  useEffect(() => {
    let cancelled = false;
    async function checkMembership() {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        setIsMember(false);
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_type')
        .eq('id', user.id)
        .single();
      if (!cancelled) {
        setIsMember(!!profile?.subscription_type && profile.subscription_type !== 'none');
      }
    }
    checkMembership();
    return () => { cancelled = true; };
  }, []);

  // Loading — reserve space silently to avoid layout shift
  if (isMember === null) {
    return (
      <div className="opacity-0 pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>
    );
  }

  // Member — full visibility
  if (isMember) {
    return <>{children}</>;
  }

  // Non-member — blur overlay with lock + CTA
  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Blurred content */}
      <div className="blur-sm select-none pointer-events-none" aria-hidden="true">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/40 backdrop-blur-[2px] rounded-2xl px-4">
        {/* Lock icon */}
        <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shadow-sm">
          <svg
            className="w-4 h-4 text-amber-600"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        {/* CTA message */}
        <p className="text-[11px] font-semibold text-amber-700 text-center leading-tight">
          Unlock this offer with The Club
        </p>
      </div>
    </div>
  );
}
