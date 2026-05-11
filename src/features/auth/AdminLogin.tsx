import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Activity, Fingerprint, Lock, ShieldCheck, Database } from 'lucide-react';

/**
 * AdminLogin Component
 *
 * Temizinden OPS MERKEZİ - Administrative Access Portal
 * Dark theme with indigo accents for system administrators.
 */

export default function AdminLogin() {
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [token, setToken] = useState('');
  const { loginWithPassword, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2); // Move to 2FA step
  };

  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithPassword('admin', email, password);
      navigate(dashboardPathForEmail(email, 'admin'));
    } catch {
      // Store error is rendered below the form.
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden text-slate-700 font-sans">
      
      {/* Background Tech Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute inset-0 bg-red-50"></div>
        {/* Fake grid/data lines */}
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(220,38,38,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.08) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <div className="w-full max-w-5xl z-10 grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
        
        {/* Left Side - Info Panel */}
        <div className="lg:col-span-2 hidden lg:flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.5)]">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">OPS MERKEZİ</h2>
              <p className="text-xs text-red-600 font-mono tracking-widest uppercase">Sistem Kontrol</p>
            </div>
          </div>

          <div className="bg-white/50 border border-slate-200 rounded-lg p-5 backdrop-blur-sm shadow-xl">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-red-600" /> Güvenlik Durumu
            </h3>
            <div className="space-y-3 font-mono text-xs text-slate-400">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span>Şifreleme</span>
                <span className="text-red-600">AES-256 Aktif</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span>Ağ</span>
                <span className="text-red-600">Güvenli/Özel</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Erişim Logları</span>
                <span className="text-red-600">İzleniyor</span>
              </div>
            </div>
          </div>

          <div className="bg-white/50 border border-slate-200 rounded-lg p-5 backdrop-blur-sm shadow-xl">
             <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-red-600" /> Sistem Metrikleri
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1 font-mono"><span>Sunucu Kümesi</span> <span className="text-slate-700">98%</span></div>
                <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 w-[98%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1 font-mono"><span>API Gateway</span> <span className="text-slate-700">42ms</span></div>
                <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 w-[20%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="lg:col-span-3 flex justify-center">
          <Card className="w-full max-w-md bg-white/80 border-slate-200 backdrop-blur-md shadow-2xl rounded-xl">
            <CardHeader className="space-y-1 pt-8 px-8">
              <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mb-4 border border-slate-200">
                <Lock className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-semibold text-slate-900 tracking-tight">Yönetici Erişimi</CardTitle>
              <CardDescription className="text-slate-400">
                Operasyon merkezine erişmek için kimlik doğrulaması yapın.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              {step === 1 ? (
                <form onSubmit={handleCredentials} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Kurumsal E-posta
                    </label>
                    <Input 
                      type="email" 
                      required 
                      className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-red-600 h-11"
                      placeholder="admin@demo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Şifre
                    </label>
                    <Input 
                      type="password" 
                      required 
                      className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-red-600 h-11"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white h-11 mt-4">
                    Kimlik Doğrula
                  </Button>
                </form>
              ) : (
                <form onSubmit={handle2FA} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-4 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <Fingerprint className="w-8 h-8 text-red-600 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-slate-900">İki Faktörlü Doğrulama</h4>
                      <p className="text-xs text-slate-400">Doğrulayıcı uygulamanızdaki 6 haneli kodu girin.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Güvenlik Kodu
                    </label>
                    <Input 
                      type="text" 
                      required 
                      maxLength={6}
                      className="bg-slate-50 border-slate-200 text-center text-2xl tracking-[0.5em] text-slate-900 focus-visible:ring-red-600 h-14 font-mono"
                      placeholder="••••••"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Button type="button" variant="outline" className="flex-1 bg-transparent border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-600" onClick={() => setStep(1)}>
                      Geri
                    </Button>
                    <Button type="submit" className="flex-[2] bg-red-600 hover:bg-red-700 text-white h-11">
                      {isLoading ? 'Giriş yapılıyor...' : 'Yetkilendir'}
                    </Button>
                  </div>
                </form>
              )}
              {error && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}
            </CardContent>
            <CardFooter className="px-8 pb-8 pt-0 border-t border-slate-200/50 mt-4 flex justify-between items-center text-xs text-slate-500">
              <span>Yetkili Erişim Gerekli</span>
              <a href="#" className="hover:text-red-600 transition-colors">BT Destek</a>
            </CardFooter>
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
