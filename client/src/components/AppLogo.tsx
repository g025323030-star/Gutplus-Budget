import logo from '../asset/logo.png';
interface AppLogoProps {
  size?: 'sm' | 'md';
}

export default function AppLogo({ size = 'md' }: AppLogoProps) {
  const classes =
    size === 'sm'
      ? 'w-8 h-8 rounded-lg text-sm'
      : 'w-10 h-10 rounded-xl text-lg';

  return (
    <div className={`${classes} flex items-center justify-center shrink-0`}>
      <span className="text-white font-bold">
        
        <img src={logo} alt="Logo" />
      </span>
    </div>
  );
}
