/**
 * Home — Premium
 * Glassmorphism, tipografie elegantă, spațiere generoasă.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { TierProgressBar } from '@/components/layout/TierProgressBar';
import { ProductCard } from '@/components/common/ProductCard';
import { PageLoader } from '@/components/common/Loader';
import { HomeMarketingCards } from '@/plugins/streak/components/HomeMarketingCards';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { CategoryIconDisplay } from '@/config/categoryIcons';
import type { HomeDisplayData } from './shared';
import { easeOut, fadeUp, staggerContainer, cardVariant } from './shared';
import { HomeComboPill } from './HomeComboPill';
import { HomeHeroLogo } from './HomeHeroLogo';

export const PremiumHome: React.FC<{ data: HomeDisplayData }> = ({ data }) => {
  const { items, categories, comboCategory, isLoading, recommendedProducts, totalProducts, handleCategoryClick } = data;

  if (isLoading && items.length === 0) return <Layout><PageLoader /></Layout>;

  return (
    <Layout>
      {/* Hero — glass */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/10" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <HomeHeroLogo variant="premium" />
            <motion.p className="text-xs font-medium text-muted-foreground tracking-widest uppercase mb-6">
              Premium Experience
            </motion.p>
            <motion.h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold mb-6 text-foreground tracking-tight" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOut }}>
              {texts.home.heroTitle}
            </motion.h1>
          </div>
        </div>
      </section>

      <section className="pb-4">
        <div className="container mx-auto px-4 mt-4">
          <div className="max-w-xl mx-auto">
            <TierProgressBar />
          </div>
        </div>
      </section>
      <HomeMarketingCards />

      {/* Categories */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 sm:gap-3 mb-10 min-w-0 w-full">
            <motion.h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight shrink-0" initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
              {texts.home.categories}
            </motion.h2>
            {comboCategory ? (
              <div className="flex-1 flex justify-center min-w-0 px-1">
                <HomeComboPill
                  variant="premium"
                  category={comboCategory}
                  onNavigate={() => handleCategoryClick(comboCategory.name)}
                />
              </div>
            ) : (
              <div className="flex-1 min-w-0 shrink" aria-hidden />
            )}
            <Button variant="ghost" asChild className="text-muted-foreground shrink-0">
              <Link to={routes.catalog} className="flex items-center gap-2">{texts.home.viewAll}<ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="overflow-x-auto scrollbar-none -mx-4 px-4">
            <motion.div className="flex gap-3 w-max" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {categories.map((category) => (
                <motion.div key={category.id} variants={cardVariant} className="shrink-0">
                  <Link to={routes.catalog} onClick={() => handleCategoryClick(category.name)} className="flex flex-col items-center justify-center w-[120px] p-5 rounded-2xl bg-background/60 backdrop-blur-xl border border-border/20 hover:border-primary/30 hover:shadow-lg transition-all group">
                    <span className="text-primary mb-2"><CategoryIconDisplay categoryName={category.name} iconId={category.icon} size={28} /></span>
                    <span className="text-xs font-medium text-foreground/80 group-hover:text-primary transition-colors text-center">{category.displayName}</span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <motion.h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight" initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>{texts.home.recommended}</motion.h2>
                {totalProducts > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">{texts.home.totalProductsInMenu.replace('{count}', String(totalProducts))}</p>
                )}
              </div>
              <Button variant="ghost" asChild className="text-muted-foreground"><Link to={routes.catalog} className="flex items-center gap-2">{texts.home.viewAll}<ArrowRight className="h-4 w-4" /></Link></Button>
            </div>
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {recommendedProducts.map((p) => <motion.div key={p.id} variants={cardVariant}><ProductCard product={p} /></motion.div>)}
            </motion.div>
          </div>
        </section>

      {/* CTA — glass */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div className="rounded-3xl border border-border/20 bg-background/60 backdrop-blur-xl p-10 md:p-16 text-center shadow-lg" initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4 tracking-tight">Pregătit să comanzi?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Explorează catalogul nostru complet și alege din cele mai bune preparate.</p>
            <Button size="lg" asChild className="rounded-xl"><Link to={routes.catalog}>{texts.home.orderNow}<ArrowRight className="ml-2 h-5 w-5" /></Link></Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};
