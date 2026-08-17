import { PlusIcon } from '../../icons/PlusIcon';
import './PlayHero.css';
export type PlayHeroProps={onCreateMatch:()=>void};
export function PlayHero({onCreateMatch}:PlayHeroProps){return <section className="play-hero-pro"><div><span>Pickup football</span><h1>PLAY</h1><p>Find a game. Find players. Get on the pitch.</p></div><button type="button" onClick={onCreateMatch}><PlusIcon size={22}/>Create match</button></section>}
