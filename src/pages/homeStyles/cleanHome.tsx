/**
 * Home — Clean
 * Minimal, mult spațiu alb, fără decorații.
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

export const CleanHome: React.FC<{ data: HomeDisplayData }> = ({ data }) => {
  const { items, categories, comboCategory, isLoading, recommendedProducts, totalProducts, handleCategoryClick } = data;

  if (isLoading && items.length === 0) return <Layout><PageLoader /></Layout>;

  return (
    <Layout>
      {/* Hero — minimal */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <HomeHeroLogo variant="clean" align="start" />
            <motion.h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-foreground tracking-tight leading-tight" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: easeOut }}>
              {texts.home.heroTitle}
            </motion.h1>
          </div>
        </div>
      </section>

      <section className="pb-4">
        <div className="container mx-auto px-6 mt-4">
          <div className="max-w-xl mx-auto">
            <TierProgressBar />
          </div>
        </div>
      </section>
      <HomeMarketingCards />

      {/* Categories — text-only grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 sm:gap-3 mb-6 min-w-0 w-full">
            <motion.h2 className="text-lg font-medium text-foreground shrink-0" initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
              {texts.home.categories}
            </motion.h2>
            {comboCategory ? (
              <div className="flex-1 flex justify-center min-w-0 px-1">
                <HomeComboPill
                  variant="clean"
                  category={comboCategory}
                  onNavigate={() => handleCategoryClick(comboCategory.name)}
                />
              </div>
            ) : (
              <div className="flex-1 min-w-0 shrink" aria-hidden />
            )}
            <Link to={routes.catalog} className="text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0 whitespace-nowrap">
              {texts.home.viewAll} →
            </Link>
          </div>
          <div className="overflow-x-auto scrollbar-none -mx-4 px-4">
            <motion.div className="flex gap-2 w-max" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {categories.map((category) => (
                <motion.div key={category.id} variants={cardVariant} className="shrink-0">
                  <Link to={routes.catalog} onClick={() => handleCategoryClick(category.name)} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                    <span className="text-muted-foreground"><CategoryIconDisplay categoryName={category.name} iconId={category.icon} size={18} /></span>
                    <span>{category.displayName}</span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <motion.h2 className="text-lg font-medium text-foreground" initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>{texts.home.recommended}</motion.h2>
                {totalProducts > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{texts.home.totalProductsInMenu.replace('{count}', String(totalProducts))}</p>
                )}
              </div>
              <Link to={routes.catalog} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{texts.home.viewAll} →</Link>
            </div>
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {recommendedProducts.map((p) => <motion.div key={p.id} variants={cardVariant}><ProductCard product={p} /></motion.div>)}
            </motion.div>
          </div>
        </section>

      {/* CTA — minimal */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div className="text-center py-12" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-xl font-medium text-foreground mb-3">Pregătit să comanzi?</h2>
            <p className="text-sm text-muted-foreground mb-6">Explorează catalogul complet.</p>
            <Button size="default" asChild><Link to={routes.catalog}>{texts.home.orderNow}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};
