// Scroll wiring: one ScrollTrigger per act section feeds progress to the act
// and tells the stage which act owns the canvas. Sections are tall (CSS) with
// sticky copy — no pinning, so we never fight the host page's layout.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

export { gsap, ScrollTrigger };

export function wireScroll(stage) {
  stage.getActs().forEach((act) => {
    ScrollTrigger.create({
      trigger: act.sectionEl,
      start: 'top 60%',
      end: 'bottom 40%',
      onEnter: () => stage.setActive(act.id),
      onEnterBack: () => stage.setActive(act.id),
      onUpdate: (self) => { act.progress = self.progress; },
    });
  });
}

export function scrollToSection(el) {
  gsap.to(window, { duration: 1.2, ease: 'power2.inOut', scrollTo: { y: el, offsetY: 0 } });
}
