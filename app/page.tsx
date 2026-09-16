export default function Home() {
  return (
    <div className="av-hero fade-in">
      <h1 className="flicker">ARCADE VAULT</h1>
      <p className="sub">
        <span className="neon-cyan">PLAY</span>{" "}
        <span className="neon-magenta">COMPETE</span>{" "}
        <span className="neon-yellow">RANK UP</span>
        <span className="blink">_</span>
      </p>
      <div className="detail-actions" style={{ justifyContent: "center", marginTop: 32 }}>
        <button className="btn pulse lg">Explorar Biblioteca</button>
        <button className="btn ghost lg">Salón de la Fama</button>
      </div>
    </div>
  );
}
