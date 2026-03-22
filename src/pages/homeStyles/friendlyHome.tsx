/**
 * Home — Friendly
 * Cald, accesibil, rotunjit, prietenos.
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

export const FriendlyHome: React.FC<{ data: HomeDisplayData }> = ({ data }) => {
  const { items, filteredItems, categories, searchQuery, isLoading, recommendedProducts, totalProducts, handleSearch, handleCategoryClick } = data;

  if (isLoading && items.length === 0) return <Layout><PageLoader /></Layout>;

  return (
    <Layout>
      {/* Hero — warm gradient */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-16 md:py-24 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOut }}>
              {texts.home.heroTitle}
            </motion.h1>
            <motion.p className="text-lg md:text-xl text-muted-foreground mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15, ease: easeOut }}>
              {texts.home.heroSubtitle}
            </motion.p>
            <motion.div className="relative max-w-xl mx-auto" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3, ease: easeOut }}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input type="text" placeholder={texts.home.searchPlaceholder} value={searchQuery} onChange={handleSearch} className="pl-12 pr-4 h-14 text-lg rounded-full border-2 focus-visible:ring-primary" />
            </motion.div>
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
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <motion.h2 className="text-2xl md:text-3xl font-bold text-foreground" initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
              {texts.home.categories}
            </motion.h2>
            <Button variant="ghost" asChild><Link to={routes.catalog} className="flex items-center gap-2">{texts.home.viewAll}<ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
          <div className="overflow-x-auto scrollbar-none -mx-4 px-4">
            <motion.div className="flex gap-3 w-max" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {categories.map((category) => (
                <motion.div key={category.id} variants={cardVariant} className="shrink-0">
                  <Link to={routes.catalog} onClick={() => handleCategoryClick(category.name)} className="flex flex-col items-center justify-center w-[110px] p-4 rounded-2xl bg-card border hover:border-primary hover:shadow-md transition-all group">
                    <span className="text-primary mb-1.5"><CategoryIconDisplay categoryName={category.name} iconId={category.icon} size={28} /></span>
                    <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors text-center leading-tight">{category.displayName}</span>
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
            <h2 className="text-xl font-semibold mb-6 text-foreground">Rezultate pentru "{searchQuery}" ({filteredItems.length})</h2>
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{filteredItems.map((p) => <ProductCard key={p.id} product={p} />)}</div>
            ) : <p className="text-muted-foreground">{texts.catalog.noProducts}</p>}
          </div>
        </section>
      )}

      {!searchQuery && (
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <motion.h2 className="text-2xl md:text-3xl font-bold text-foreground" initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>{texts.home.recommended}</motion.h2>
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
      )}

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div className="bg-primary rounded-3xl p-8 md:p-12 text-center" initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">Pregătit să comanzi?</h2>
            <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">Explorează catalogul nostru complet și alege din cele mai bune preparate.</p>
            <Button size="lg" variant="secondary" asChild className="rounded-full"><Link to={routes.catalog}>{texts.home.orderNow}<ArrowRight className="ml-2 h-5 w-5" /></Link></Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};
