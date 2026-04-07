import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const featureCards = [
  {
    title: 'Sensor Monitoring',
    caption: 'Track gas, smoke, pressure, and heat readings',
    image: '/images/sensor_monitoring.png',
    imageAlt: 'Industrial sensor monitoring system with live gas and airflow readings',
    eyebrow: 'Signal watch',
    metric: '4 live inputs',
    accent: 'text-info',
    badgeClass: 'border-info/20 bg-info/10 text-info',
    cardClass: '',
    glowClass: 'from-info/20 via-info/5 to-transparent',
  },
  {
    title: 'Live Alerts',
    caption: 'Fast response when risk shifts',
    image: '/images/live_alerts.png',
    imageAlt: 'Live alert warning graphic with a bright lightning icon',
    eyebrow: 'Fast response',
    metric: 'Instant trigger',
    accent: 'text-warning',
    badgeClass: 'border-warning/20 bg-warning/10 text-warning',
    cardClass: '',
    glowClass: 'from-warning/25 via-warning/5 to-transparent',
  },
];

const stats = [
  { label: 'Sensor checks', value: '4' },
  { label: 'Average confidence', value: '95%' },
  { label: 'Trained data', value: '4000' },
];

const steps = [
  {
    id: '01',
    title: 'Create Your Account',
    description:
      'Create an account or log in to access detection tools, save readings, and manage your alert history.',
    accent: 'border-info/20 bg-info/10 text-info',
  },
  {
    id: '02',
    title: 'Enter Sensor Readings',
    description:
      'Enter gas, smoke, temperature, and pressure values so the model can analyze the current environment in real time.',
    accent: 'border-warning/20 bg-warning/10 text-warning',
  },
  {
    id: '03',
    title: 'Scroll Results and Act',
    description:
      'Review the hazard result, confidence score, and next action, then save the outcome to your history.',
    accent: 'border-safe/20 bg-safe/10 text-safe',
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
      <div className="absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(circle_at_18%_22%,rgba(245,158,11,0.24),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(37,99,235,0.16),transparent_20%),radial-gradient(circle_at_72%_72%,rgba(5,150,105,0.12),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.88))]" />

      <section className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-[92rem] items-center gap-8 px-6 py-8 sm:py-10 lg:grid-cols-[0.96fr_1.04fr] lg:gap-10 lg:px-8 lg:py-8 xl:gap-14">
        <div className="order-2 lg:order-1">
          <div className="relative mx-auto max-w-[34rem] lg:max-w-[31rem] xl:max-w-[34rem]">
            <div className="absolute -left-8 top-12 h-28 w-28 rounded-full bg-warning/15 blur-3xl" />
            <div className="absolute -right-8 bottom-10 h-32 w-32 rounded-full bg-info/15 blur-3xl" />

            <div className="relative mb-3 flex items-center justify-between rounded-full border border-white/70 bg-white/70 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400 shadow-[0_12px_30px_rgba(148,163,184,0.12)] backdrop-blur-sm sm:text-[11px]">
              <span>Field visibility</span>
              <span>Real-time response</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:gap-4">
              {featureCards.map((card) => (
                <article
                  key={card.title}
                  className={`group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 p-4 shadow-[0_22px_64px_rgba(148,163,184,0.16)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_72px_rgba(148,163,184,0.22)] ${card.cardClass}`}
                >
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.glowClass} opacity-70`} />
                  <div className="relative mb-3 grid min-h-[2.75rem] grid-cols-[auto_1fr] items-start gap-3">
                    <span className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${card.badgeClass}`}>
                      {card.eyebrow}
                    </span>
                    <span className={`min-w-0 self-center text-right text-[10px] font-semibold uppercase tracking-[0.16em] leading-4 ${card.accent}`}>
                      {card.metric}
                    </span>
                  </div>

                  <div className="relative mb-4 overflow-hidden rounded-[1.6rem] border border-white/70 bg-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                    <img
                      src={card.image}
                      alt={card.imageAlt}
                      className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] sm:h-44 lg:h-40 xl:h-44"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/28 via-transparent to-white/10" />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/25 to-transparent" />
                  </div>

                  <div className="relative mt-auto">
                    <p className="text-xl font-semibold text-slate-900 lg:text-[1.65rem]">{card.title}</p>
                    <p className="mt-2 max-w-[16rem] text-sm leading-6 text-slate-500">{card.caption}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="relative mt-3 rounded-[1.6rem] border border-white/75 bg-white/60 px-4 py-3 shadow-[0_14px_36px_rgba(148,163,184,0.1)] backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400 sm:text-[11px]">
                From ambient sensing to active warning
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The left panel now mirrors the story on the right: first capture the environment, then raise alerts the moment conditions turn risky.
              </p>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-warning/20 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-warning shadow-sm sm:mb-5 sm:text-xs">
            <span className="h-2 w-2 rounded-full bg-warning" />
            AI powered hazard detection
          </div>

          <h1 className="max-w-3xl font-alert text-[clamp(2.65rem,5.6vw,5.5rem)] uppercase tracking-[0.028em] leading-[0.92] text-slate-900">
            Detect hazards early
            <span className="block text-danger">before they turn dangerous.</span>
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:mt-5 sm:text-lg sm:leading-8">
            EasyAlerts analyzes live sensor input and helps identify risky conditions from gas, smoke,
            temperature, and pressure readings. The how-to-use guide now continues below the fold, so the
            page clearly tells people to keep scrolling.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[1.5rem] border border-info/10 bg-white/80 px-5 py-4 shadow-[0_12px_32px_rgba(148,163,184,0.12)]"
              >
                <p className="font-alert text-3xl uppercase tracking-[0.06em] text-slate-900 sm:text-4xl">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 sm:mt-7">
            <Link
              to="/detect"
              className="rounded-full bg-info px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Detect hazard
            </Link>
            <Link
              to="/#how-it-works"
              className="rounded-full border border-info/20 bg-white/80 px-7 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:border-warning/40 hover:text-slate-900"
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto w-full max-w-[92rem] scroll-mt-24 px-6 pb-24 pt-10 lg:px-8">
        <div className="mb-14 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-info">How to use</p>
            <h2 className="mt-3 font-alert text-4xl uppercase tracking-[0.04em] text-slate-900 md:text-5xl">
              Everything stays on one flowing page.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            Follow a simple three-step flow: create your account, enter the four sensor readings, and review the prediction instantly on the same page.
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

        <div className="mt-10 rounded-[2rem] border border-info/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(239,246,255,0.92),rgba(236,253,245,0.75))] p-8 shadow-[0_18px_54px_rgba(37,99,235,0.1)] lg:flex lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-warning">Ready when you are</p>
            <h3 className="mt-3 font-alert text-4xl uppercase tracking-[0.04em] text-slate-900">
              Start detection without leaving the story of the page.
            </h3>
          </div>
          <Link
            to="/detect"
            className="mt-6 inline-flex rounded-full bg-warning px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600 lg:mt-0"
          >
            Open detection
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
