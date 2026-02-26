"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DevenirPartenairePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/espace-partenaire');
  }, [router]);
  return null;
}
