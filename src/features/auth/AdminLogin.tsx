import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Lock, ShieldCheck } from 'lucide-react';

/**
 * AdminLogin Component
 *
 * Maintly operations portal login.
 */

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { loginWithCredentials, isLoading, error, setError } = useAuthStore();

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await loginWithCredentials('admin', email, password);
    } catch {
      // Store error is rendered below the form.
    }
  };

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-white font-sans text-slate-900">
      <section className="hidden min-h-screen w-1/2 overflow-hidden bg-red-600 text-white lg:flex">
        <div className="relative flex w-full flex-col justify-between px-12 py-12">
          <div className="flex items-center gap-4">
            <img
              src="/maintly-logo.webp"
              alt="Maintly"
              className="h-14 w-14 rounded-2xl bg-white object-contain p-2 shadow-xl"
            />
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-red-100">
                OPS MERKEZI
              </p>
              <h1 className="text-2xl font-black tracking-normal">Maintly</h1>
            </div>
          </div>

          <div className="max-w-lg">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-red-100">
              YONETICI ERISIMI
            </p>
            <h2 className="mt-4 text-5xl font-black leading-tight tracking-normal">
              Operasyon merkezi
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-red-50">
              Servis onaylari, dispatch akisi ve platform yonetimi icin yetkili Maintly hesabi.
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm font-semibold text-red-50">
            <ShieldCheck className="h-5 w-5" />
            <span>Keycloak ile korunan yetkili giris</span>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-6 py-10 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <img
              src="/maintly-logo.webp"
              alt="Maintly"
              className="mx-auto h-16 w-16 rounded-2xl bg-white object-contain p-2 shadow-lg ring-1 ring-red-100"
            />
            <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.18em] text-red-600">
              OPS MERKEZI
            </p>
          </div>

          <Card className="w-full rounded-lg border-slate-200 bg-white shadow-2xl shadow-red-950/10">
            <CardHeader className="space-y-2 px-8 pt-8">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-600 ring-1 ring-red-100">
                <Lock className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-black tracking-normal text-slate-950">
                Yonetici girisi
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-slate-500">
                Operasyon paneline erismek icin yetkili hesabinizla giris yapin.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <form onSubmit={handleCredentials} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    E-posta
                  </label>
                  <Input
                    type="email"
                    required
                    className="h-11 border-slate-200 bg-white text-slate-950 focus-visible:ring-red-500"
                    placeholder="admin@maintly.net"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Sifre
                  </label>
                  <Input
                    type="password"
                    required
                    className="h-11 border-slate-200 bg-white text-slate-950 focus-visible:ring-red-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="mt-4 h-11 w-full bg-red-600 text-white hover:bg-red-700" disabled={isLoading}>
                  {isLoading ? 'Giris kontrol ediliyor...' : 'Giris Yap'}
                </Button>
              </form>
              
              {error && (
                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs font-semibold text-red-700">
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter className="mt-2 flex items-center justify-between border-t border-slate-100 px-8 pb-8 pt-5 text-xs text-slate-500">
              <span>Maintly operasyon paneli</span>
              <span className="font-semibold text-red-600">Guvenli giris</span>
            </CardFooter>
          </Card>
        </div>
      </section>
    </main>
  );
}
