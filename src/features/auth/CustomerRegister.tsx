import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore } from '@/store/useAuthStore';
import { CheckCircle2, ArrowLeft, Building2, Wrench, Users } from 'lucide-react';

export default function CustomerRegister() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Ad alanı zorunludur';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Soyad alanı zorunludur';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-posta alanı zorunludur';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefon alanı zorunludur';
    } else if (!/^[0-9\s+() -]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Geçerli bir telefon numarası girin';
    }

    if (!formData.password) {
      newErrors.password = 'Şifre alanı zorunludur';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Şifre en az 8 karakter olmalıdır';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    if (!agreedToTerms) {
      newErrors.terms = 'Kullanım koşullarını kabul etmelisiniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // TODO: API call to register customer
      login('customer', {
        email: formData.email,
        name: `${formData.firstName} ${formData.lastName}`,
      });
      navigate('/customer/dashboard');
    }
  };

  return (
    <div className="flex-1 flex w-full relative overflow-hidden bg-slate-50 min-h-screen">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#dc2626 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-12 z-10 relative items-center">
        {/* Left Side - Value Proposition */}
        <div className="flex flex-col justify-center space-y-8 p-6 lg:p-8 order-2 lg:order-1">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Varlıklarınızı Yönetin,<br />
              <span className="text-red-600">Temizinden.</span>
            </h1>
            <p className="mt-4 text-lg text-slate-600 max-w-md">
              Endüstriyel ekipmanlarınızı takip edin, bakım geçmişinizi görüntüleyin ve güvenilir servis sağlayıcılarıyla bağlantı kurun.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-900">Varlık Yönetimi</p>
                <p className="text-sm text-slate-600">Tüm ekipmanlarınızı tek bir yerden takip edin</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-900">Kolay Servis Talebi</p>
                <p className="text-sm text-slate-600">Birkaç tıklamayla bakım ve onarım talebi oluşturun</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-900">Garanti Takibi</p>
                <p className="text-sm text-slate-600">Garanti sürelerinizi ve servis geçmişinizi görüntüleyin</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200">
            <div className="text-center">
              <Building2 className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">500+</p>
              <p className="text-xs text-slate-500">Kayıtlı Firma</p>
            </div>
            <div className="text-center">
              <Wrench className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">10K+</p>
              <p className="text-xs text-slate-500">Tamamlanan Servis</p>
            </div>
            <div className="text-center">
              <Users className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">200+</p>
              <p className="text-xs text-slate-500">Sertifikalı Servis</p>
            </div>
          </div>

          <div className="pt-4">
            <p className="text-sm text-slate-500">
              Zaten hesabınız var mı?{' '}
              <Link to="/customer/login" className="text-red-600 hover:text-red-700 font-medium">
                Giriş Yapın
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="flex justify-center lg:justify-end p-6 lg:p-8 order-1 lg:order-2">
          <Card className="w-full max-w-md shadow-xl border-0 ring-1 ring-slate-200/50">
            <CardHeader className="space-y-1 pb-6">
              <div className="flex items-center gap-2 mb-2">
                <Link to="/customer/login">
                  <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 -ml-2">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Geri
                  </Button>
                </Link>
              </div>
              <CardTitle className="text-2xl font-bold text-center">Hesap Oluşturun</CardTitle>
              <CardDescription className="text-center text-slate-500">
                Temizinden müşteri hesabınıza kaydolun
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="firstName">
                      Ad
                    </label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="Ahmet"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`focus-visible:ring-red-500 ${errors.firstName ? 'border-red-200' : ''}`}
                    />
                    {errors.firstName && <p className="text-xs text-red-600">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="lastName">
                      Soyad
                    </label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Yılmaz"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`focus-visible:ring-red-500 ${errors.lastName ? 'border-red-200' : ''}`}
                    />
                    {errors.lastName && <p className="text-xs text-red-600">{errors.lastName}</p>}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="email">
                    E-posta Adresi
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="ornek@firma.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={`focus-visible:ring-red-500 ${errors.email ? 'border-red-200' : ''}`}
                  />
                  {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="phone">
                    Telefon Numarası
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+90 (555) 000 0000"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`focus-visible:ring-red-500 ${errors.phone ? 'border-red-200' : ''}`}
                  />
                  {errors.phone && <p className="text-xs text-red-600">{errors.phone}</p>}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="password">
                    Şifre
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className={`focus-visible:ring-red-500 ${errors.password ? 'border-red-200' : ''}`}
                  />
                  {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
                  <p className="text-xs text-slate-500">En az 8 karakter olmalıdır</p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="confirmPassword">
                    Şifre Tekrar
                  </label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`focus-visible:ring-red-500 ${errors.confirmPassword ? 'border-red-200' : ''}`}
                  />
                  {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword}</p>}
                </div>

                {/* Terms Checkbox */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked: boolean) => {
                        setAgreedToTerms(checked);
                        if (errors.terms) {
                          setErrors((prev) => ({ ...prev, terms: '' }));
                        }
                      }}
                      className="mt-1"
                    />
                    <label htmlFor="terms" className="text-sm text-slate-600 leading-tight cursor-pointer">
                      <span className="text-slate-900 font-medium">
                        Kullanım Koşulları
                      </span>{' '}
                      ve{' '}
                      <span className="text-slate-900 font-medium">
                        Gizlilik Politikası
                      </span>
                      'nı kabul ediyorum.
                    </label>
                  </div>
                  {errors.terms && <p className="text-xs text-red-600">{errors.terms}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 h-11 text-base font-medium"
                >
                  Hesap Oluştur
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">Veya şununla kaydolun</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-11 border-slate-200 hover:bg-slate-50">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>
                <Button variant="outline" className="h-11 border-slate-200 hover:bg-slate-50">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 21 21">
                    <path d="M10 0H0v10h10V0z" fill="#f25022" />
                    <path d="M21 0H11v10h10V0z" fill="#7fba00" />
                    <path d="M10 11H0v10h10V11z" fill="#00a4ef" />
                    <path d="M21 11H11v10h10V11z" fill="#ffb900" />
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
