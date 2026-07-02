import { type FormEvent, type KeyboardEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import {
  normalizeExpertiseTag,
  normalizeSearchText,
  serviceSpecialtyCategories,
  suggestedExpertiseTags,
} from '@/lib/serviceExpertise';
import { cities, districtsForCity, firstDistrictForCity, normalizeDistrictList } from '@/lib/locations';
import type { TicketCategory } from '@/store/useCustomerStore';
import { requestPasswordReset, useAuthStore } from '@/store/useAuthStore';
import loginImage from './assets/login.svg';
import registerImage from './assets/register.svg';
import './AnimatedAuthPage.css';

type AuthRole = 'customer' | 'service';
type AuthView = 'login' | 'register';
type IconName = 'mail' | 'lock' | 'phone' | 'service' | 'user' | 'file';

interface AnimatedAuthPageProps {
  initialRole: AuthRole;
  initialView: AuthView;
}

const localDemoPassword = import.meta.env.DEV ? 'demo123' : '';

const customerSlogans = [
  {
    tr: 'ARIZALARINIZ İÇİN HIZLI VE GÜVENİLİR ÇÖZÜM',
    en: 'Fast & Reliable Solutions for Every Breakdown',
  },
  {
    tr: 'VARLIKLARINIZI VE BAKIM PLANLARINIZI YÖNETİN',
    en: 'Manage Your Assets & Maintenance Plans in One Place',
  },
  {
    tr: 'KALİTELİ SERVİS FİRMALARINA ANINDA ULAŞIN',
    en: 'Instant Access to Verified Service Providers',
  },
];

const serviceSlogans = [
  {
    tr: 'FABRİKA/İŞLETMELER SİZİ ARASIN, SİZ İŞİNİZE ODAKLANIN',
    en: 'Let Businesses Come to You — You Focus on the Work',
  },
  {
    tr: 'EKİBİNİZİ, İŞLERİNİZİ VE GELİRİNİZİ TEK EKRANDAN YÖNETİN',
    en: 'Manage Your Team, Jobs & Revenue — All in One Screen',
  },
  {
    tr: 'DOĞRU FABRİKA/İŞLETMEYE, DOĞRU ZAMANDA ULAŞIN',
    en: 'Reach the Right Business at the Right Time',
  },
];

const serviceDocumentFields = [
  { key: 'taxCertificate', label: 'Vergi Levhası' },
  { key: 'insurance', label: 'Sigorta Belgesi' },
  { key: 'technicalLicense', label: 'Teknik Lisans' },
  { key: 'isoCertificate', label: 'ISO Sertifikası' },
] as const;

type ServiceDocumentKey = (typeof serviceDocumentFields)[number]['key'];

function FieldIcon({ name }: { name: IconName }) {
  return (
    <span className="animated-auth__field-icon" aria-hidden="true">
      {name === 'mail' && (
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M3.8 5h16.4c1 0 1.8.8 1.8 1.8v10.4c0 1-.8 1.8-1.8 1.8H3.8c-1 0-1.8-.8-1.8-1.8V6.8C2 5.8 2.8 5 3.8 5Zm.5 3.2v8.2h15.4V8.2l-7 5.1a1.2 1.2 0 0 1-1.4 0l-7-5.1Zm14-1.2H5.7l6.3 4.6L18.3 7Z" />
        </svg>
      )}
      {name === 'lock' && (
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M7 10V8a5 5 0 0 1 10 0v2h.5c1 0 1.8.8 1.8 1.8v7.4c0 1-.8 1.8-1.8 1.8h-11c-1 0-1.8-.8-1.8-1.8v-7.4c0-1 .8-1.8 1.8-1.8H7Zm2.2 0h5.6V8a2.8 2.8 0 0 0-5.6 0v2Zm3.9 5.2a1.7 1.7 0 1 0-2.2 0V18h2.2v-2.8Z" />
        </svg>
      )}
      {name === 'service' && (
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="m20.7 18.6-6.2-6.2a6 6 0 0 0-7.7-7.7l3.6 3.6-2.1 2.1L4.6 6.8a6 6 0 0 0 7.7 7.7l6.2 6.2a1.5 1.5 0 0 0 2.2-2.1Z" />
        </svg>
      )}
      {name === 'phone' && (
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M7 2h10c1 0 1.8.8 1.8 1.8v16.4c0 1-.8 1.8-1.8 1.8H7c-1 0-1.8-.8-1.8-1.8V3.8C5.2 2.8 6 2 7 2Zm.5 3v13h9V5h-9Zm3.2 14.5a1.3 1.3 0 1 0 2.6 0 1.3 1.3 0 0 0-2.6 0Z" />
        </svg>
      )}
      {name === 'user' && (
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M12 12.2a5.1 5.1 0 1 0 0-10.2 5.1 5.1 0 0 0 0 10.2Zm0 2.2c-4.8 0-8.7 2.6-8.7 5.8 0 1 .8 1.8 1.8 1.8h13.8c1 0 1.8-.8 1.8-1.8 0-3.2-3.9-5.8-8.7-5.8Z" />
        </svg>
      )}
      {name === 'file' && (
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M6 2h8l5 5v13.2c0 1-.8 1.8-1.8 1.8H6.8c-1 0-1.8-.8-1.8-1.8V3.8C5 2.8 5.8 2 6.8 2H6Zm7 1.8V8h4.2L13 3.8ZM8 12h8v2H8v-2Zm0 4h8v2H8v-2Z" />
        </svg>
      )}
    </span>
  );
}

function BannerSlogans({
  audience,
  slogans,
}: {
  audience: string;
  slogans: Array<{ tr: string; en: string }>;
}) {
  return (
    <div className="animated-auth__banner-copy">
      <span className="animated-auth__banner-eyebrow">{audience}</span>
      <h3>Maintly ile daha kolay</h3>
      <div className="animated-auth__slogan-list">
        {slogans.map((slogan, index) => (
          <div className="animated-auth__slogan-item" key={slogan.tr}>
            <span className="animated-auth__slogan-index">{index + 1}</span>
            <span className="animated-auth__slogan-text">
              <strong>{slogan.tr}</strong>
              <span>{slogan.en}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentPicker({
  field,
  file,
  onChange,
}: {
  field: (typeof serviceDocumentFields)[number];
  file: File | null;
  onChange: (key: ServiceDocumentKey, files: FileList | null) => void;
}) {
  return (
    <div className="animated-auth__input-field animated-auth__input-field--compact animated-auth__input-field--file">
      <FieldIcon name="file" />
      <label className="animated-auth__file-picker">
        <span>{file?.name ?? field.label}</span>
        <input
          name={field.key}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          onChange={(event) => onChange(field.key, event.currentTarget.files)}
        />
      </label>
    </div>
  );
}

export default function AnimatedAuthPage({ initialRole, initialView }: AnimatedAuthPageProps) {
  const navigate = useNavigate();
  const { loginWithPassword, isLoading, error, setError } = useAuthStore();
  const [activeRole, setActiveRole] = useState<AuthRole>(initialRole);
  const [customerView, setCustomerView] = useState<AuthView>(
    initialRole === 'customer' ? initialView : 'login'
  );
  const [serviceView, setServiceView] = useState<AuthView>(
    initialRole === 'service' ? initialView : 'login'
  );
  const [customerLogin, setCustomerLogin] = useState({
    email: 'customer@demo.com',
    password: localDemoPassword,
  });
  const [customerRegister, setCustomerRegister] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    terms: false,
  });
  const [serviceLogin, setServiceLogin] = useState({
    identifier: 'service@demo.com',
    secret: localDemoPassword,
  });
  const [serviceRegister, setServiceRegister] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    city: '',
    district: '',
    coverageDistricts: [] as string[],
    specialties: [] as TicketCategory[],
    expertiseTags: [] as string[],
    password: '',
    confirmPassword: '',
    taxCertificate: null as File | null,
    insurance: null as File | null,
    technicalLicense: null as File | null,
    isoCertificate: null as File | null,
    terms: false,
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [localNotice, setLocalNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetRequesting, setIsResetRequesting] = useState(false);
  const [serviceExpertiseQuery, setServiceExpertiseQuery] = useState('');

  const isServiceMode = activeRole === 'service';
  const activeView = isServiceMode ? serviceView : customerView;
  const authClassName = [
    'animated-auth',
    isServiceMode ? 'animated-auth--service' : 'animated-auth--customer',
    `animated-auth--${activeView}`,
    `animated-auth--${activeRole}-${activeView}`,
  ].join(' ');

  const filteredExpertiseSuggestions = useMemo(() => {
    const normalizedQuery = normalizeSearchText(serviceExpertiseQuery);
    return suggestedExpertiseTags
      .filter((tag) => !serviceRegister.expertiseTags.includes(tag))
      .filter((tag) => !normalizedQuery || normalizeSearchText(tag).includes(normalizedQuery))
      .slice(0, 10);
  }, [serviceExpertiseQuery, serviceRegister.expertiseTags]);
  const serviceDistricts = useMemo(() => districtsForCity(serviceRegister.city), [serviceRegister.city]);

  const handleServiceCityChange = (city: string) => {
    const district = firstDistrictForCity(city);
    setServiceRegister((prev) => ({
      ...prev,
      city,
      district,
      coverageDistricts: district ? [district] : [],
    }));
  };

  const toggleServiceSpecialty = (specialty: TicketCategory) => {
    setServiceRegister((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter((item) => item !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  const toggleServiceCoverageDistrict = (district: string) => {
    setServiceRegister((prev) => ({
      ...prev,
      coverageDistricts: prev.coverageDistricts.includes(district)
        ? prev.coverageDistricts.filter((item) => item !== district)
        : [...prev.coverageDistricts, district],
    }));
  };

  const addExpertiseTag = (value: string) => {
    const tag = normalizeExpertiseTag(value);
    if (!tag) return;

    setServiceRegister((prev) =>
      prev.expertiseTags.includes(tag)
        ? prev
        : { ...prev, expertiseTags: [...prev.expertiseTags, tag] }
    );
    setServiceExpertiseQuery('');
  };

  const removeExpertiseTag = (tag: string) => {
    setServiceRegister((prev) => ({
      ...prev,
      expertiseTags: prev.expertiseTags.filter((item) => item !== tag),
    }));
  };

  const handleExpertiseKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addExpertiseTag(serviceExpertiseQuery);
      return;
    }

    if (event.key === 'Backspace' && !serviceExpertiseQuery) {
      setServiceRegister((prev) => ({
        ...prev,
        expertiseTags: prev.expertiseTags.slice(0, -1),
      }));
    }
  };

  const clearFeedback = () => {
    setLocalError(null);
    setLocalNotice(null);
    setError(null);
  };

  const handleCustomerLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();
    try {
      const signedInUser = await loginWithPassword('customer', customerLogin.email, customerLogin.password);
      navigate(dashboardPathForRole(signedInUser.role ?? 'customer'));
    } catch {
      // Store error is rendered below the form.
    }
  };

  const handleServiceLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();
    try {
      const signedInUser = await loginWithPassword('service', serviceLogin.identifier, serviceLogin.secret);
      navigate(dashboardPathForRole(signedInUser.role ?? 'service'));
    } catch {
      // Store error is rendered below the form.
    }
  };

  const handleForgotPassword = async (email: string) => {
    clearFeedback();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLocalError('Şifre sıfırlama bağlantısı için e-posta adresinizi yazın.');
      return;
    }

    setIsResetRequesting(true);
    try {
      setLocalNotice(await requestPasswordReset(trimmedEmail));
    } catch (submitError) {
      setLocalError(
        submitError instanceof Error
          ? submitError.message
          : 'Şifre sıfırlama bağlantısı gönderilemedi'
      );
    } finally {
      setIsResetRequesting(false);
    }
  };

  const handleCustomerRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();

    if (customerRegister.password !== customerRegister.confirmPassword) {
      setLocalError('Şifreler eşleşmiyor');
      return;
    }

    if (!customerRegister.terms) {
      setLocalError('Kullanım koşullarını kabul etmelisiniz');
      return;
    }

    const customerName = `${customerRegister.firstName} ${customerRegister.lastName}`.trim();
    setIsSubmitting(true);
    let accountCreated = false;
    try {
      await api.post<{ id: string; email: string; name: string }>('/customers', {
        name: customerName,
        email: customerRegister.email,
        phone: customerRegister.phone,
        companyName: customerName,
        city: 'Istanbul',
        password: customerRegister.password,
      });
      accountCreated = true;
      setLocalNotice('Fabrika/İşletme hesabınız oluşturuldu. Giriş yapılıyor...');
      const signedInUser = await loginWithPassword('customer', customerRegister.email, customerRegister.password);
      navigate(dashboardPathForRole(signedInUser.role ?? 'customer'));
    } catch (submitError) {
      if (accountCreated) {
        setCustomerView('login');
        setCustomerLogin({
          email: customerRegister.email,
          password: customerRegister.password,
        });
        setLocalNotice('Hesap oluşturuldu. E-posta ve şifrenizle giriş yapabilirsiniz.');
        setLocalError(
          submitError instanceof Error
            ? `Otomatik giriş yapılamadı: ${submitError.message}`
            : 'Otomatik giriş yapılamadı'
        );
      } else {
        setLocalError(
          submitError instanceof Error ? submitError.message : 'Fabrika/İşletme kaydı oluşturulamadı'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleServiceRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();

    if (serviceRegister.password !== serviceRegister.confirmPassword) {
      setLocalError('Şifreler eşleşmiyor');
      return;
    }

    if (!serviceRegister.terms) {
      setLocalError('Servis sağlayıcı sözleşmesini kabul etmelisiniz');
      return;
    }

    if (!serviceRegister.city || !serviceRegister.district) {
      setLocalError('Servis merkezi için il ve ilçe seçmelisiniz');
      return;
    }

    if (serviceRegister.coverageDistricts.length === 0) {
      setLocalError('Hizmet vereceğiniz en az bir ilçe seçmelisiniz');
      return;
    }

    const pendingExpertiseTag = normalizeExpertiseTag(serviceExpertiseQuery);
    const expertiseTags =
      pendingExpertiseTag && !serviceRegister.expertiseTags.includes(pendingExpertiseTag)
        ? [...serviceRegister.expertiseTags, pendingExpertiseTag]
        : serviceRegister.expertiseTags;

    if (serviceRegister.specialties.length === 0) {
      setLocalError('En az bir ana uzmanlık alanı seçmelisiniz');
      return;
    }

    if (expertiseTags.length === 0) {
      setLocalError('En az bir detay uzmanlık etiketi eklemelisiniz');
      return;
    }

    const hasDocument = serviceDocumentFields.some((field) => Boolean(serviceRegister[field.key]));
    if (!hasDocument) {
      setLocalError('Başvuru için en az bir resmi belge yüklemelisiniz');
      return;
    }

    setIsSubmitting(true);
    let providerCreated = false;
    try {
      const registrationRequest = {
        name: serviceRegister.companyName,
        contactName: serviceRegister.contactName,
        email: serviceRegister.email,
        phone: serviceRegister.phone,
        city: serviceRegister.city,
        district: serviceRegister.district,
        specialties: serviceRegister.specialties,
        expertiseTags,
        coverageDistricts: normalizeDistrictList(serviceRegister.coverageDistricts),
        password: serviceRegister.password,
      };
      const formData = new FormData();
      formData.append(
        'request',
        new Blob([JSON.stringify(registrationRequest)], { type: 'application/json' })
      );
      serviceDocumentFields.forEach((field) => {
        const file = serviceRegister[field.key];
        if (file) {
          formData.append(field.key, file);
        }
      });
      await api.upload<{ id: string }>('/providers', formData);
      providerCreated = true;
      setLocalNotice('Başvurunuz alındı. Servis paneliniz açılıyor...');
      const signedInUser = await loginWithPassword('service', serviceRegister.email, serviceRegister.password);
      navigate(dashboardPathForRole(signedInUser.role ?? 'service'));
    } catch (submitError) {
      if (providerCreated) {
        setServiceView('login');
        setServiceLogin((prev) => ({
          ...prev,
          identifier: serviceRegister.email,
          secret: serviceRegister.password,
        }));
        setLocalNotice('Başvurunuz alındı. E-posta ve şifrenizle servis paneline giriş yapabilirsiniz.');
        setLocalError(
          submitError instanceof Error
            ? `Otomatik giriş yapılamadı: ${submitError.message}`
            : 'Otomatik giriş yapılamadı'
        );
      } else {
        setLocalError(submitError instanceof Error ? submitError.message : 'Başvuru gönderilemedi');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleServiceDocumentChange = (key: ServiceDocumentKey, files: FileList | null) => {
    setServiceRegister((prev) => ({
      ...prev,
      [key]: files?.[0] ?? null,
    }));
  };

  return (
    <div className={authClassName}>
      <div className="animated-auth__forms-container">
        <div className="animated-auth__form-stage">
          <form
            className={`animated-auth__form animated-auth__form--customer ${
              customerView === 'register' ? 'animated-auth__form--register' : ''
            }`}
            onSubmit={
              customerView === 'login' ? handleCustomerLogin : handleCustomerRegister
            }
          >
            <h2 className="animated-auth__title">
              {customerView === 'login' ? 'Fabrika/İşletme Girişi' : 'Fabrika/İşletme Kaydı'}
            </h2>

            {customerView === 'login' ? (
              <>
                <div className="animated-auth__input-field">
                  <FieldIcon name="mail" />
                  <input
                    name="email"
                    type="email"
                    placeholder="E-posta adresi"
                    autoComplete="email"
                    required
                    value={customerLogin.email}
                    onChange={(event) =>
                      setCustomerLogin((prev) => ({ ...prev, email: event.target.value }))
                    }
                  />
                </div>
                <div className="animated-auth__input-field">
                  <FieldIcon name="lock" />
                  <input
                    name="password"
                    type="password"
                    placeholder="Şifre"
                    autoComplete="current-password"
                    required
                    value={customerLogin.password}
                    onChange={(event) =>
                      setCustomerLogin((prev) => ({
                        ...prev,
                        password: event.target.value,
                      }))
                    }
                  />
                </div>
                <button
                  className="animated-auth__forgot-link"
                  type="button"
                  disabled={isResetRequesting}
                  onClick={() => handleForgotPassword(customerLogin.email)}
                >
                  {isResetRequesting ? 'Bağlantı gönderiliyor...' : 'Şifremi unuttum'}
                </button>
                <button className="animated-auth__btn animated-auth__btn--solid" type="submit" disabled={isLoading}>
                  {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                </button>
                <button
                  className="animated-auth__form-switch"
                  type="button"
                  onClick={() => {
                    clearFeedback();
                    setCustomerView('register');
                  }}
                >
                  Hesabınız yok mu? Kaydolun
                </button>
              </>
            ) : (
              <>
                <div className="animated-auth__form-grid">
                  <div className="animated-auth__input-field animated-auth__input-field--compact">
                    <FieldIcon name="user" />
                    <input
                      name="firstName"
                      placeholder="Ad"
                      required
                      value={customerRegister.firstName}
                      onChange={(event) =>
                        setCustomerRegister((prev) => ({
                          ...prev,
                          firstName: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="animated-auth__input-field animated-auth__input-field--compact">
                    <FieldIcon name="user" />
                    <input
                      name="lastName"
                      placeholder="Soyad"
                      required
                      value={customerRegister.lastName}
                      onChange={(event) =>
                        setCustomerRegister((prev) => ({
                          ...prev,
                          lastName: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="animated-auth__input-field animated-auth__input-field--compact">
                  <FieldIcon name="mail" />
                  <input
                    name="email"
                    type="email"
                    placeholder="E-posta Adresi"
                    autoComplete="email"
                    required
                    value={customerRegister.email}
                    onChange={(event) =>
                      setCustomerRegister((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="animated-auth__input-field animated-auth__input-field--compact">
                  <FieldIcon name="phone" />
                  <input
                    name="phone"
                    type="tel"
                    placeholder="Telefon Numarası"
                    autoComplete="tel"
                    required
                    value={customerRegister.phone}
                    onChange={(event) =>
                      setCustomerRegister((prev) => ({
                        ...prev,
                        phone: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="animated-auth__form-grid">
                  <div className="animated-auth__input-field animated-auth__input-field--compact">
                    <FieldIcon name="lock" />
                    <input
                      name="password"
                      type="password"
                      placeholder="Şifre"
                      autoComplete="new-password"
                      required
                      value={customerRegister.password}
                      onChange={(event) =>
                        setCustomerRegister((prev) => ({
                          ...prev,
                          password: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="animated-auth__input-field animated-auth__input-field--compact">
                    <FieldIcon name="lock" />
                    <input
                      name="confirmPassword"
                      type="password"
                      placeholder="Şifre Tekrar"
                      autoComplete="new-password"
                      required
                      value={customerRegister.confirmPassword}
                      onChange={(event) =>
                        setCustomerRegister((prev) => ({
                          ...prev,
                          confirmPassword: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <label className="animated-auth__rules">
                  <input
                    name="terms"
                    type="checkbox"
                    checked={customerRegister.terms}
                    onChange={(event) =>
                      setCustomerRegister((prev) => ({
                        ...prev,
                        terms: event.target.checked,
                      }))
                    }
                  />
                  <span>Kullanım Koşulları ve Gizlilik Politikası'nı kabul ediyorum.</span>
                </label>
                <button className="animated-auth__btn animated-auth__btn--solid" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Oluşturuluyor...' : 'Hesap Oluştur'}
                </button>
                <button
                  className="animated-auth__form-switch"
                  type="button"
                  onClick={() => {
                    clearFeedback();
                    setCustomerView('login');
                  }}
                >
                  Zaten hesabınız var mı? Giriş yapın
                </button>
              </>
            )}
            {(error || localError) && (
              <p className="animated-auth__error">{localError ?? error}</p>
            )}
            {localNotice && <p className="animated-auth__notice">{localNotice}</p>}
          </form>

          <form
            className={`animated-auth__form animated-auth__form--service ${
              serviceView === 'register'
                ? 'animated-auth__form--register animated-auth__form--service-register'
                : ''
            }`}
            onSubmit={serviceView === 'login' ? handleServiceLogin : handleServiceRegister}
          >
            <h2 className="animated-auth__title">
              {serviceView === 'login' ? 'Servis Girişi' : 'Servis Başvurusu'}
            </h2>

            {serviceView === 'login' ? (
              <>
                <div className="animated-auth__input-field">
                  <FieldIcon name="mail" />
                  <input
                    name="identifier"
                    type="email"
                    placeholder="Servis e-posta adresi"
                    autoComplete="email"
                    required
                    value={serviceLogin.identifier}
                    onChange={(event) =>
                      setServiceLogin((prev) => ({
                        ...prev,
                        identifier: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="animated-auth__input-field">
                  <FieldIcon name="lock" />
                  <input
                    name="secret"
                    type="password"
                    placeholder="Şifre"
                    autoComplete="current-password"
                    required
                    value={serviceLogin.secret}
                    onChange={(event) =>
                      setServiceLogin((prev) => ({
                        ...prev,
                        secret: event.target.value,
                      }))
                    }
                  />
                </div>
                <button
                  className="animated-auth__forgot-link"
                  type="button"
                  disabled={isResetRequesting}
                  onClick={() => handleForgotPassword(serviceLogin.identifier)}
                >
                  {isResetRequesting ? 'Bağlantı gönderiliyor...' : 'Şifremi unuttum'}
                </button>
                <button className="animated-auth__btn animated-auth__btn--solid" type="submit" disabled={isLoading}>
                  {isLoading ? 'Giriş yapılıyor...' : 'Servis Girişi'}
                </button>
                <p className="animated-auth__social-text">
                  Yetkili servis hesabınızla panelinize erişebilirsiniz.
                </p>
                <button
                  className="animated-auth__form-switch"
                  type="button"
                  onClick={() => {
                    clearFeedback();
                    setServiceView('register');
                  }}
                >
                  Servis sağlayıcısı başvurusu yapın
                </button>
              </>
            ) : (
              <>
                <div className="animated-auth__register-scroll">
                  <div className="animated-auth__form-grid">
                    <div className="animated-auth__input-field animated-auth__input-field--compact">
                      <FieldIcon name="service" />
                      <input
                        name="companyName"
                        placeholder="Firma Adı"
                        required
                        value={serviceRegister.companyName}
                        onChange={(event) =>
                          setServiceRegister((prev) => ({
                            ...prev,
                            companyName: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="animated-auth__input-field animated-auth__input-field--compact">
                      <FieldIcon name="user" />
                      <input
                        name="contactName"
                        placeholder="Yetkili Kişi"
                        required
                        value={serviceRegister.contactName}
                        onChange={(event) =>
                          setServiceRegister((prev) => ({
                            ...prev,
                            contactName: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="animated-auth__form-grid">
                    <div className="animated-auth__input-field animated-auth__input-field--compact">
                      <FieldIcon name="mail" />
                      <input
                        name="email"
                        type="email"
                        placeholder="E-posta"
                        required
                        value={serviceRegister.email}
                        onChange={(event) =>
                          setServiceRegister((prev) => ({
                            ...prev,
                            email: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="animated-auth__input-field animated-auth__input-field--compact">
                      <FieldIcon name="phone" />
                      <input
                        name="phone"
                        type="tel"
                        placeholder="Telefon"
                        required
                        value={serviceRegister.phone}
                        onChange={(event) =>
                          setServiceRegister((prev) => ({
                            ...prev,
                            phone: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="animated-auth__form-grid">
                    <div className="animated-auth__input-field animated-auth__input-field--compact">
                      <FieldIcon name="service" />
                      <select
                        name="city"
                        required
                        value={serviceRegister.city}
                        onChange={(event) => handleServiceCityChange(event.target.value)}
                      >
                        <option value="">Şehir</option>
                        {cities.map((city) => (
                          <option value={city} key={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="animated-auth__input-field animated-auth__input-field--compact">
                      <FieldIcon name="service" />
                      <select
                        name="district"
                        required
                        value={serviceRegister.district}
                        disabled={!serviceRegister.city}
                        onChange={(event) =>
                          setServiceRegister((prev) => ({
                            ...prev,
                            district: event.target.value,
                          }))
                        }
                      >
                        <option value="">İlçe</option>
                        {serviceDistricts.map((district) => (
                          <option value={district} key={district}>
                            {district}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="animated-auth__specialty-block">
                    <div className="animated-auth__section-label">Hizmet verilen ilçeler</div>
                    <div className="animated-auth__specialty-grid">
                      {serviceDistricts.map((district) => {
                        const selected = serviceRegister.coverageDistricts.includes(district);
                        return (
                          <button
                            key={district}
                            type="button"
                            className={`animated-auth__specialty-choice${
                              selected ? ' animated-auth__specialty-choice--selected' : ''
                            }`}
                            aria-pressed={selected}
                            onClick={() => toggleServiceCoverageDistrict(district)}
                          >
                            {district}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="animated-auth__specialty-block">
                    <div className="animated-auth__section-label">Ana uzmanlık alanları</div>
                    <div className="animated-auth__specialty-grid">
                      {serviceSpecialtyCategories.map((category) => {
                        const selected = serviceRegister.specialties.includes(category.value);
                        return (
                          <button
                            key={category.value}
                            type="button"
                            className={`animated-auth__specialty-choice${
                              selected ? ' animated-auth__specialty-choice--selected' : ''
                            }`}
                            aria-pressed={selected}
                            onClick={() => toggleServiceSpecialty(category.value)}
                          >
                            {category.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="animated-auth__tag-block">
                    <div className="animated-auth__section-label">Detay uzmanlıklar</div>
                    <div className="animated-auth__tag-input-wrap">
                      <FieldIcon name="service" />
                      <div className="animated-auth__tag-input-content">
                        {serviceRegister.expertiseTags.length > 0 && (
                          <div className="animated-auth__tag-chip-row">
                            {serviceRegister.expertiseTags.map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                className="animated-auth__tag-chip"
                                onClick={() => removeExpertiseTag(tag)}
                              >
                                <span>{tag}</span>
                                <span aria-hidden="true">×</span>
                              </button>
                            ))}
                          </div>
                        )}
                        <input
                          name="expertiseTags"
                          type="text"
                          placeholder="Vana, pompa, rulman..."
                          value={serviceExpertiseQuery}
                          onChange={(event) => setServiceExpertiseQuery(event.target.value)}
                          onKeyDown={handleExpertiseKeyDown}
                        />
                      </div>
                    </div>
                    {serviceExpertiseQuery.trim().length > 0 && filteredExpertiseSuggestions.length > 0 && (
                      <div className="animated-auth__tag-suggestions">
                        {filteredExpertiseSuggestions.map((tag) => (
                          <button key={tag} type="button" onClick={() => addExpertiseTag(tag)}>
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="animated-auth__form-grid">
                    <div className="animated-auth__input-field animated-auth__input-field--compact">
                      <FieldIcon name="lock" />
                      <input
                        name="password"
                        type="password"
                        placeholder="Şifre"
                        required
                        value={serviceRegister.password}
                        onChange={(event) =>
                          setServiceRegister((prev) => ({
                            ...prev,
                            password: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="animated-auth__input-field animated-auth__input-field--compact">
                      <FieldIcon name="lock" />
                      <input
                        name="confirmPassword"
                        type="password"
                        placeholder="Şifre Tekrar"
                        required
                        value={serviceRegister.confirmPassword}
                        onChange={(event) =>
                          setServiceRegister((prev) => ({
                            ...prev,
                            confirmPassword: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="animated-auth__form-grid">
                    {serviceDocumentFields.slice(0, 2).map((field) => (
                      <DocumentPicker
                        key={field.key}
                        field={field}
                        file={serviceRegister[field.key]}
                        onChange={handleServiceDocumentChange}
                      />
                    ))}
                  </div>
                  <div className="animated-auth__form-grid">
                    {serviceDocumentFields.slice(2).map((field) => (
                      <DocumentPicker
                        key={field.key}
                        field={field}
                        file={serviceRegister[field.key]}
                        onChange={handleServiceDocumentChange}
                      />
                    ))}
                  </div>
                </div>
                <label className="animated-auth__rules">
                  <input
                    name="terms"
                    type="checkbox"
                    checked={serviceRegister.terms}
                    onChange={(event) =>
                      setServiceRegister((prev) => ({
                        ...prev,
                        terms: event.target.checked,
                      }))
                    }
                  />
                  <span>Servis Sağlayıcı Sözleşmesi ve Gizlilik Politikası'nı kabul ediyorum.</span>
                </label>
                <button className="animated-auth__btn animated-auth__btn--solid" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
                </button>
                <button
                  className="animated-auth__form-switch"
                  type="button"
                  onClick={() => {
                    clearFeedback();
                    setServiceView('login');
                  }}
                >
                  Zaten servis hesabınız var mı? Giriş yapın
                </button>
              </>
            )}
            {(error || localError) && (
              <p className="animated-auth__error">{localError ?? error}</p>
            )}
            {localNotice && <p className="animated-auth__notice">{localNotice}</p>}
          </form>
        </div>
      </div>

      <div className="animated-auth__panels-container">
        <div className="animated-auth__panel animated-auth__panel--left">
          <div className="animated-auth__panel-content">
            <BannerSlogans audience="Fabrika/İşletmeler için" slogans={customerSlogans} />
            <button
              className="animated-auth__btn animated-auth__btn--transparent"
              type="button"
              onClick={() => {
                clearFeedback();
                setActiveRole('service');
                setServiceView('login');
              }}
            >
              Servis Girişi
            </button>
          </div>
          <img src={registerImage} className="animated-auth__image" alt="Register" />
        </div>

        <div className="animated-auth__panel animated-auth__panel--right">
          <div className="animated-auth__panel-content">
            <BannerSlogans audience="Servis firmaları için" slogans={serviceSlogans} />
            <button
              className="animated-auth__btn animated-auth__btn--transparent"
              type="button"
              onClick={() => {
                clearFeedback();
                setActiveRole('customer');
                setCustomerView('login');
              }}
            >
              Fabrika/İşletme Girişi
            </button>
          </div>
          <img src={loginImage} className="animated-auth__image" alt="Login" />
        </div>
      </div>
    </div>
  );
}

function dashboardPathForRole(role: AuthRole | 'admin') {
  return `/${role}/dashboard`;
}
