import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import styles from "./experiment-cta.module.css";

export default function ExperimentCta() {
  return (
    <section className={styles.section} aria-labelledby="experiment-cta-heading">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <h2 id="experiment-cta-heading">Jam sibuk berikutnya<br /><span>biar Menuin yang atur.</span></h2>
          <p>QR di meja, kasir, papan pesanan, dan laporan dalam satu sistem. Coba 14 hari, tanpa kartu kredit.</p>
          <Link href="/auth/signup" className={styles.button}>
            <span>Mulai uji coba gratis</span>
            <span className={styles.buttonIcon}><ArrowUpRight size={19} aria-hidden="true" /></span>
          </Link>
        </div>
        <div className={styles.art} aria-hidden="true">
          <div className={styles.orbit} />
          <div className={styles.orbitInner} />
          <div className={styles.dot} />
          <div className={styles.satellite} />
        </div>
      </div>
    </section>
  );
}
