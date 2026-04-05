/**
 * Home — singura sursă pentru pagina principală (hero GamifiedHeroHub, categorii, recomandate, CTA).
 */
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { useAppSelector } from '@/store';
import { selectCartItemCount } from '@/store/slices/cartSlice';
import { GamifiedHeroHub } from './GamifiedHeroHub';
import { ProductCard } from '@/components/common/ProductCard';
import { PageLoader } from '@/components/common/Loader';
import { HomeMarketingCards } from '@/plugins/streak/components/HomeMarketingCards';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { CategoryIconDisplay, splitCategoriesPinnedComboFirst } from '@/config/categoryIcons';
import type { HomeDisplayData } from './shared';
import { fadeUp, staggerContainer, cardVariant } from './shared';

const MotionLink = motion(Link);

/** Categorii care derulează — doar icon + titlu, fără card. */
const categoryLinkClassScroll =
  'flex flex-col items-center justify-center gap-1.5 max-w-[110px] shrink-0 py-1 px-0.5 text-center transition-colors group';

/** Combo (pinned) — rămâne card (bg, bordură, colțuri). */
const categoryLinkClassPinned =
  'flex flex-col items-center justify-center gap-1.5 w-[110px] shrink-0 p-4 rounded-xl bg-card border-2 border-transparent hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all group';

const CATEGORY_ICON_SIZE_HOME = 44;

function homeCategoryLinkInner(category: {
  name: string;
  displayName: string;
  icon?: string | null;
}) {
  return (
    <>
      <span className="text-primary leading-none">
        <CategoryIconDisplay categoryName={category.name} iconId={category.icon} size={CATEGORY_ICON_SIZE_HOME} />
      </span>
      <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors text-center leading-tight">
        {category.displayName}
      </span>
    </>
  );
}

export const HomePage: React.FC<{ data: HomeDisplayData }> = ({ data }) => {
  const { items, categories, isLoading, recommendedProducts, totalProducts, handleCategoryClick } = data;
  const { pinned: pinnedCategories, scroll: scrollCategories } = useMemo(
    () => splitCategoriesPinnedComboFirst(categories),
    [categories]
  );
  const cartItemCount = useAppSelector(selectCartItemCount);
  const cartSubtotal = useAppSelector((s) => s.cart.subtotal);

  return (
    <Layout>
      {isLoading && items.length === 0 ? (
        <PageLoader />
      ) : (
        <>
      <GamifiedHeroHub />

      <section className="py-10 md:py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          {pinnedCategories.length === 0 ? (
            <div className="-mx-4 px-4 overflow-x-auto scrollbar-none">
              <motion.div
                className="flex w-max items-center gap-3 pr-4"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {categories.map((category) => (
                  <MotionLink
                    key={category.id}
                    to={routes.catalog}
                    onClick={() => handleCategoryClick(category.name)}
                    className={categoryLinkClassScroll}
                    variants={cardVariant}
                  >
                    {homeCategoryLinkInner(category)}
                  </MotionLink>
                ))}
              </motion.div>
            </div>
          ) : (
            /* Full-bleed la lățimea viewport-ului: pe desktop combo e lipit de marginea stângă a ecranului, nu doar de container. */
            <div className="w-screen min-w-0 max-w-[100vw] overflow-x-auto scrollbar-none pl-[max(0px,env(safe-area-inset-left))] pr-4 ml-[calc(50%-50vw)]">
              <motion.div
                className="flex w-max items-center gap-6"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <div className="sticky left-0 z-20 flex shrink-0 gap-6">
                  {pinnedCategories.map((category) => (
                    <MotionLink
                      key={category.id}
                      to={routes.catalog}
                      onClick={() => handleCategoryClick(category.name)}
                      className={categoryLinkClassPinned}
                      variants={cardVariant}
                    >
                      {homeCategoryLinkInner(category)}
                    </MotionLink>
                  ))}
                </div>
                {scrollCategories.map((category) => (
                  <MotionLink
                    key={category.id}
                    to={routes.catalog}
                    onClick={() => handleCategoryClick(category.name)}
                    className={categoryLinkClassScroll}
                    variants={cardVariant}
                  >
                    {homeCategoryLinkInner(category)}
                  </MotionLink>
                ))}
              </motion.div>
            </div>
          )}
        </div>
      </section>

      <HomeMarketingCards />

      <section className="py-12 md:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <motion.h2 className="text-2xl md:text-3xl font-extrabold text-foreground" initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>{texts.home.recommended}</motion.h2>
                {totalProducts > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">{texts.home.totalProductsInMenu.replace('{count}', String(totalProducts))}</p>
                )}
              </div>
              <Button variant="ghost" asChild><Link to={routes.catalog} className="flex items-center gap-2">{texts.home.viewAll}<ArrowRight className="h-4 w-4" /></Link></Button>
            </div>
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {recommendedProducts.map((p) => <motion.div key={p.id} variants={cardVariant}><ProductCard product={p} /></motion.div>)}
            </motion.div>
          </div>
        </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div className="bg-primary rounded-2xl p-8 md:p-12 text-center shadow-2xl shadow-primary/20" initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            {cartItemCount > 0 ? (
              <>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <ShoppingBag className="h-7 w-7 text-primary-foreground" />
                  <h2 className="text-2xl md:text-3xl font-extrabold text-primary-foreground">
                    Ai {cartItemCount} produse în coș · {cartSubtotal.toFixed(0)} {texts.common.currency}
                  </h2>
                </div>
                <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">Finalizează comanda acum și nu pierde reducerile!</p>
                <Button size="lg" variant="secondary" asChild className="rounded-xl font-bold">
                  <Link to={routes.checkout}>Finalizează comanda<ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-2xl md:text-3xl font-extrabold text-primary-foreground mb-4">Pregătit să comanzi?</h2>
                <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">Explorează catalogul nostru complet și alege din cele mai bune preparate.</p>
                <Button size="lg" variant="secondary" asChild className="rounded-xl font-bold"><Link to={routes.catalog}>{texts.home.orderNow}<ArrowRight className="ml-2 h-5 w-5" /></Link></Button>
              </>
            )}
          </motion.div>
        </div>
      </section>
        </>
      )}
    </Layout>
  );
};
