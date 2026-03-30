/**
 * Home — singura sursă pentru pagina principală (hero GamifiedHeroHub, categorii, recomandate, CTA).
 */
import React from 'react';
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
import { CategoryIconDisplay } from '@/config/categoryIcons';
import type { HomeDisplayData } from './shared';
import { fadeUp, staggerContainer, cardVariant } from './shared';
import { HomeComboPill } from './HomeComboPill';
import { HomeStoreGate } from './HomeStoreGate';

export const HomePage: React.FC<{ data: HomeDisplayData }> = ({ data }) => {
  const { items, categories, comboCategory, isLoading, recommendedProducts, totalProducts, handleCategoryClick } = data;
  const cartItemCount = useAppSelector(selectCartItemCount);
  const cartSubtotal = useAppSelector((s) => s.cart.subtotal);

  return (
    <Layout>
      <HomeStoreGate />
      {isLoading && items.length === 0 ? (
        <PageLoader />
      ) : (
        <>
      <GamifiedHeroHub />
      <HomeMarketingCards />

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 sm:gap-3 mb-8 min-w-0 w-full">
            <motion.h2 className="text-2xl md:text-3xl font-extrabold text-foreground shrink-0" initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
              {texts.home.categories}
            </motion.h2>
            {comboCategory ? (
              <div className="flex-1 flex justify-center min-w-0 px-1">
                <HomeComboPill
                  variant="gamified"
                  category={comboCategory}
                  onNavigate={() => handleCategoryClick(comboCategory.name)}
                />
              </div>
            ) : (
              <div className="flex-1 min-w-0 shrink" aria-hidden />
            )}
            <Button variant="ghost" asChild className="shrink-0">
              <Link to={routes.catalog} className="flex items-center gap-2 font-bold">{texts.home.viewAll}<ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="overflow-x-auto scrollbar-none -mx-4 px-4">
            <motion.div className="flex gap-3 w-max" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {categories.map((category) => (
                <motion.div key={category.id} variants={cardVariant} className="shrink-0">
                  <Link to={routes.catalog} onClick={() => handleCategoryClick(category.name)} className="flex flex-col items-center justify-center w-[110px] p-4 rounded-xl bg-card border-2 border-transparent hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all group">
                    <span className="text-primary mb-1.5"><CategoryIconDisplay categoryName={category.name} iconId={category.icon} size={28} /></span>
                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors text-center leading-tight">{category.displayName}</span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

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
