import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardList,
  Factory,
  FileText,
  Link2,
  MapPin,
  RadioTower,
  ShieldCheck,
  Sparkles,
  Timer,
  UsersRound,
  Wrench,
  Zap,
} from 'lucide-react';
import NetworkScene from './NetworkScene';
import {
  stats,
  proofPoints,
  howItWorks,
  forFactories,
  forServices,
  footerLinks,
} from './data';

/* ============================================
   MaintlyLandingPage — Engineering-grade landing
   ============================================ */

export default function MaintlyLandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-zinc-950 text-white">
      <HeroSection />
      <HowItWorksSection />
      <ForWhomSection />
      <EcosystemBar />
      <FooterSection />
    </main>
  );
}

/* ---------- Hero ---------- */
function HeroSection() {
  return (
    <section className="maintly-hero-scene relative min-h-[92svh] overflow-hidden">
      {/* Layered background photo */}
      <div className="maintly-hero-photo" aria-hidden="true" />
      <div className="maintly-hero-noise" aria-hidden="true" />

      {/* 3D Network Graph */}
      <NetworkScene />

      {/* Content */}
      <div className="relative z-10 flex min-h-[92svh] flex-col">
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link to="/" className="group flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-500 text-base font-black text-white shadow-[0_18px_44px_rgba(239,68,68,0.36)] transition group-hover:bg-red-400">
              M
            </span>
            <span>
              <span className="block text-xl font-black leading-none tracking-normal">Maintly</span>
              <span className="mt-1 block text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                Endüstriyel bakım ağı
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              to="/customer/login"
              className="hidden rounded-lg px-3 py-2 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              Müşteri Girişi
            </Link>
            <Link
              to="/service/login"
              className="hidden rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white shadow-2xl shadow-black/30 backdrop-blur transition hover:border-red-300/50 hover:bg-white/15 sm:inline-flex"
            >
              Servis Girişi
            </Link>
            <MobileMenu />
          </nav>
        </header>

        <div className="mx-auto flex w-full max-w-7xl flex-1 items-center px-4 pb-10 pt-8 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-red-100 shadow-[0_0_60px_rgba(239,68,68,0.22)] backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-red-300" />
              Türkiye'nin bakım ağı
            </div>

            <h1 className="text-balance text-5xl font-black leading-[0.9] tracking-normal text-white sm:text-6xl lg:text-7xl xl:text-8xl">
              Maintly
            </h1>
            <p className="mt-5 max-w-2xl text-2xl font-black leading-tight text-white sm:text-3xl lg:text-4xl">
              Endüstriyel bakımın güvenilir ağı.
            </p>
            <p className="mt-5 max-w-xl text-base font-medium leading-7 text-zinc-300 sm:text-lg">
              Fabrikalar, tesisler ve uzman servis ekipleri Maintly'de buluşur. Bakım ihtiyaçlarınız
              için doğru ekipleri keşfedin, servis süreçlerinizi daha görünür ve hızlı yönetin.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/customer/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-red-500 px-5 py-3 text-sm font-black text-white shadow-[0_18px_42px_rgba(239,68,68,0.32)] transition hover:bg-red-400"
              >
                Fabrikanızı Ekleyin
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/service/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:border-teal-300/50 hover:bg-white/15"
              >
                Servis Olarak Katılın
                <Wrench className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-2 sm:gap-3">
              {stats.map((item) => (
                <div key={item.label} className="border-l border-white/15 pl-3 sm:pl-4">
                  <p className="text-3xl font-black leading-none text-white sm:text-4xl">{item.value}</p>
                  <p className="mt-2 text-[10px] font-black uppercase leading-4 tracking-[0.16em] text-white/50 sm:text-xs">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom proof bar */}
        <div className="border-y border-white/10 bg-zinc-950/55 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-950">
                <UsersRound className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-200">Maintly Kullanıcıları</p>
                <p className="mt-1 truncate text-sm font-bold text-white/80">
                  Bakım ihtiyacı olan işletmeler ile uzman servis ekipleri aynı ağda buluşuyor.
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {proofPoints.map((point) => {
                const Icon =
                  point.key === 'network'
                    ? RadioTower
                    : point.key === 'verified'
                      ? BadgeCheck
                      : Zap;
                return (
                  <SignalPill key={point.label} icon={Icon} label={point.label} />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- How It Works ---------- */
function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative bg-zinc-950 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-500">Süreç</p>
          <h2 className="mt-3 text-balance text-3xl font-black tracking-normal text-white sm:text-4xl">
            Nasıl Çalışır?
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-zinc-400">
            Bakım talebinden iş emrinin kapanışına kadar tüm süreç tek platformda. Karmaşık
            koordinasyonlar yerine odaklanmış, hızlı ve şeffaf bir iş akışı.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {howItWorks.map((step) => {
            const Icon =
              step.step === '01'
                ? ClipboardList
                : step.step === '02'
                  ? Link2
                  : FileText;
            return (
              <div
                key={step.step}
                className="group relative rounded-xl border border-white/8 bg-white/[0.03] p-6 transition hover:border-white/15 hover:bg-white/[0.05]"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10 text-red-400 transition group-hover:bg-red-500/20">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="absolute right-5 top-5 text-5xl font-black leading-none text-white/[0.04]">
                  {step.step}
                </span>
                <h3 className="text-lg font-black text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- For Whom ---------- */
function ForWhomSection() {
  return (
    <section id="for-whom" className="relative bg-zinc-900 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-500">Platform</p>
          <h2 className="mt-3 text-balance text-3xl font-black tracking-normal text-white sm:text-4xl">
            Kimler İçin?
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-xl border border-white/8 bg-zinc-950 p-7">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 translate-y-[-30%] rounded-full bg-red-500/10 blur-3xl" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500 text-white">
                <Factory className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Fabrikalar ve Tesisler</h3>
                <p className="text-sm font-medium text-zinc-400">Bakım ihtiyacı olan işletmeler</p>
              </div>
            </div>

            <ul className="relative mt-6 space-y-3">
              {forFactories.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm font-medium text-zinc-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              to="/customer/register"
              className="relative mt-7 inline-flex items-center gap-2 text-sm font-black text-red-400 transition hover:text-red-300"
            >
              Fabrikanızı Ekleyin
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-white/8 bg-zinc-950 p-7">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 translate-y-[-30%] rounded-full bg-teal-500/10 blur-3xl" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-500 text-zinc-950">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Servis Ekipleri</h3>
                <p className="text-sm font-medium text-zinc-400">Uzman bakım ve onarım firmaları</p>
              </div>
            </div>

            <ul className="relative mt-6 space-y-3">
              {forServices.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm font-medium text-zinc-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              to="/service/register"
              className="relative mt-7 inline-flex items-center gap-2 text-sm font-black text-teal-400 transition hover:text-teal-300"
            >
              Servis Olarak Katılın
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Ecosystem Bar ---------- */
function EcosystemBar() {
  return (
    <section className="bg-zinc-100 px-4 py-4 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-600">Bakım ekosistemi büyüyor</p>
          <p className="mt-1 text-sm font-bold text-zinc-600">
            Yeni firmalar, tesisler ve servis ekipleri Maintly ağında daha görünür hale geliyor.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/customer/login"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-zinc-800"
          >
            Portala Giriş
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */
function FooterSection() {
  return (
    <footer className="border-t border-white/8 bg-zinc-950 px-4 py-14 text-white/70 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500 text-sm font-black text-white">M</span>
              <span className="text-lg font-black text-white">Maintly</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-zinc-400">
              Endüstriyel bakımın güvenilir ağı. Fabrikalar ve servis ekipleri için tasarlanmış,
              modern bakım yönetimi platformu.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.18em] text-white/40">Ürün</h4>
            <ul className="mt-4 space-y-2">
              {footerLinks.product.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.href}
                    className="text-sm font-medium text-zinc-400 transition hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.18em] text-white/40">Şirket</h4>
            <ul className="mt-4 space-y-2">
              {footerLinks.company.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.href}
                    className="text-sm font-medium text-zinc-400 transition hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.18em] text-white/40">Yasal</h4>
            <ul className="mt-4 space-y-2">
              {footerLinks.legal.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.href}
                    className="text-sm font-medium text-zinc-400 transition hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/8 pt-8 sm:flex-row">
          <p className="text-xs font-medium text-zinc-500">
            © {new Date().getFullYear()} Maintly. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-5 text-xs font-medium text-zinc-500">
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

/* ---------- Mobile Menu ---------- */
function MobileMenu() {
  return (
    <div className="flex items-center gap-2 sm:hidden">
      <Link
        to="/customer/login"
        className="rounded-lg px-2 py-2 text-xs font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        Müşteri
      </Link>
      <Link
        to="/service/login"
        className="rounded-lg border border-white/15 bg-white/10 px-2 py-2 text-xs font-bold text-white backdrop-blur transition hover:border-red-300/50 hover:bg-white/15"
      >
        Servis
      </Link>
    </div>
  );
}

/* ---------- SignalPill ---------- */
function SignalPill({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/[0.08] px-3 text-xs font-black text-white/80 backdrop-blur">
      <Icon className="h-4 w-4 text-red-300" />
      <span className="truncate">{label}</span>
    </div>
  );
}
