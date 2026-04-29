import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function CustomerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login('customer', { email });
    navigate('/customer/dashboard');
  };

  return (
    <div className="flex-1 flex w-full relative overflow-hidden bg-slate-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(#dc2626 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>

      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 p-6 lg:p-12 z-10 relative items-center">

        {/* Left Side - CTA & Value Prop */}
        <div className="flex flex-col justify-center space-y-8 p-6 lg:p-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Bakım ve Onarım,<br/><span className="text-red-600">Temizinden.</span>
            </h1>
            <p className="mt-4 text-lg text-slate-600 max-w-md">
              Servis geçmişinize erişin, yeni bakım talepleri oluşturun ve varlıklarınızı tek yerden takip edin.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-red-500 flex-shrink-0" />
              <p className="text-slate-700">Servis talepleriniz için gerçek zamanlı durum güncellemeleri</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-red-500 flex-shrink-0" />
              <p className="text-slate-700">Sertifikalı teknik servislerle doğrudan iletişim</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-red-500 flex-shrink-0" />
              <p className="text-slate-700">Tam geçmiş ve garanti takibi</p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200">
            <div className="bg-red-50 rounded-xl p-6 border border-red-100 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-red-900">Temizinden'e yeni misiniz?</h3>
                <p className="text-sm text-red-700 mt-1">Ücretsiz hesap oluşturarak servis hizmetlerimize başlayın.</p>
              </div>
              <Link to="/customer/register">
                <Button variant="outline" className="bg-white hover:bg-red-50 text-red-700 border-red-200 whitespace-nowrap">
                  Kaydol <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex justify-center md:justify-end p-6 lg:p-8">
          <Card className="w-full max-w-md shadow-xl border-0 ring-1 ring-slate-200/50">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center">Tekrar hoş geldiniz</CardTitle>
              <CardDescription className="text-center text-slate-500">
                Müşteri hesabınıza giriş yapın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none text-slate-700" htmlFor="email">
                    E-posta adresi
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@firma.com"
                    required
                    className="focus-visible:ring-red-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium leading-none text-slate-700" htmlFor="password">
                      Şifre
                    </label>
                    <a href="#" className="text-sm text-red-600 hover:text-red-500 font-medium">
                      Şifremi unuttum?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    className="focus-visible:ring-red-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 h-11 text-base">
                  Giriş Yap
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">Veya şununla devam edin</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-11 border-slate-200 hover:bg-slate-50">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </Button>
                <Button variant="outline" className="h-11 border-slate-200 hover:bg-slate-50">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 21 21">
                    <path d="M10 0H0v10h10V0z" fill="#f25022"/>
                    <path d="M21 0H11v10h10V0z" fill="#7fba00"/>
                    <path d="M10 11H0v10h10V11z" fill="#00a4ef"/>
                    <path d="M21 11H11v10h10V11z" fill="#ffb900"/>
                  </svg>
                  Microsoft
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
