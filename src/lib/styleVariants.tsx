import { lazy, Suspense, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react';
import type { StyleName } from '@/config/themes';

type StyleLoaders<P extends object> = Record<StyleName, () => Promise<{ default: ComponentType<P> }>>;

/** Lazy map: doar chunk-ul stilului activ se încarcă la primul render. */
export function createStyleVariants<P extends object>(
  loaders: StyleLoaders<P>,
): Record<StyleName, LazyExoticComponent<ComponentType<P>>> {
  return {
    gamified: lazy(loaders.gamified),
    clean: lazy(loaders.clean),
    premium: lazy(loaders.premium),
    friendly: lazy(loaders.friendly),
  };
}

export function StyleVariantSuspense({
  fallback = null,
  children,
}: {
  fallback?: ReactNode;
  children: ReactNode;
}) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
