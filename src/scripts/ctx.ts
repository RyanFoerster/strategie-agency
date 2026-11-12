import type Lenis from 'lenis';

export type Ctx = {
  lenis: Lenis;
  /** prefers-reduced-motion */
  reduced: boolean;
  /** a real mouse is available (hover effects, cursor label…) */
  hover: boolean;
};
