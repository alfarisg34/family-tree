export function MemberAvatar({ name, src, className = '' }: { name: string; src?: string; className?: string }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
  return <span className={`member-avatar ${className}`} role="img" aria-label={name}>
    <span aria-hidden="true">{initials || '?'}</span>
    {src && <img key={src} src={src} alt="" loading="lazy" draggable={false} onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
  </span>;
}
