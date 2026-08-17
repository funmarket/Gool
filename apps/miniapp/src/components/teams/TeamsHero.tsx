import { ShieldIcon } from '../../icons/ShieldIcon';
import { BallIcon } from '../../icons/BallIcon';
import './TeamsHero.css';
export function TeamsHero(){return <section className="teams-hero-pro"><div><h1>Teams</h1><p>Discover teams. Find opponents.<br/>Challenge or accept a match.</p></div><div className="teams-hero-pro-art" aria-hidden><span><ShieldIcon size={54}/></span><i><BallIcon size={38}/></i></div></section>}
