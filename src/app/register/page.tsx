'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import type { UserRole } from '@/types/database';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card w-full max-w-md text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-4xl">✉️</span>
          </div>
          <h2 className="text-xl font-bold text-[var(--color-dark-blue)] mb-2">Controlla la tua email!</h2>
          <p className="text-[var(--color-gray)] mb-6">
            Ti abbiamo inviato un link di conferma a <strong>{email}</strong>
          </p>
          <Link href="/login" className="btn-secondary inline-block">
            Torna al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[var(--color-azure)] to-[var(--color-blue)] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-4xl">🎾</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-dark-blue)]">
            Crea il tuo account
          </h1>
          <p className="text-[var(--color-gray)] mt-1">Inizia a tracciare i tuoi progressi</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2 text-[var(--color-dark-blue)]" htmlFor="fullName">
              Nome completo
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-field"
              placeholder="Mario Rossi"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-[var(--color-dark-blue)]" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="mario@esempio.it"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-[var(--color-dark-blue)]" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Minimo 6 caratteri"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3 text-[var(--color-dark-blue)]">Sono un...</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  role === 'student'
                    ? 'border-[var(--color-azure)] bg-[var(--color-light)] shadow-md'
                    : 'border-[var(--color-light-gray)] hover:border-[var(--color-azure)]'
                }`}
              >
                <div className="text-3xl mb-2">🎯</div>
                <div className="font-semibold text-[var(--color-dark-blue)]">Allievo</div>
                <div className="text-xs text-[var(--color-gray)]">Traccia allenamenti</div>
              </button>
              <button
                type="button"
                onClick={() => setRole('coach')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  role === 'coach'
                    ? 'border-[var(--color-azure)] bg-[var(--color-light)] shadow-md'
                    : 'border-[var(--color-light-gray)] hover:border-[var(--color-azure)]'
                }`}
              >
                <div className="text-3xl mb-2">👨‍🏫</div>
                <div className="font-semibold text-[var(--color-dark-blue)]">Maestro</div>
                <div className="text-xs text-[var(--color-gray)]">Segui i tuoi allievi</div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Registrazione...' : 'Crea account'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-[var(--color-gray)]">
          Hai già un account?{' '}
          <Link href="/login" className="text-[var(--color-blue)] font-semibold hover:underline">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}
