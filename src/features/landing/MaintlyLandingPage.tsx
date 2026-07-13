import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api, resolvePublicFileUrl } from '@/lib/api';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  Factory,
  FileText,
  Link2,
  MapPin,
  RadioTower,
  Sparkles,
  Timer,
  UsersRound,
  Wrench,
  Zap,
} from 'lucide-react';
import NetworkScene from './NetworkScene';
import logoImg from '@/assets/logo.png';
import {
  proofPoints,
  howItWorks,
  forFactories,
  forServices,
  footerLinks,
  type LandingProvider,
  type LandingSnapshot,
  type RibbonEntry,
} from './data';

/* ============================================
   Hooks
   ============================================ */

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

function useScrolledNav(threshold = 60) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

function useLandingSnapshot() {
  const [snapshot, setSnapshot] = useState<LandingSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    api.get<LandingSnapshot>('/public/landing')
      .then((response) => {
        if (!active) return;
        setSnapshot(response);
        setHasError(false);
      })
      .catch(() => {
        if (!active) return;
        setHasError(true);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  return { snapshot, isLoading, hasError };
}

/* ============================================
   MaintlyLandingPage — Fully Responsive
   ============================================ */

export default function MaintlyLandingPage() {
  useScrollReveal();
  const landing = useLandingSnapshot();

  return (
    <main
      className="min-h-screen overflow-x-hidden bg-white text-gray-900 antialiased"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <HeroSection {...landing} />
      <ProviderRibbonSection
        ribbon={landing.snapshot?.ribbon ?? []}
        total={landing.snapshot?.stats.verifiedProviderCount ?? 0}
        isLoading={landing.isLoading}
      />
      <HowItWorksSection />
      <ForWhomSection />
      <CTASection />
      <FooterSection />
    </main>
  );
}

/* ============================================
   Hero
   ============================================ */

function HeroSection({
  snapshot,
  isLoading,
  hasError,
}: ReturnType<typeof useLandingSnapshot>) {
  const scrolled = useScrolledNav();
  const liveStats = [
    {
      label: 'Doğrulanmış Servis',
      value: snapshot ? formatStat(snapshot.stats.verifiedProviderCount) : '—',
    },
    {
      label: 'Hizmet Verilen İl',
      value: snapshot ? formatStat(snapshot.stats.servedCityCount) : '—',
    },
    {
      label: 'Tamamlanan İş',
      value: snapshot ? formatStat(snapshot.stats.completedWorkOrderCount) : '—',
    },
  ];

  return (
    <section className="maintly-hero-scene relative min-h-[100svh] overflow-hidden">
      <div className="maintly-hero-photo" aria-hidden="true" />
      <div className="maintly-hero-noise" aria-hidden="true" />
      <NetworkScene
        providers={snapshot?.providers ?? []}
        verifiedProviderCount={snapshot?.stats.verifiedProviderCount ?? 0}
        isLoading={isLoading}
      />
      {snapshot && snapshot.providers.length > 0 && (
        <ul className="sr-only" aria-label="Bugünün Maintly servis vitrini">
          {snapshot.providers.map((provider) => (
            <li key={`${provider.name}-${provider.city}`}>
              {provider.name}, {provider.city}, {provider.primarySpecialty}
            </li>
          ))}
        </ul>
      )}

      <div className="relative z-10 flex min-h-[100svh] flex-col">
        {/* ---- Sticky Nav ---- */}
        <header
          className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
            scrolled
              ? 'bg-white/80 shadow-sm backdrop-blur-2xl border-b border-gray-200/60'
              : 'bg-transparent'
          }`}
        >
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:py-4 md:px-6 lg:px-8">
            <Link to="/" className="group flex min-w-0 items-center gap-2 sm:gap-3">
              <img src={logoImg} alt="Maintly Logo" className="h-9 w-auto object-contain sm:h-11" />
              <span className="min-w-0">
                <span className="block text-base font-black leading-none text-gray-900 sm:text-xl">Maintly</span>
                <span className="mt-0.5 hidden text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 sm:block sm:mt-1">
                  Endüstriyel bakım ağı
                </span>
              </span>
            </Link>

            <nav className="flex items-center gap-1.5 sm:gap-2">
              <Link
                to="/customer/login"
                className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-900 md:inline-flex"
              >
                Fabrika/İşletme Girişi
              </Link>
              <Link
                to="/service/login"
                className="hidden rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition-all hover:bg-red-100 md:inline-flex"
              >
                Servis Girişi
              </Link>
              <MobileMenu />
            </nav>
          </div>
        </header>

        {/* ---- Hero Content ---- */}
        <div className="mx-auto flex w-full max-w-7xl flex-1 items-center px-4 pb-6 pt-24 sm:px-6 sm:pb-10 sm:pt-28 md:pb-12 md:pt-32 lg:px-8">
          <div className="max-w-3xl">
            {/* Badge */}
            <div
              data-reveal
              className="maintly-badge-glow mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-red-700 sm:mb-5 sm:gap-2.5 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.18em]"
            >
              <Sparkles className="h-3 w-3 shrink-0 text-red-500 sm:h-3.5 sm:w-3.5" />
              <span className="min-w-0 truncate">Türkiye'nin canlı bakım ağı</span>
            </div>

            {/* Headline */}
            <h1
              data-reveal
              data-reveal-delay="1"
              className="maintly-gradient-text text-balance text-4xl font-black leading-none tracking-tight pb-2 sm:text-5xl md:text-7xl lg:text-8xl xl:text-[6.5rem]"
            >
              Maintly
            </h1>
            <p
              data-reveal
              data-reveal-delay="2"
              className="mt-3 max-w-2xl text-xl font-extrabold leading-tight text-gray-900 sm:mt-4 sm:text-2xl md:text-3xl lg:text-4xl"
            >
              Endüstriyel bakımın güvenilir ağı.
            </p>
            <p
              data-reveal
              data-reveal-delay="3"
              className="mt-4 max-w-xl text-sm font-medium leading-6 text-gray-500 sm:mt-5 sm:text-base sm:leading-7 md:text-lg"
            >
              Fabrikalar, tesisler ve uzman servis ekipleri Maintly'de buluşur.
              Bakım ihtiyaçlarınız için doğru ekipleri keşfedin, servis
              süreçlerinizi daha görünür ve hızlı yönetin.
            </p>

            {/* CTAs */}
            <div data-reveal data-reveal-delay="4" className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:gap-3">
              <Link
                to="/customer/register"
                className="group inline-flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-xs font-black text-white shadow-lg shadow-red-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-600 hover:shadow-xl hover:shadow-red-500/30 sm:min-h-[3.25rem] sm:w-auto sm:gap-2.5 sm:px-6 sm:py-3.5 sm:text-sm"
              >
                İşletme Olarak Katılın
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 sm:h-4 sm:w-4" />
              </Link>
              <Link
                to="/service/register"
                className="group inline-flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-xs font-black text-gray-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-red-200 hover:text-red-600 hover:shadow-md sm:min-h-[3.25rem] sm:w-auto sm:gap-2.5 sm:px-6 sm:py-3.5 sm:text-sm"
              >
                Servis Olarak Katılın
                <Wrench className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-12 sm:h-4 sm:w-4" />
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-1.5 sm:mt-10 sm:gap-3 md:gap-4">
              {liveStats.map((item) => (
                <AnimatedStat key={item.label} value={item.value} label={item.label} />
              ))}
            </div>

            <MobileProviderStrip
              providers={snapshot?.providers ?? []}
              total={snapshot?.stats.verifiedProviderCount ?? 0}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* ---- Proof Bar ---- */}
        <div className="border-t border-gray-200 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 sm:h-10 sm:w-10 sm:rounded-xl">
                <UsersRound className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-red-600 sm:text-[10px] sm:tracking-[0.2em]">
                  Maintly Ağı
                </p>
                <p className="mt-0.5 text-xs font-medium leading-4 text-gray-500 sm:text-sm sm:leading-5">
                  {hasError
                    ? 'Canlı ağ verisi yenilenirken platform kesintisiz çalışmaya devam ediyor.'
                    : 'Doğrulanmış servis ekipleri gerçek profilleriyle aynı ağda buluşuyor.'}
                </p>
              </div>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-0.5 sm:grid sm:grid-cols-3 sm:gap-2 sm:overflow-visible sm:pb-0">
              {proofPoints.map((point) => {
                const Icon =
                  point.key === 'network'
                    ? RadioTower
                    : point.key === 'verified'
                      ? BadgeCheck
                      : Zap;
                return <SignalPill key={point.label} icon={Icon} label={point.label} />;
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================
   Provider Ribbon (Servis Ağı Bandı)
   ============================================ */

function ProviderRibbonSection({
  ribbon,
  total,
  isLoading,
}: {
  ribbon: RibbonEntry[];
  total: number;
  isLoading: boolean;
}) {
  if (!isLoading && ribbon.length === 0) return null;

  const skeletonItems = Array.from({ length: 8 }, (_, i) => i);

  return (
    <section className="maintly-ribbon-section relative overflow-hidden">
      {/* Animated background layers */}
      <div className="maintly-ribbon-bg" aria-hidden="true" />
      <div className="maintly-ribbon-shimmer" aria-hidden="true" />
      <div className="maintly-ribbon-grid-overlay" aria-hidden="true" />

      <div className="relative z-10 py-10 sm:py-14 md:py-16">
        {/* Section Header */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div data-reveal className="mb-7 flex flex-col items-center text-center sm:mb-9">
            {/* Glowing badge */}
            <div className="maintly-ribbon-badge mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 sm:mb-5">
              <span className="maintly-ribbon-dot" />
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/90 sm:text-xs">
                Canlı Servis Ağı
              </span>
            </div>

            <h2 className="text-balance text-xl font-black tracking-tight text-white sm:text-2xl md:text-3xl">
              Ağımızdaki Doğrulanmış Ekipler
            </h2>
            <p className="mt-2 max-w-lg text-xs font-medium leading-5 text-white/50 sm:mt-3 sm:text-sm sm:leading-6">
              Platformumuza katılan, doğrulanmış uzman servis ekipleri. Her biri
              alanında uzman, güvenilir ve aktif.
            </p>

            {total > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm sm:mt-5">
                <span className="maintly-ribbon-count-dot" />
                <span className="text-[11px] font-bold text-white/70 sm:text-xs">
                  <strong className="text-white">{total.toLocaleString('tr-TR')}</strong> doğrulanmış servis
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Marquee Container */}
        <div className="maintly-ribbon-mask relative">
          {isLoading ? (
            <div className="flex gap-3 px-4 sm:gap-4 sm:px-6">
              {skeletonItems.map((i) => (
                <div
                  key={`ribbon-skeleton-${i}`}
                  className="maintly-ribbon-skeleton h-16 w-48 shrink-0 rounded-2xl sm:h-[4.5rem] sm:w-56"
                />
              ))}
            </div>
          ) : ribbon.length <= 5 ? (
            <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
              {ribbon.map((entry, index) => (
                <RibbonCard key={`${entry.name}-${index}`} entry={entry} index={index} />
              ))}
            </div>
          ) : (
            <div className="maintly-ribbon-track">
              <div className="maintly-ribbon-scroll" aria-hidden="false">
                {ribbon.map((entry, index) => (
                  <RibbonCard key={`a-${entry.name}-${index}`} entry={entry} index={index} />
                ))}
              </div>
              <div className="maintly-ribbon-scroll" aria-hidden="true">
                {ribbon.map((entry, index) => (
                  <RibbonCard key={`b-${entry.name}-${index}`} entry={entry} index={index} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function RibbonCard({ entry, index }: { entry: RibbonEntry; index: number }) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = entry.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('tr-TR'))
    .join('');

  return (
    <div
      className="maintly-ribbon-card group"
      style={{ animationDelay: `${index * -2.4}s` }}
    >
      <div className="maintly-ribbon-card-border" aria-hidden="true" />
      <div className="maintly-ribbon-card-inner">
        <span className="maintly-ribbon-logo">
          {!imageFailed && entry.logoUrl ? (
            <img
              src={resolvePublicFileUrl(entry.logoUrl)}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span>{initials || 'MS'}</span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-bold text-white/90 transition-colors group-hover:text-white sm:text-sm">
            {entry.name}
          </span>
          <span className="mt-0.5 flex items-center gap-1">
            <BadgeCheck className="h-3 w-3 shrink-0 text-emerald-400" />
            <span className="text-[9px] font-bold text-white/40 sm:text-[10px]">Doğrulanmış</span>
          </span>
        </span>
      </div>
    </div>
  );
}

/* ============================================
   How It Works
   ============================================ */

function HowItWorksSection() {
  const stepIcons = [ClipboardList, Link2, FileText];

  return (
    <section id="how-it-works" className="relative bg-slate-50 px-4 py-14 sm:px-6 sm:py-18 md:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div data-reveal className="mb-10 max-w-2xl sm:mb-14 md:mb-16">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-500 sm:text-xs">Süreç</p>
          <h2 className="mt-3 text-balance text-2xl font-black tracking-tight text-gray-900 sm:mt-4 sm:text-3xl md:text-4xl lg:text-5xl">
            Nasıl Çalışır?
          </h2>
          <p className="mt-3 text-sm font-medium leading-6 text-gray-500 sm:mt-5 sm:text-base sm:leading-7 md:text-lg">
            Bakım talebinden iş emrinin kapanışına kadar tüm süreç tek
            platformda. Karmaşık koordinasyonlar yerine odaklanmış, hızlı ve
            şeffaf bir iş akışı.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {howItWorks.map((step, i) => {
            const Icon = stepIcons[i] ?? FileText;
            return (
              <div
                key={step.step}
                data-reveal
                data-reveal-delay={step.step}
                className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-500 hover:border-red-200 hover:shadow-lg sm:rounded-2xl sm:p-7"
              >
                <div className="relative z-10 mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-500 transition-all duration-300 group-hover:bg-red-100 group-hover:shadow-md group-hover:shadow-red-100 sm:mb-6 sm:h-13 sm:w-13 sm:rounded-xl">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <span className="pointer-events-none absolute right-4 top-3 select-none text-5xl font-black leading-none text-gray-100 transition-colors duration-500 group-hover:text-red-50 sm:right-5 sm:top-4 sm:text-7xl">
                  {step.step}
                </span>
                <h3 className="relative z-10 text-base font-extrabold text-gray-900 sm:text-lg">{step.title}</h3>
                <p className="relative z-10 mt-2 text-xs leading-5 text-gray-500 sm:mt-3 sm:text-sm sm:leading-6">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================
   For Whom
   ============================================ */

function ForWhomSection() {
  return (
    <section id="for-whom" className="relative bg-white px-4 py-14 sm:px-6 sm:py-18 md:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div data-reveal className="mb-10 max-w-2xl sm:mb-14 md:mb-16">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-500 sm:text-xs">Platform</p>
          <h2 className="mt-3 text-balance text-2xl font-black tracking-tight text-gray-900 sm:mt-4 sm:text-3xl md:text-4xl lg:text-5xl">
            Kimler İçin?
          </h2>
        </div>

        <div className="grid gap-4 sm:gap-5 lg:grid-cols-2 lg:gap-6">
          {/* ---- Factory Card ---- */}
          <div
            data-reveal
            className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-500 hover:border-red-200 hover:shadow-lg sm:rounded-2xl sm:p-6 md:p-8"
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-red-50 blur-3xl transition-all duration-700 group-hover:bg-red-100/80 group-hover:scale-125 sm:h-44 sm:w-44" />

            <div className="relative flex items-center gap-3 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white shadow-lg shadow-red-500/15 sm:h-14 sm:w-14 sm:rounded-2xl">
                <Factory className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black text-gray-900 sm:text-xl">Fabrikalar ve Tesisler</h3>
                <p className="text-xs font-medium text-gray-400 sm:text-sm">Bakım ihtiyacı olan işletmeler</p>
              </div>
            </div>

            <ul className="relative mt-5 space-y-2.5 sm:mt-7 sm:space-y-3.5">
              {forFactories.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-xs font-medium text-gray-600 sm:gap-3 sm:text-sm">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500 sm:h-4 sm:w-4" />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              to="/customer/register"
              className="group/link relative mt-6 inline-flex items-center gap-2 text-xs font-black text-red-500 transition-all duration-300 hover:gap-3 hover:text-red-600 sm:mt-8 sm:text-sm"
            >
              İşletme Olarak Katılın
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5 sm:h-4 sm:w-4" />
            </Link>
          </div>

          {/* ---- Service Card ---- */}
          <div
            data-reveal
            data-reveal-delay="1"
            className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-500 hover:border-teal-200 hover:shadow-lg sm:rounded-2xl sm:p-6 md:p-8"
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-teal-50 blur-3xl transition-all duration-700 group-hover:bg-teal-100/80 group-hover:scale-125 sm:h-44 sm:w-44" />

            <div className="relative flex items-center gap-3 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white shadow-lg shadow-teal-500/15 sm:h-14 sm:w-14 sm:rounded-2xl">
                <Wrench className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black text-gray-900 sm:text-xl">Servis Ekipleri</h3>
                <p className="text-xs font-medium text-gray-400 sm:text-sm">Uzman bakım ve onarım firmaları</p>
              </div>
            </div>

            <ul className="relative mt-5 space-y-2.5 sm:mt-7 sm:space-y-3.5">
              {forServices.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-xs font-medium text-gray-600 sm:gap-3 sm:text-sm">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500 sm:h-4 sm:w-4" />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              to="/service/register"
              className="group/link relative mt-6 inline-flex items-center gap-2 text-xs font-black text-teal-500 transition-all duration-300 hover:gap-3 hover:text-teal-600 sm:mt-8 sm:text-sm"
            >
              Servis Olarak Katılın
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5 sm:h-4 sm:w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================
   CTA Section
   ============================================ */

function CTASection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-500 to-red-600" />
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.18) 1px, transparent 0)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 sm:py-20 md:py-28 lg:px-8">
        <p data-reveal className="text-[10px] font-black uppercase tracking-[0.25em] text-red-100/50 sm:text-xs sm:tracking-[0.3em]">
          Bakım ekosistemi büyüyor
        </p>
        <h2
          data-reveal
          data-reveal-delay="1"
          className="mt-4 text-balance text-2xl font-black text-white sm:mt-5 sm:text-3xl md:text-4xl lg:text-5xl"
        >
          Doğru zamanda, doğru ekiple buluşun.
        </h2>
        <p
          data-reveal
          data-reveal-delay="2"
          className="mx-auto mt-4 max-w-xl text-sm font-medium leading-6 text-red-100/70 sm:mt-5 sm:text-base sm:leading-7"
        >
          Yeni firmalar, tesisler ve servis ekipleri Maintly ağına katılıyor.
          Siz de yerinizi alın.
        </p>
        <div
          data-reveal
          data-reveal-delay="3"
          className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4"
        >
          <Link
            to="/customer/register"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-xs font-black text-red-600 shadow-xl shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl sm:w-auto sm:gap-2.5 sm:px-7 sm:py-4 sm:text-sm"
          >
            İşletme Olarak Katılın
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 sm:h-4 sm:w-4" />
          </Link>
          <Link
            to="/service/register"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-white/30 px-5 py-3.5 text-xs font-black text-white transition-all duration-300 hover:border-white hover:bg-white/10 sm:w-auto sm:gap-2.5 sm:px-7 sm:py-4 sm:text-sm"
          >
            Servis Olarak Katılın
            <Wrench className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ============================================
   Footer
   ============================================ */

function FooterSection() {
  return (
    <footer className="border-t border-gray-200 bg-slate-50 px-4 py-10 sm:px-6 sm:py-14 md:py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-4 lg:gap-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3">
              <img src={logoImg} alt="Maintly Logo" className="h-9 w-auto object-contain sm:h-10" />
              <span className="text-base font-black text-gray-900 sm:text-lg">Maintly</span>
            </Link>
            <p className="mt-4 max-w-xs text-xs leading-5 text-gray-400 sm:mt-5 sm:text-sm sm:leading-6">
              Endüstriyel bakımın güvenilir ağı. Fabrikalar ve servis ekipleri
              için tasarlanmış, modern bakım yönetimi platformu.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 sm:text-xs">Ürün</h4>
            <ul className="mt-3 space-y-2 sm:mt-5 sm:space-y-3">
              {footerLinks.product.map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="text-xs font-medium text-gray-500 transition-colors hover:text-gray-900 sm:text-sm">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 sm:text-xs">Şirket</h4>
            <ul className="mt-3 space-y-2 sm:mt-5 sm:space-y-3">
              {footerLinks.company.map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="text-xs font-medium text-gray-500 transition-colors hover:text-gray-900 sm:text-sm">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 sm:text-xs">Yasal</h4>
            <ul className="mt-3 space-y-2 sm:mt-5 sm:space-y-3">
              {footerLinks.legal.map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="text-xs font-medium text-gray-500 transition-colors hover:text-gray-900 sm:text-sm">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-6 sm:mt-14 sm:flex-row sm:gap-5 sm:pt-8">
          <p className="text-[10px] font-medium text-gray-400 sm:text-xs">
            © {new Date().getFullYear()} Maintly. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-4 text-[10px] font-medium text-gray-400 sm:gap-6 sm:text-xs">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> İstanbul, Türkiye
            </span>
            <span className="inline-flex items-center gap-1">
              <Timer className="h-3 w-3" /> 7/24 Sistem
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ============================================
   Sub-components
   ============================================ */

function AnimatedStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-l border-gray-200 pl-2.5 sm:pl-4 md:pl-5">
      <p className="text-2xl font-black leading-none text-gray-900 sm:text-3xl md:text-4xl lg:text-5xl">{value}</p>
      <p className="mt-1.5 text-[8px] font-bold uppercase leading-3 tracking-[0.14em] text-gray-400 sm:mt-2.5 sm:text-[10px] sm:leading-4 sm:tracking-[0.16em] md:text-xs">{label}</p>
    </div>
  );
}

function MobileProviderStrip({
  providers,
  total,
  isLoading,
}: {
  providers: LandingProvider[];
  total: number;
  isLoading: boolean;
}) {
  if (!isLoading && providers.length === 0) return null;
  const visibleProviders: Array<LandingProvider | null> = isLoading
    ? [null, null, null]
    : providers.slice(0, 3);

  return (
    <div className="mt-6 lg:hidden">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Bugünün servis vitrini</p>
        {total > 0 && <span className="text-[10px] font-bold text-red-600">Ağda {total.toLocaleString('tr-TR')} servis</span>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {visibleProviders.map((provider, index) =>
          provider === null ? (
            <div key={`mobile-skeleton-${index}`} className="h-20 animate-pulse rounded-xl border border-slate-200 bg-white/70" />
          ) : (
            <MobileProviderCard key={`${provider.name}-${index}`} provider={provider} />
          )
        )}
      </div>
    </div>
  );
}

function MobileProviderCard({ provider }: { provider: LandingProvider }) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = provider.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('tr-TR'))
    .join('');

  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white/90 p-2 shadow-sm backdrop-blur">
      <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-white text-[10px] font-black text-red-600">
        {!imageFailed && provider.logoUrl ? (
          <img
            src={resolvePublicFileUrl(provider.logoUrl)}
            alt=""
            className="h-full w-full object-contain p-0.5"
            onError={() => setImageFailed(true)}
          />
        ) : initials}
      </div>
      <p className="mt-2 truncate text-[10px] font-black text-slate-900">{provider.name}</p>
      <p className="mt-0.5 truncate text-[8px] font-bold text-slate-400">{provider.city}</p>
    </div>
  );
}

function formatStat(value: number) {
  return Number.isFinite(value) ? value.toLocaleString('tr-TR') : '—';
}

function SignalPill({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="inline-flex min-h-9 w-auto min-w-0 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-[10px] font-bold text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:min-h-10 sm:w-full sm:gap-2 sm:rounded-xl sm:px-3 sm:text-xs">
      <Icon className="h-3.5 w-3.5 shrink-0 text-red-500 sm:h-4 sm:w-4" />
      <span className="whitespace-nowrap sm:truncate">{label}</span>
    </div>
  );
}

function MobileMenu() {
  return (
    <div className="flex items-center gap-1 md:hidden">
      <Link
        to="/customer/login"
        className="rounded-lg px-2.5 py-2 text-[11px] font-bold text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-900 sm:text-xs"
      >
        Fabrika/İşletme
      </Link>
      <Link
        to="/service/login"
        className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-[11px] font-bold text-red-600 transition-all hover:bg-red-100 sm:text-xs"
      >
        Servis
      </Link>
    </div>
  );
}
