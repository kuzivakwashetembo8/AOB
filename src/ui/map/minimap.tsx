export function Minimap({ context }: { context: string }) {
  return <div className="minimap" role="img" aria-label="Minimap placeholder: Meridian Central"><div className="minimap-roads" /><div className="minimap-player" /><span className="minimap-north">N</span><span className="minimap-label">{context === 'driving' ? 'ROUTE // AWAITING RUNTIME' : 'MERIDIAN CENTRAL // SCHEMATIC'}</span></div>;
}
