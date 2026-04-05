import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t border-info/10 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-8 px-6 py-10 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="max-w-xl">
          <div className="flex items-center gap-3">
            <img
              src="/easyalerts_logo_clean.png"
              alt="EasyAlerts logo"
              className="h-12 w-12 rounded-2xl object-contain shadow-[0_10px_30px_rgba(37,99,235,0.16)]"
            />
            <div>
              <p className="font-alert text-2xl uppercase tracking-[0.12em] leading-none text-slate-900">EasyAlerts</p>
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
          <Link to="/register" className="transition-colors hover:text-slate-900">
            Register
          </Link>
        </div>
      </div>

      <div className="border-t border-info/10 px-6 py-4 text-center text-xs uppercase tracking-[0.24em] text-slate-400">
        EasyAlerts 2026
      </div>
    </footer>
  );
};

export default Footer;
