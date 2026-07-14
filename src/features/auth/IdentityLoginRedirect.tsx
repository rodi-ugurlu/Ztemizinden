import { useCallback, useEffect, useRef } from 'react';
import { useAuthStore, type UserRole } from '@/store/useAuthStore';

type LoginRole = Exclude<UserRole, null>;

const portalCopy: Record<
  LoginRole,
  { eyebrow: string; title: string; description: string }
> = {
  customer: {
    eyebrow: 'FABRİKA/İŞLETMELER İÇİN',
    title: 'Fabrika/İşletme Girişi',
    description: 'Bakım taleplerinize ve varlıklarınıza güvenle erişin.',
  },
  service: {
    eyebrow: 'SERVİS FİRMALARI İÇİN',
    title: 'Servis Girişi',
    description: 'Ekibinizi, işlerinizi ve servis süreçlerinizi yönetin.',
  },
  admin: {
    eyebrow: 'OPS MERKEZİ',
    title: 'Yönetici Erişimi',
    description: 'Yetkili operasyon hesabınızla güvenli oturum açın.',
  },
};

export default function IdentityLoginRedirect({ role }: { role: LoginRole }) {
  const startedRef = useRef(false);
  const { loginWithIdentityProvider, error, setError } = useAuthStore();
  const copy = portalCopy[role];

  const startLogin = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setError(null);
    void loginWithIdentityProvider(role).catch(() => {
      startedRef.current = false;
    });
  }, [loginWithIdentityProvider, role, setError]);

  useEffect(() => {
    startLogin();
  }, [startLogin]);

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-white font-sans">
      <section
        className={`absolute inset-y-0 hidden w-1/2 overflow-hidden bg-red-600 text-white lg:flex ${
          role === 'service' ? 'right-0' : 'left-0'
        }`}
      >
        <div className="absolute -right-28 top-[-10%] h-[120%] w-64 rounded-[50%] bg-white/10" />
        <div className="relative m-auto max-w-lg px-12 text-center">
          <img
            src="/maintly-logo.webp"
            alt="Maintly"
            className="mx-auto mb-5 h-20 w-20 rounded-2xl bg-white object-contain p-2 shadow-xl"
          />
          <p className="text-xs font-extrabold tracking-[0.2em] text-red-100">
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">Maintly ile daha kolay</h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-7 text-red-50">
            {copy.description}
          </p>
        </div>
      </section>

      <section
        className={`flex min-h-screen w-full items-center justify-center px-6 lg:w-1/2 ${
          role === 'service' ? 'lg:mr-auto' : 'lg:ml-auto'
        }`}
      >
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 shadow-sm ring-1 ring-red-100">
            <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-red-200 border-t-red-600" />
          </div>
          <p className="text-xs font-extrabold tracking-[0.18em] text-red-600">
            {copy.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
            {copy.title}
          </h2>
          <p className="mx-auto mt-3 max-w-sm leading-6 text-slate-500">
            E-posta ve şifrenizi gireceğiniz Maintly güvenli giriş ekranı açılıyor.
          </p>

          {error && (
            <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p>{error}</p>
              <button
                type="button"
                onClick={startLogin}
                className="mt-4 rounded-xl bg-red-600 px-5 py-2.5 font-bold text-white transition hover:bg-red-700"
              >
                Tekrar Dene
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
