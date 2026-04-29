import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ShieldAlert, HardHat, Phone, KeyRound } from 'lucide-react';

export default function ServiceLogin() {
  const [method, setMethod] = useState<'otp' | 'password'>('otp');
  const [identifier, setIdentifier] = useState('');
  const [secret, setSecret] = useState('');
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login('service', { email: identifier });
    navigate('/service/dashboard');
  };

  return (
    <div className="flex min-h-screen w-full bg-neutral-950">

      {/* Left Side - Image & Branding */}
      <div className="hidden lg:flex w-1/2 relative bg-neutral-900 overflow-hidden border-r border-neutral-800">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=2070&auto=format&fit=crop"
            alt="Industrial Maintenance"
            className="w-full h-full object-cover opacity-40 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-end p-12 w-full">
          <div className="inline-flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 px-4 py-2 rounded-sm mb-6 w-fit">
            <ShieldAlert className="w-5 h-5" />
            <span className="font-bold tracking-wider text-sm uppercase">Yetkili Personel</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-[1.1]">
            Temizinden<br/>
            <span className="text-amber-500">PRO PORTAL</span>
          </h1>
          <p className="mt-6 text-neutral-400 text-lg max-w-lg border-l-2 border-amber-500 pl-4">
            Servis taleplerini yönetin, saha ekiplerini sevk edin ve operasyonel metrikleri gerçek zamanlı takip edin.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 relative">
        <div className="absolute top-6 right-6">
          <Link to="/service/register">
            <Button variant="ghost" className="text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-sm">
              <HardHat className="w-4 h-4 mr-2" />
              Servis Sağlayıcısı Başvurusu
            </Button>
          </Link>
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-amber-500 rounded-sm flex items-center justify-center font-bold text-neutral-950 text-xs">
              TZ
            </div>
            <span className="font-bold text-white tracking-tight text-xl">Temizinden <span className="text-amber-500">PRO</span></span>
          </div>

          <Card className="bg-neutral-900/50 border-neutral-800 rounded-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-white tracking-tight">Servis Erişimi</CardTitle>
              <CardDescription className="text-neutral-400">
                Sisteme erişmek için kimlik bilgilerinizi girin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex grid-cols-2 gap-2 mb-6 bg-neutral-950 p-1 rounded-sm border border-neutral-800">
                <Button
                  type="button"
                  variant="ghost"
                  className={`w-1/2 rounded-sm h-9 text-sm ${method === 'otp' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
                  onClick={() => setMethod('otp')}
                >
                  <Phone className="w-4 h-4 mr-2" /> Telefon / OTP
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className={`w-1/2 rounded-sm h-9 text-sm ${method === 'password' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
                  onClick={() => setMethod('password')}
                >
                  <KeyRound className="w-4 h-4 mr-2" /> Şifre
                </Button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300 uppercase tracking-wider text-xs">
                    {method === 'otp' ? 'Telefon Numarası' : 'E-posta / Kullanıcı Adı'}
                  </label>
                  <Input
                    required
                    placeholder={method === 'otp' ? "+90 (555) 000-0000" : "Kullanıcı adı girin"}
                    className="bg-neutral-950 border-neutral-800 text-white focus-visible:ring-amber-500 rounded-sm h-11"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>

                {method === 'password' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-neutral-300 uppercase tracking-wider text-xs">
                        Şifre
                      </label>
                      <a href="#" className="text-xs text-amber-500 hover:text-amber-400">Şifremi Unuttum</a>
                    </div>
                    <Input
                      type="password"
                      required
                      className="bg-neutral-950 border-neutral-800 text-white focus-visible:ring-amber-500 rounded-sm h-11"
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
                    />
                  </div>
                )}

                <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold uppercase tracking-wider rounded-sm h-12 mt-6">
                  {method === 'otp' ? 'Kod Gönder' : 'Güvenli Giriş'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
