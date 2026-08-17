import './TrendingCard.css';
export type TrendingCardProps={label:string;title:string;subtitle?:string;imageUrl?:string|null;onClick?:()=>void};
export function TrendingCard({label,title,subtitle,imageUrl,onClick}:TrendingCardProps){return <button type="button" className="trending-card-pro" onClick={onClick} disabled={!onClick}>{imageUrl?<img src={imageUrl} alt=""/>:<div className="trending-card-art" aria-hidden/>}<div className="trending-card-body"><span>{label}</span><strong>{title}</strong>{subtitle&&<small>{subtitle}</small>}</div></button>}
