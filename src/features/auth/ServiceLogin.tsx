import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ShieldAlert, HardHat, Phone, KeyRound } from 'lucide-react';

export default function ServiceLogin() {
  const [method, setMethod] = useState<'otp' | 'password'>('password');
  const [identifier, setIdentifier] = useState('service@demo.com');
  const [secret, setSecret] = useState('');
  const { loginWithPassword, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithPassword('service', identifier, method === 'password' ? secret : secret || 'demo123');
      navigate(dashboardPathForEmail(identifier, 'service'));
    } catch {
      // Store error is rendered below the form.
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50">

      {/* Left Side - Image & Branding */}
      <div className="hidden lg:flex w-1/2 relative bg-white overflow-hidden border-r border-slate-200">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=2070&auto=format&fit=crop"
            alt="Industrial Maintenance"
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-white/75"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-end p-12 w-full">
          <div className="inline-flex items-center gap-3 bg-red-50 border border-red-200/20 text-red-600 px-4 py-2 rounded-sm mb-6 w-fit">
            <ShieldAlert className="w-5 h-5" />
            <span className="font-bold tracking-wider text-sm uppercase">Yetkili Personel</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-[1.1]">
            Temizinden<br/>
            <span className="text-red-600">PRO PORTAL</span>
          </h1>
          <p className="mt-6 text-slate-400 text-lg max-w-lg border-l-2 border-red-200 pl-4">
            Servis taleplerini yönetin, saha ekiplerini sevk edin ve operasyonel metrikleri gerçek zamanlı takip edin.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 relative">
        <div className="absolute top-6 right-6">
          <Link to="/service/register">
            <Button variant="ghost" className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm">
              <HardHat className="w-4 h-4 mr-2" />
              Servis Sağlayıcısı Başvurusu
            </Button>
          </Link>
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-red-600 rounded-sm flex items-center justify-center font-bold text-white text-xs">
              TZ
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-xl">Temizinden <span className="text-red-600">PRO</span></span>
          </div>

          <Card className="bg-white/50 border-slate-200 rounded-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">Servis Erişimi</CardTitle>
              <CardDescription className="text-slate-400">
                Sisteme erişmek için kimlik bilgilerinizi girin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex grid-cols-2 gap-2 mb-6 bg-slate-50 p-1 rounded-sm border border-slate-200">
                <Button
                  type="button"
                  variant="ghost"
                  className={`w-1/2 rounded-sm h-9 text-sm ${method === 'otp' ? 'bg-slate-50 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-red-600'}`}
                  onClick={() => setMethod('otp')}
                >
                  <Phone className="w-4 h-4 mr-2" /> Telefon / OTP
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className={`w-1/2 rounded-sm h-9 text-sm ${method === 'password' ? 'bg-slate-50 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-red-600'}`}
                  onClick={() => setMethod('password')}
                >
                  <KeyRound className="w-4 h-4 mr-2" /> Şifre
                </Button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 uppercase tracking-wider text-xs">
                    {method === 'otp' ? 'Telefon Numarası' : 'E-posta / Kullanıcı Adı'}
                  </label>
                  <Input
                    required
                    placeholder={method === 'otp' ? "+90 (555) 000-0000" : "Kullanıcı adı girin"}
                    className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-red-600 rounded-sm h-11"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>

                {method === 'password' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700 uppercase tracking-wider text-xs">
                        Şifre
                      </label>
                      <a href="#" className="text-xs text-red-600 hover:text-red-600">Şifremi Unuttum</a>
                    </div>
                    <Input
                      type="password"
                      required
                      className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-red-600 rounded-sm h-11"
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
                    />
                  </div>
                )}

                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider rounded-sm h-12 mt-6">
                  {isLoading ? 'Giriş yapılıyor...' : method === 'otp' ? 'Güvenli Giriş' : 'Güvenli Giriş'}
                </Button>
              </form>
              {error && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}

              <div className="mt-6 text-center text-sm text-slate-500">
                Kurumsal müşteri misiniz?{' '}
                <Link to="/customer/login" className="text-red-600 hover:underline font-medium">
                  Müşteri Portalı'na geçiş yapın
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function dashboardPathForEmail(email: string, fallbackRole: 'customer' | 'service' | 'admin') {
  const roleByEmail: Record<string, 'customer' | 'service' | 'admin'> = {
    'customer@demo.com': 'customer',
    'service@demo.com': 'service',
    'admin@demo.com': 'admin',
  };
  const role = roleByEmail[email.trim().toLowerCase()] ?? fallbackRole;
  return `/${role}/dashboard`;
}
