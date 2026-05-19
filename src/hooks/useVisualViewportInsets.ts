import { useEffect } from 'react';

const MOBILE_MQ = '(max-width: 767px)';

function syncVisualViewportInsets() {
  const root = document.documentElement;
  const isMobile = window.matchMedia(MOBILE_MQ).matches;

  if (!isMobile) {
    root.style.setProperty('--vv-bottom-inset', '0px');
    return;
  }

  const vv = window.visualViewport;
  if (!vv) {
    root.style.setProperty('--vv-bottom-inset', '0px');
    return;
  }

  const bottom = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
  root.style.setProperty('--vv-bottom-inset', `${bottom}px`);
}

/** Chrome mobile: bottom fixed nav urmărește visual viewport, nu layout viewport. */
export function useVisualViewportInsets() {
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);

    const onViewportChange = () => syncVisualViewportInsets();

    syncVisualViewportInsets();
    mq.addEventListener('change', onViewportChange);

    const vv = window.visualViewport;
    vv?.addEventListener('resize', onViewportChange);
    vv?.addEventListener('scroll', onViewportChange);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('orientationchange', onViewportChange);

    return () => {
      mq.removeEventListener('change', onViewportChange);
      vv?.removeEventListener('resize', onViewportChange);
      vv?.removeEventListener('scroll', onViewportChange);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('orientationchange', onViewportChange);
      document.documentElement.style.setProperty('--vv-bottom-inset', '0px');
    };
  }, []);
}
