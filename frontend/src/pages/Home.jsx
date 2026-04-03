import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const featureCards = [
  {
    title: 'Sensor Monitoring',
    caption: 'Track gas, smoke, pressure, and heat readings',
    accent: 'from-amber-300 via-orange-300 to-rose-300',
    className: 'row-span-2 min-h-[22rem]',
    icon: (
      <svg className="h-8 w-8 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: 'Live Alerts',
    caption: 'Fast response when risk shifts',
    accent: 'from-emerald-200 via-lime-100 to-white',
    className: 'min-h-[10.25rem]',
    icon: (
      <svg className="h-6 w-6 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: 'Smart Notifications',
    caption: 'Clarity instead of noisy dashboards',
    accent: 'from-sky-200 via-cyan-100 to-white',
    className: 'min-h-[10.25rem]',
    icon: (
      <svg className="h-6 w-6 text-sky-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
];

const stats = [
  { label: 'Sensor checks', value: '500+' },
  { label: 'Average confidence', value: '87%' },
  { label: 'Alerts delivered', value: '12K+' },
];

const steps = [
  {
    id: '01',
    title: 'Create Your Account',
    description:
      'Sign in once, connect your monitoring flow, and keep your alert workspace ready for daily use.',
    accent: 'border-amber-200 bg-amber-100 text-amber-700',
  },
  {
    id: '02',
    title: 'Enter Sensor Readings',
    description:
      'Provide gas level, temperature, pressure, and smoke values so the model can evaluate the current risk.',
    accent: 'border-sky-200 bg-sky-100 text-sky-700',
  },
  {
    id: '03',
    title: 'Scroll Results and Act',
    description:
      'Review the model summary, confidence, and follow-up alerts without leaving the same experience.',
    accent: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  },
];

const Home = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#how-it-works') {
      const section = document.getElementById('how-it-works');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.hash]);

  return (
    <div className="relative overflow-hidden pt-20 text-slate-900">
      <div className="absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(circle_at_18%_22%,rgba(251,191,36,0.24),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(59,130,246,0.16),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,250,240,0.85))]" />

      <section className="mx-auto grid min-h-screen max-w-7xl items-center gap-16 px-6 py-16 lg:grid-cols-[1.05fr_1fr]">
        <div className="order-2 grid h-[28rem] grid-cols-2 gap-5 lg:order-1">
          {featureCards.map((card) => (
            <div
              key={card.title}
              className={`group rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(148,163,184,0.16)] backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1 ${card.className}`}
            >
              <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/70 bg-gradient-to-br ${card.accent} shadow-inner`}>
                {card.icon}
              </div>
              <div className="mt-auto">
                <p className="text-xl font-semibold text-slate-900">{card.title}</p>
                <p className="mt-2 max-w-[16rem] text-sm leading-6 text-slate-500">{card.caption}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="order-1 lg:order-2">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-amber-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            AI powered hazard detection
          </div>

          <h1 className="max-w-3xl font-serif text-5xl font-semibold leading-[0.95] text-slate-900 md:text-6xl lg:text-7xl">
            Detect hazards early
            <span className="block text-amber-600">before they turn dangerous.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
            EasyAlerts analyzes live sensor input and helps identify risky conditions from gas, smoke,
            temperature, and pressure readings. The how-to-use guide now continues below the fold, so the
            page clearly tells people to keep scrolling.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[1.5rem] border border-amber-100 bg-white/80 px-5 py-5 shadow-[0_12px_32px_rgba(148,163,184,0.12)]"
              >
                <p className="text-3xl font-semibold text-slate-900">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/detect"
              className="rounded-full bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
            >
              Detect hazard
            </Link>
            <Link
              to="/#how-it-works"
              className="rounded-full border border-slate-300 bg-white/80 px-7 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:border-amber-300 hover:text-slate-900"
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>

      <div className="pb-10">
        <a
          href="#how-it-works"
          className="mx-auto flex w-fit flex-col items-center gap-2 rounded-full px-6 py-4 text-center transition-transform duration-300 hover:-translate-y-1"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.38em] text-slate-400">
            Scroll for how to use
          </span>
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white/80 text-amber-600 shadow-sm">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </a>
      </div>

      <section id="how-it-works" className="mx-auto max-w-7xl px-6 pb-24 pt-10">
        <div className="mb-14 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">How to use</p>
            <h2 className="mt-3 font-serif text-4xl font-semibold text-slate-900 md:text-5xl">
              Everything stays on one flowing page.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            Instead of sending people to a separate screen, the landing page now hints that the guidance
            continues below and then reveals it in-place.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.id}
              className="rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_18px_54px_rgba(148,163,184,0.14)] backdrop-blur-sm"
            >
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${step.accent}`}>
                Step {step.id}
              </span>
              <h3 className="mt-6 text-2xl font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">{step.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-[2rem] border border-amber-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.85),rgba(255,247,237,0.92))] p-8 shadow-[0_18px_54px_rgba(245,158,11,0.12)] lg:flex lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-amber-700">Ready when you are</p>
            <h3 className="mt-3 text-3xl font-semibold text-slate-900">
              Start detection without leaving the story of the page.
            </h3>
          </div>
          <Link
            to="/detect"
            className="mt-6 inline-flex rounded-full bg-amber-500 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600 lg:mt-0"
          >
            Open detection
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
