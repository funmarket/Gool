import { SearchIcon } from '../../icons/SearchIcon';
import { FilterIcon } from '../../icons/FilterIcon';
import { PinIcon } from '../../icons/PinIcon';
import { ChevronDownIcon } from '../../icons/ChevronDownIcon';
import './WatchSearchControls.css';
export type WatchClubOption={id:string;name:string};
export type WatchSearchControlsProps={search:string;onSearchChange:(value:string)=>void;clubId:string;clubs:WatchClubOption[];onClubChange:(value:string)=>void;onFilterClick?:()=>void};
export function WatchSearchControls(props:WatchSearchControlsProps){return <section className="watch-controls-pro" aria-label="Watch filters"><div className="watch-controls-search-row"><label className="watch-controls-search"><SearchIcon size={25}/><input value={props.search} onChange={e=>props.onSearchChange(e.target.value)} placeholder="Search events, teams or venues"/></label><button type="button" className="watch-controls-filter" onClick={props.onFilterClick} aria-label="Open watch filters"><FilterIcon size={23}/></button></div><div className="watch-controls-chips"><button type="button" className="watch-controls-city"><PinIcon size={20}/>City<ChevronDownIcon size={18}/></button><label className="watch-controls-club"><span>Club</span><select value={props.clubId} onChange={e=>props.onClubChange(e.target.value)}><option value="">All clubs</option>{props.clubs.map(club=><option key={club.id} value={club.id}>{club.name}</option>)}</select><ChevronDownIcon size={18}/></label></div></section>}
