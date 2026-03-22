/**
 * Home — Clean
 * Minimal, mult spațiu alb, fără decorații.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export const CleanHome: React.FC<{ data: HomeDisplayData }> = ({ data }) => {
  const { items, filteredItems, categories, searchQuery, isLoading, recommendedProducts, totalProducts, handleSearch, handleCategoryClick } = data;

  if (isLoading && items.length === 0) return <Layout><PageLoader /></Layout>;

  return (
    <Layout>
      {/* Hero — minimal */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <motion.h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-foreground tracking-tight leading-tight" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: easeOut }}>
              {texts.home.heroTitle}
            </motion.h1>
            <motion.p className="text-base text-muted-foreground mt-4 mb-8 max-w-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
              {texts.home.heroSubtitle}
            </motion.p>
            <motion.div className="relative max-w-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.3 }}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <Input type="text" placeholder={texts.home.searchPlaceholder} value={searchQuery} onChange={handleSearch} className="pl-10 pr-4 h-10 text-sm rounded-md border-border/40" />
            </motion.div>
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
          <motion.h2 className="text-lg font-medium text-foreground mb-6" initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
            {texts.home.categories}
          </motion.h2>
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

      {searchQuery && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            <h2 className="text-sm font-medium text-muted-foreground mb-6">Rezultate pentru "{searchQuery}" ({filteredItems.length})</h2>
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{filteredItems.map((p) => <ProductCard key={p.id} product={p} />)}</div>
            ) : <p className="text-sm text-muted-foreground">{texts.catalog.noProducts}</p>}
          </div>
        </section>
      )}

      {!searchQuery && (
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
      )}

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
