import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t border-amber-100/80 bg-white/75 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 shadow-[0_10px_30px_rgba(251,146,60,0.22)]">
              <span className="text-xs font-bold text-white">EA</span>
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900">EasyAlerts</p>
              <p className="text-xs uppercase tracking-[0.26em] text-slate-400">Hazard detection platform</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            A clearer way to submit sensor readings, review hazard predictions, and act on risky conditions.
          </p>
        </div>

        <div className="flex flex-col gap-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:gap-8">
          <Link to="/" className="transition-colors hover:text-slate-900">
            Home
          </Link>
          <Link to="/#how-it-works" className="transition-colors hover:text-slate-900">
            How to Use
          </Link>
          <Link to="/detect" className="transition-colors hover:text-slate-900">
            Detect Hazard
          </Link>
          <Link to="/history" className="transition-colors hover:text-slate-900">
            History
          </Link>
        </div>
      </div>

      <div className="border-t border-amber-100/80 px-6 py-4 text-center text-xs uppercase tracking-[0.24em] text-slate-400">
        EasyAlerts 2026
      </div>
    </footer>
  );
};

export default Footer;
