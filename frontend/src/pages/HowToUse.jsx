import { Link } from 'react-router-dom';

const steps = [
  {
    id: 1,
    title: 'Create Account',
    desc: 'Register with phone number. Verify via Telegram OTP for secure access to your dashboard.',
    icon: (
      <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    accent: 'violet',
    showDetectBtn: true,
  },
  {
    id: 2,
    title: 'Enter Sensor Data',
    desc: 'Provide gas level, temperature, pressure, and smoke values to evaluate the current environment.',
    icon: (
      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    accent: 'blue',
    showDetectBtn: false,
  },
  {
    id: 3,
    title: 'Detect & Alert',
    desc: 'AI scans patterns using FinBERT + ML models. Get instant alerts when hazards are found.',
    icon: (
      <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    accent: 'emerald',
    showDetectBtn: false,
  },
];

const accentMap = {
  violet: {
    bg: 'bg-violet-600/10',
    border: 'border-violet-600/20',
    badge: 'bg-violet-400/10 text-violet-400 border-violet-400/20',
    hover: 'hover:border-violet-700',
  },
  blue: {
    bg: 'bg-blue-600/10',
    border: 'border-blue-600/20',
    badge: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
    hover: 'hover:border-blue-700',
  },
  emerald: {
    bg: 'bg-emerald-600/10',
    border: 'border-emerald-600/20',
    badge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
    hover: 'hover:border-emerald-700',
  },
};

const HowToUse = () => {
  return (
    <div className="min-h-screen bg-gray-950 pt-20">
      <div className="max-w-5xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">How to Use EasyAlerts</h1>
          <p className="text-gray-400 text-base max-w-xl mx-auto leading-relaxed">
            Three simple steps to submit sensor readings and check for hazards with AI-powered detection.
          </p>
        </div>

        {/* Cards + Arrows Row */}
        <div className="flex flex-col lg:flex-row items-stretch gap-0">
          {steps.map((step, index) => {
            const colors = accentMap[step.accent];
            return (
              <div key={step.id} className="flex lg:flex-row flex-col items-center flex-1">

                {/* Card */}
                <div className={`bg-gray-900 border border-gray-800 ${colors.hover} rounded-2xl p-8 w-full transition-all duration-300 group flex flex-col`}>
                  <div className={`w-14 h-14 ${colors.bg} border ${colors.border} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    {step.icon}
                  </div>
                  <span className={`inline-flex text-xs font-semibold border px-3 py-1 rounded-full mb-4 w-fit ${colors.badge}`}>
                    Step {step.id}
                  </span>
                  <h3 className="text-white font-semibold text-lg mb-3">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed flex-1">{step.desc}</p>
                  {step.showDetectBtn && (
                    <Link
                      to="/detect"
                      className="inline-block mt-6 bg-violet-600 hover:bg-violet-500 text-white text-sm px-5 py-2.5 rounded-lg transition-colors w-fit font-medium"
                    >
                      DETECT
                    </Link>
                  )}
                </div>

                {/* Arrow between cards */}
                {index < steps.length - 1 && (
                  <div className="mx-3 text-gray-700 hidden lg:flex items-center">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default HowToUse;
