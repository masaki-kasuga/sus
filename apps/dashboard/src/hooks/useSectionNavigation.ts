import { RefObject, useCallback, useEffect } from 'react';

type SectionRefs<T extends string> = Record<T, RefObject<HTMLElement | null>>;

interface ScrollOptions {
  updateHash?: boolean;
  hash?: string | null;
}

interface UseSectionNavigationParams<T extends string> {
  sectionRefs: SectionRefs<T>;
  activeSection: T;
  loading?: boolean;
  onSectionChange?: (section: T) => void;
}

const SCROLL_BEHAVIOR: ScrollIntoViewOptions = {
  behavior: 'smooth',
  block: 'start',
};

export const useSectionNavigation = <T extends string>({
  sectionRefs,
  activeSection,
  loading = false,
  onSectionChange,
}: UseSectionNavigationParams<T>) => {
  const scrollToSection = useCallback(
    (section: T, options: ScrollOptions = {}) => {
      const target = sectionRefs[section]?.current;
      if (target) {
        target.scrollIntoView(SCROLL_BEHAVIOR);
      }

      if (options.updateHash && options.hash) {
        const normalizedHash = options.hash.startsWith('#') ? options.hash : `#${options.hash}`;
        window.history.replaceState(null, '', normalizedHash);
      }

      if (onSectionChange) {
        onSectionChange(section);
      }
    },
    [sectionRefs, onSectionChange],
  );

  useEffect(() => {
    if (loading) return;
    scrollToSection(activeSection);
  }, [loading, activeSection, scrollToSection]);

  return { scrollToSection };
};
