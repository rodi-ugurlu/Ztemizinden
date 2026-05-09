import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShieldAlert,
  ArrowLeft,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Upload,
  CheckCircle2,
  Wrench,
  Zap,
  Droplets,
  Settings,
  Thermometer,
  Info,
} from 'lucide-react';
import { api } from '@/lib/api';

const SERVICE_CATEGORIES = [
  { value: 'electric', label: 'Elektrik', icon: Zap },
  { value: 'mechanic', label: 'Mekanik', icon: Settings },
  { value: 'pneumatic', label: 'Pnomatik', icon: Droplets },
  { value: 'hydraulic', label: 'Hidrolik', icon: Droplets },
  { value: 'hvac', label: 'HVAC / İklimlendirme', icon: Thermometer },
  { value: 'software', label: 'Yazılım / Otomasyon', icon: Settings },
  { value: 'general', label: 'Genel Bakım', icon: Wrench },
];

const CITIES = [
  'Adana', 'Ankara', 'Antalya', 'Bursa', 'Denizli', 'Diyarbakır', 'Eskişehir', 'Gaziantep',
  'Hatay', 'İstanbul', 'İzmir', 'Kayseri', 'Kocaeli', 'Konya', 'Malatya', 'Manisa',
  'Mersin', 'Sakarya', 'Samsun', 'Tekirdağ', 'Trabzon',
];

interface UploadedFile {
  file: File;
  name: string;
  size: string;
  type: string;
}

export default function ServiceRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    city: '',
    district: '',
    address: '',
    categories: [] as string[],
    password: '',
    confirmPassword: '',
  });
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile | null>>({
    taxCertificate: null,
    insurance: null,
    technicalLicense: null,
    isoCertificate: null,
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleCategoryToggle = (category: string) => {
    setFormData((prev) => {
      const newCategories = prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories: newCategories };
    });
    if (errors.categories) {
      setErrors((prev) => ({ ...prev, categories: '' }));
    }
  };

  const handleFileSelect = (docType: string, file: File) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [docType]: {
        file,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
      },
    }));
    if (errors[docType]) {
      setErrors((prev) => ({ ...prev, [docType]: '' }));
    }
  };

  const removeFile = (docType: string) => {
    setUploadedFiles((prev) => ({ ...prev, [docType]: null }));
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Firma adı zorunludur';
    }

    if (!formData.contactName.trim()) {
      newErrors.contactName = 'Yetkili kişi adı zorunludur';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-posta zorunludur';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta girin';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefon zorunludur';
    }

    if (!formData.city) {
      newErrors.city = 'Şehir seçimi zorunludur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (formData.categories.length === 0) {
      newErrors.categories = 'En az bir hizmet kategorisi seçin';
    }

    if (!formData.password) {
      newErrors.password = 'Şifre zorunludur';
    } else if (formData.password.length < 8) {
      newErrors.password = 'En az 8 karakter olmalıdır';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};

    if (!uploadedFiles.taxCertificate) {
      newErrors.taxCertificate = 'Vergi levhası yüklenmelidir';
    }

    if (!uploadedFiles.insurance) {
      newErrors.insurance = 'Sigorta belgesi yüklenmelidir';
    }

    if (!uploadedFiles.technicalLicense) {
      newErrors.technicalLicense = 'Teknik lisans yüklenmelidir';
    }

    if (!agreedToTerms) {
      newErrors.terms = 'Koşulları kabul etmelisiniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep3()) {
      setIsSubmitting(true);
      try {
        const provider = await api.post<{ id: string }>('/providers', {
          name: formData.companyName,
          contactName: formData.contactName,
          email: formData.email,
          phone: formData.phone,
          city: formData.city,
          specialties: formData.categories.map(toBackendSpecialty),
        });

        await Promise.all(
          Object.entries(uploadedFiles)
            .filter(([, file]) => file)
            .map(([docType, file]) => uploadProviderDocument(provider.id, docType, file as UploadedFile))
        );

        navigate('/service/login');
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          submit: error instanceof Error ? error.message : 'Başvuru gönderilemedi',
        }));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return 'Firma Bilgileri';
      case 2:
        return 'Hizmet ve Hesap';
      case 3:
        return 'Belge Yükleme';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex">
      {/* Left Side - Image & Branding */}
      <div className="hidden lg:flex w-1/2 relative bg-white overflow-hidden border-r border-slate-200">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=2070&auto=format&fit=crop"
            alt="Industrial Maintenance"
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-white/75" />
        </div>

        <div className="relative z-10 flex flex-col justify-end p-12 w-full">
          <div className="inline-flex items-center gap-3 bg-red-50 border border-red-200/20 text-red-600 px-4 py-2 rounded-sm mb-6 w-fit">
            <ShieldAlert className="w-5 h-5" />
            <span className="font-bold tracking-wider text-sm uppercase">Servis Sağlayıcı Başvurusu</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-[1.1]">
            Temizinden
            <br />
            <span className="text-red-600">PRO AĞI</span>
          </h1>
          <p className="mt-6 text-slate-400 text-lg max-w-lg border-l-2 border-red-200 pl-4">
            Türkiye&apos;nin en büyük endüstriyel servis ağına katılın. Müşterilerle doğrudan bağlantı kurun ve
            işletmenizi büyütün.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 max-w-md">
            <div className="bg-white/80 backdrop-blur border border-slate-200 p-4 rounded-sm">
              <p className="text-2xl font-bold text-red-600">500+</p>
              <p className="text-sm text-slate-400">Aktif Müşteri</p>
            </div>
            <div className="bg-white/80 backdrop-blur border border-slate-200 p-4 rounded-sm">
              <p className="text-2xl font-bold text-red-600">10K+</p>
              <p className="text-sm text-slate-400">Yıllık Servis Talebi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="flex-1 flex flex-col relative overflow-y-auto">
        <div className="absolute top-6 right-6">
          <Link to="/service/login">
            <Button
              variant="ghost"
              className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Girişe Dön
            </Button>
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12">
          <div className="w-full max-w-lg space-y-6">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-2 mb-4 justify-center">
              <div className="w-8 h-8 bg-red-600 rounded-sm flex items-center justify-center font-bold text-white text-xs">
                TZ
              </div>
              <span className="font-bold text-slate-900 tracking-tight text-xl">
                Temizinden <span className="text-red-600">PRO</span>
              </span>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-4 mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-sm flex items-center justify-center text-sm font-bold ${
                      s === step
                        ? 'bg-red-600 text-white'
                        : s < step
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-50 text-slate-500'
                    }`}
                  >
                    {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`w-12 h-0.5 ${s < step ? 'bg-red-500' : 'bg-slate-50'}`}
                    />
                  )}
                </div>
              ))}
            </div>

            <Card className="bg-white/50 border-slate-200 rounded-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">
                  {getStepTitle()}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Adım {step} / 3 - Servis sağlayıcı başvurunuzu tamamlayın
                </CardDescription>
              </CardHeader>
              <CardContent>
                {step === 1 && (
                  <div className="space-y-4">
                    {/* Company Name */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 uppercase tracking-wider text-xs flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Firma Adı
                      </label>
                      <Input
                        name="companyName"
                        placeholder="Örn: Kaya Hidrolik Servis"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-red-600 rounded-sm h-11"
                      />
                      {errors.companyName && (
                        <p className="text-xs text-red-600">{errors.companyName}</p>
                      )}
                    </div>

                    {/* Contact Name */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 uppercase tracking-wider text-xs flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Yetkili Kişi
                      </label>
                      <Input
                        name="contactName"
                        placeholder="Ahmet Kaya"
                        value={formData.contactName}
                        onChange={handleChange}
                        className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-red-600 rounded-sm h-11"
                      />
                      {errors.contactName && (
                        <p className="text-xs text-red-600">{errors.contactName}</p>
                      )}
                    </div>

                    {/* Email & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 uppercase tracking-wider text-xs flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          E-posta
                        </label>
                        <Input
                          name="email"
                          type="email"
                          placeholder="info@firma.com"
                          value={formData.email}
                          onChange={handleChange}
                          className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-red-600 rounded-sm h-11"
                        />
                        {errors.email && (
                          <p className="text-xs text-red-600">{errors.email}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 uppercase tracking-wider text-xs flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Telefon
                        </label>
                        <Input
                          name="phone"
                          type="tel"
                          placeholder="+90 532 123 4567"
                          value={formData.phone}
                          onChange={handleChange}
                          className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-red-600 rounded-sm h-11"
                        />
                        {errors.phone && (
                          <p className="text-xs text-red-600">{errors.phone}</p>
                        )}
                      </div>
                    </div>

                    {/* City & District */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 uppercase tracking-wider text-xs flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Şehir
                        </label>
                        <Select
                          value={formData.city}
                          onValueChange={(value) => {
                            setFormData((prev) => ({ ...prev, city: value }));
                            if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
                          }}
                        >
                          <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900 focus:ring-red-600 rounded-sm h-11">
                            <SelectValue placeholder="Şehir seçin" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 max-h-60">
                            {CITIES.map((city) => (
                              <SelectItem
                                key={city}
                                value={city}
                                className="text-slate-900 hover:bg-red-50"
                              >
                                {city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.city && <p className="text-xs text-red-600">{errors.city}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 uppercase tracking-wider text-xs">
                          İlçe
                        </label>
                        <Input
                          name="district"
                          placeholder="Merkez"
                          value={formData.district}
                          onChange={handleChange}
                          className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-red-600 rounded-sm h-11"
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 uppercase tracking-wider text-xs">
                        Adres
                      </label>
                      <Input
                        name="address"
                        placeholder="OSB 1234. Sokak No:56"
                        value={formData.address}
                        onChange={handleChange}
                        className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-red-600 rounded-sm h-11"
                      />
                    </div>

                    <Button
                      onClick={handleNext}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider rounded-sm h-12"
                    >
                      Devam Et
                    </Button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    {/* Service Categories */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 uppercase tracking-wider text-xs flex items-center gap-2">
                        <Wrench className="w-4 h-4" />
                        Hizmet Kategorileri
                      </label>
                      <p className="text-xs text-slate-500 mb-2">
                        Sunduğunuz hizmetleri seçin (birden fazla seçebilirsiniz)
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {SERVICE_CATEGORIES.map((category) => {
                          const Icon = category.icon;
                          const isSelected = formData.categories.includes(category.value);
                          return (
                            <button
                              key={category.value}
                              type="button"
                              onClick={() => handleCategoryToggle(category.value)}
                              className={`flex items-center gap-2 p-3 rounded-sm border transition-all text-left ${
                                isSelected
                                  ? 'bg-red-50 border-red-200/50 text-red-600'
                                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-200'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              <span className="text-sm">{category.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      {errors.categories && (
                        <p className="text-xs text-red-600">{errors.categories}</p>
                      )}
                    </div>

                    {/* Password */}
                    <div className="space-y-2 pt-4 border-t border-slate-200">
                      <label className="text-sm font-medium text-slate-700 uppercase tracking-wider text-xs">
                        Şifre
                      </label>
                      <Input
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-red-600 rounded-sm h-11"
                      />
                      {errors.password && (
                        <p className="text-xs text-red-600">{errors.password}</p>
                      )}
                      <p className="text-xs text-slate-500">En az 8 karakter olmalıdır</p>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 uppercase tracking-wider text-xs">
                        Şifre Tekrar
                      </label>
                      <Input
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-red-600 rounded-sm h-11"
                      />
                      {errors.confirmPassword && (
                        <p className="text-xs text-red-600">{errors.confirmPassword}</p>
                      )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={handleBack}
                        className="flex-1 bg-transparent border-slate-200 text-slate-700 hover:bg-red-50 rounded-sm h-12"
                      >
                        Geri
                      </Button>
                      <Button
                        onClick={handleNext}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider rounded-sm h-12"
                      >
                        Devam Et
                      </Button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Info Banner */}
                    <div className="bg-red-50 border border-red-200/20 rounded-sm p-4 flex items-start gap-3">
                      <Info className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-red-600 font-medium">Gerekli Belgeler</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Başvurunuzun onaylanması için aşağıdaki belgeleri yüklemeniz gerekmektedir.
                          Belgeler inceleme süreci 2-3 iş günü sürebilir.
                        </p>
                      </div>
                    </div>

                    {/* Document Uploads */}
                    <div className="space-y-3">
                      {/* Tax Certificate */}
                      <DocumentUploadZone
                        label="Vergi Levhası"
                        description="Güncel vergi levhası fotokopisi"
                        required
                        file={uploadedFiles.taxCertificate}
                        onSelect={(file) => handleFileSelect('taxCertificate', file)}
                        onRemove={() => removeFile('taxCertificate')}
                        error={errors.taxCertificate}
                      />

                      {/* Insurance */}
                      <DocumentUploadZone
                        label="Sigorta Belgesi"
                        description="Mesleki sorumluluk sigortası"
                        required
                        file={uploadedFiles.insurance}
                        onSelect={(file) => handleFileSelect('insurance', file)}
                        onRemove={() => removeFile('insurance')}
                        error={errors.insurance}
                      />

                      {/* Technical License */}
                      <DocumentUploadZone
                        label="Teknik Lisans"
                        description="Yetki belgesi / Teknik lisans"
                        required
                        file={uploadedFiles.technicalLicense}
                        onSelect={(file) => handleFileSelect('technicalLicense', file)}
                        onRemove={() => removeFile('technicalLicense')}
                        error={errors.technicalLicense}
                      />

                      {/* ISO Certificate (Optional) */}
                      <DocumentUploadZone
                        label="ISO Sertifikası (İsteğe Bağlı)"
                        description="ISO 9001 vb. kalite sertifikaları"
                        file={uploadedFiles.isoCertificate}
                        onSelect={(file) => handleFileSelect('isoCertificate', file)}
                        onRemove={() => removeFile('isoCertificate')}
                      />
                    </div>

                    {/* Terms Checkbox */}
                    <div className="space-y-2 pt-4 border-t border-slate-200">
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
                          className="mt-1 border-slate-200 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-200"
                        />
                        <label htmlFor="terms" className="text-sm text-slate-400 leading-tight cursor-pointer">
                          <span className="text-slate-900 font-medium">Servis Sağlayıcı Sözleşmesi</span> ve{' '}
                          <span className="text-slate-900 font-medium">Gizlilik Politikası</span>&apos;nı okudum ve
                          kabul ediyorum. Sağladığım bilgilerin doğruluğunu onaylıyorum.
                        </label>
                      </div>
                      {errors.terms && <p className="text-xs text-red-600">{errors.terms}</p>}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        className="flex-1 bg-transparent border-slate-200 text-slate-700 hover:bg-red-50 rounded-sm h-12"
                      >
                        Geri
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider rounded-sm h-12"
                      >
                        {isSubmitting ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
                      </Button>
                    </div>
                    {errors.submit && <p className="text-xs text-red-600 text-center">{errors.submit}</p>}
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Document Upload Zone Component
interface DocumentUploadZoneProps {
  label: string;
  description: string;
  required?: boolean;
  file: UploadedFile | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
  error?: string;
}

function DocumentUploadZone({
  label,
  description,
  required,
  file,
  onSelect,
  onRemove,
  error,
}: DocumentUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`border rounded-sm p-4 ${error ? 'border-red-200/50' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-slate-50 rounded-sm flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
              {label}
              {required && <span className="text-red-600 text-xs">* Zorunlu</span>}
            </p>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
      </div>

      {file ? (
        <div className="mt-3 bg-red-50 border border-red-200/30 rounded-sm p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-600">{file.name}</span>
            <span className="text-xs text-slate-500">({file.size})</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-600 hover:text-red-300 hover:bg-red-50 h-7 px-2"
          >
            Kaldır
          </Button>
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onSelect(file);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-3 w-full border-2 border-dashed border-slate-200 hover:border-red-200/50 rounded-sm p-4 flex flex-col items-center justify-center gap-2 transition-colors"
          >
            <Upload className="w-5 h-5 text-slate-500" />
            <span className="text-sm text-slate-400">Yüklemek için tıklayın</span>
            <span className="text-xs text-slate-600">PDF, JPG, PNG (max 10MB)</span>
          </button>
        </>
      )}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}

function toBackendSpecialty(value: string) {
  const map: Record<string, string> = {
    electric: 'Electric',
    mechanic: 'Mechanic',
    pneumatic: 'Pneumatic',
    hydraulic: 'Hydraulic',
    software: 'Software',
    general: 'General',
    hvac: 'General',
  };
  return map[value] ?? 'General';
}

function documentLabel(value: string) {
  const map: Record<string, string> = {
    taxCertificate: 'Vergi Levhası',
    insurance: 'Sigorta Belgesi',
    technicalLicense: 'Teknik Lisans',
    isoCertificate: 'ISO Sertifikası',
  };
  return map[value] ?? value;
}

async function uploadProviderDocument(providerId: string, docType: string, uploadedFile: UploadedFile) {
  const formData = new FormData();
  formData.append('file', uploadedFile.file);
  formData.append('type', documentLabel(docType));
  formData.append('providerId', providerId);
  await api.upload('/uploads/provider-documents', formData);
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
