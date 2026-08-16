import { Home, Shield, Tv2, UserRoundCog } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/cn';
import { BallIcon } from './icons/SoccerIcons';

const tabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/play', label: 'Play', icon: BallIcon, end: false },
  { to: '/watch', label: 'Watch', icon: Tv2, end: false },
  { to: '/community', label: 'HOOMA', icon: Shield, end: false },
  { to: '/more', label: 'More', icon: UserRoundCog, end: false },
];

export function BottomNav() {
  return <nav className="fixed inset-x-0 bottom-0 layer-chrome mx-auto flex max-w-[760px] items-center justify-around border-t px-2 pt-2 backdrop-blur-xl" style={{background:'color-mix(in srgb, #070806 94%, transparent)',borderColor:'rgba(210,166,45,.28)',paddingBottom:'calc(var(--safe-bottom) + 8px)'}}>
    {tabs.map(({to,label,icon:Icon,end})=><NavLink key={to} to={to} end={end} className={({isActive})=>cn('relative flex min-w-14 flex-col items-center gap-1 px-3 py-2 text-[10px] font-extrabold transition',isActive&&'after:absolute after:bottom-0 after:h-[2px] after:w-8 after:bg-[#b9ef00]')}>
      {({isActive})=><><Icon className="h-[21px] w-[21px]" style={{color:isActive?'#b9ef00':'#a8a194'}}/><span style={{color:isActive?'#e7d8b5':'#a8a194'}}>{label}</span></>}
    </NavLink>)}
  </nav>;
}
