"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { faqData } from "./faq-data";
import styles from "./experiment-faq.module.css";

export default function ExperimentFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let pointer: { x: number; y: number } | null = null;
    let frame = 0;

    const rememberPointer = (event: MouseEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "mouse") rememberPointer(event);
    };
    const onPointerOut = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && !event.relatedTarget) {
        pointer = null;
        setHoveredIndex(null);
      }
    };
    const onScroll = () => {
      if (!pointer || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!pointer) return;
        const item = document.elementFromPoint(pointer.x, pointer.y)?.closest<HTMLElement>("[data-faq-index]");
        setHoveredIndex(item && listRef.current?.contains(item) ? Number(item.dataset.faqIndex) : null);
      });
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut, { passive: true });
    window.addEventListener("wheel", rememberPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("wheel", rememberPointer);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section id="faq" className={styles.section} aria-labelledby="experiment-faq-heading">
      <div className={styles.inner}>
        <div className={styles.intro}>
          <h2 id="experiment-faq-heading">FAQ<br /><span>Frequently Ask Questions</span></h2>
          
          <div className={styles.contact}>
            <div className={styles.contactMark} aria-hidden="true">?</div>
            <div className={styles.contactContent}>
              <p>Masih ada yang ingin ditanyakan?</p>
              <Link href="/kontak" className={styles.contactLink}>
                Hubungi kami <span><ArrowUpRight size={18} aria-hidden="true" /></span>
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.list} ref={listRef}>
          {faqData.map((faq, index) => {
            const isOpen = openIndex === index || hoveredIndex === index;
            return (
              <div
                className={styles.item}
                data-open={isOpen}
                data-faq-index={index}
                key={faq.question}
                onPointerEnter={event => {
                  if (event.pointerType === "mouse") setHoveredIndex(index);
                }}
                onPointerLeave={event => {
                  if (event.pointerType === "mouse") setHoveredIndex(current => current === index ? null : current);
                }}
              >
                <h3>
                  <button
                    type="button"
                    className={styles.trigger}
                    aria-expanded={isOpen}
                    aria-controls={`experiment-faq-answer-${index}`}
                    onClick={() => setOpenIndex(current => current === index ? null : index)}
                  >
                    <span>{faq.question}</span>
                    <span className={styles.icon}><Plus size={20} strokeWidth={1.8} aria-hidden="true" /></span>
                  </button>
                </h3>
                <div id={`experiment-faq-answer-${index}`} className={styles.answer} aria-hidden={!isOpen}>
                  <div><p>{faq.answer}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
