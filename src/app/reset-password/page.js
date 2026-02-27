'use client';

// NOTE: Add https://theclub-app.fr/reset-password to Supabase Auth > URL Configuration > Redirect URLs

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ResetPassword() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Les mots de passe ne correspondent pas.', type: 'error' });
      return;
    }
    setLoading(true);
    setMessage({ text: '', type: '' });
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMessage({ text: error.message, type: 'error' });
    } else {
      setMessage({ text: 'Mot de passe mis à jour avec succès ! Redirection en cours...', type: 'success' });
      setTimeout(() => router.push('/profil'), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors group">
            <div className="p-2 bg-white rounded-full shadow-sm border border-gray-200/60 group-hover:scale-105 transition-transform">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </div>
            Retour à l&apos;accueil
          </Link>
        </div>

        <div className="text-center mb-8">
          <p className="text-xs font-bold tracking-[0.3em] text-gray-400 uppercase mb-2">THE CLUB</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Nouveau mot de passe</h1>
          <p className="text-sm text-gray-500">Choisissez un nouveau mot de passe pour votre compte.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 p-8">
          {message.text && (
            <div className={`p-4 rounded-2xl text-sm mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gray-900 text-white rounded-2xl font-semibold text-sm hover:bg-gray-800 active:scale-95 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
