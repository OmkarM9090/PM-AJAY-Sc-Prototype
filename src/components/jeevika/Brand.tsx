import Link from "next/link";

export function AshokaMark({ compact = false }: { compact?: boolean }) {
  return <span aria-hidden="true" className={compact ? "ashoka-mark ashoka-mark--small" : "ashoka-mark"}><span>☸</span></span>;
}

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`brand ${light ? "brand--light" : ""}`} aria-label="JeevikaSetu home">
      <AshokaMark compact />
      <span><strong>JeevikaSetu</strong><small>PM-AJAY aligned prototype</small></span>
    </Link>
  );
}
