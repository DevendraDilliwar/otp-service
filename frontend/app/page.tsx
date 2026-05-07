'use client';

import { useState } from 'react';
import { Phone, Mail, ArrowRight, ShieldCheck, RefreshCw, KeyRound, Copy, CheckCircle2 } from 'lucide-react';

type Step = 'IDENTIFIER' | 'VERIFY' | 'SUCCESS';
type Method = 'phone' | 'email';

export default function Home() {
  const [step, setStep] = useState<Step>('IDENTIFIER');
  const [method, setMethod] = useState<Method>('phone');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${backendUrl}/api/${method}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [method]: identifier }),
      });

      const data = await response.json();

      if (data.success) {
        setStep('VERIFY');
      } else {
        setError(data.message || data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Connection to backend failed. Is it running?');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${backendUrl}/api/${method}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [method]: identifier, otp }),
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        setStep('SUCCESS');
      } else {
        setError(data.message || data.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('Connection to backend failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/${method}/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [method]: identifier }),
      });
      const data = await response.json();
      if (data.success) {
        alert('OTP Resent!');
      } else {
        setError(data.message || data.error || 'Failed to resend');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 transition-colors duration-500">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-zinc-800 transition-all duration-300">
        <div className="p-8">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none mb-4">
              <ShieldCheck className="text-white w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">OTP Service</h1>
            <p className="text-slate-500 dark:text-zinc-400 text-center mt-1">Secure authentication system</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Steps */}
          {step === 'IDENTIFIER' && (
            <form onSubmit={handleSendOtp} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMethod('phone')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    method === 'phone' 
                    ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-slate-500 dark:text-zinc-500 hover:text-slate-700'
                  }`}
                >
                  <Phone size={16} /> Phone
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('email')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    method === 'email' 
                    ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-slate-500 dark:text-zinc-500 hover:text-slate-700'
                  }`}
                >
                  <Mail size={16} /> Email
                </button>
              </div>

              <div className="relative">
                <input
                  type={method === 'phone' ? 'tel' : 'email'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={method === 'phone' ? 'Enter phone number' : 'Enter email address'}
                  required
                  className="w-full pl-4 pr-4 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
              >
                {loading ? <RefreshCw className="animate-spin w-5 h-5" /> : <>Get OTP <ArrowRight size={18} /></>}
              </button>
            </form>
          )}

          {step === 'VERIFY' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center">
                <p className="text-slate-600 dark:text-zinc-400">
                  Verification code sent to <br />
                  <span className="font-semibold text-slate-900 dark:text-white">{identifier}</span>
                </p>
                <button 
                  type="button"
                  onClick={() => setStep('IDENTIFIER')}
                  className="text-blue-600 dark:text-blue-400 text-sm mt-2 hover:underline"
                >
                  Change {method}
                </button>
              </div>

              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none tracking-[0.5em] text-lg font-bold text-center transition-all dark:text-white"
                />
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                >
                  {loading ? <RefreshCw className="animate-spin w-5 h-5" /> : 'Verify Code'}
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="w-full text-slate-500 dark:text-zinc-500 text-sm py-2 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors"
                >
                  Didn't receive code? Resend
                </button>
              </div>
            </form>
          )}

          {step === 'SUCCESS' && (
            <div className="space-y-8 animate-in zoom-in-95 duration-500 text-center">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="text-green-600 dark:text-green-400 w-12 h-12" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Verification Successful</h2>
                <p className="text-slate-500 dark:text-zinc-400 mt-2">Your session token has been generated</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-200 dark:border-zinc-700 relative group">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2 text-left font-bold">Session Token</p>
                <div className="flex items-center gap-2 overflow-hidden">
                  <code className="text-xs text-blue-600 dark:text-blue-400 break-all text-left font-mono block flex-1">
                    {token}
                  </code>
                  <button 
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg transition-colors flex-shrink-0"
                  >
                    {copied ? <CheckCircle2 size={18} className="text-green-600" /> : <Copy size={18} className="text-slate-500" />}
                  </button>
                </div>
                {copied && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded">Copied!</span>
                )}
              </div>

              <button
                onClick={() => {
                  setStep('IDENTIFIER');
                  setIdentifier('');
                  setOtp('');
                  setToken(null);
                }}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Start over
              </button>
            </div>
          )}
        </div>
      </div>

      <footer className="mt-8 text-slate-400 dark:text-zinc-600 text-sm flex items-center gap-2">
        <span>Powered by Node.js + Hono + Neon</span>
      </footer>
    </div>
  );
}
