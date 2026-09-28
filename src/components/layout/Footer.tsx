import { AshokaMark } from "@/components/jeevika/Brand";

export default function Footer() {
  return <footer className="portal-footer">
    <div className="portal-footer__inner">
      <div className="footer-brand"><AshokaMark compact/><div><strong>JeevikaSetu</strong><span>Voice-first livelihood guidance prototype</span></div></div>
      <div className="footer-logos"><span>PM-AJAY <b>GIA</b></span><span>MoSJE</span><span>Digital India</span><span>Skill India</span></div>
      <p><b>Prototype notice:</b> Illustrative data only. This interface does not represent official approval, benefit sanction, a job guarantee, or a live government portal.</p>
    </div>
  </footer>;
}
