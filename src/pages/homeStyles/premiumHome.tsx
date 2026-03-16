/**
 * Home — Premium
 * Glassmorphism, tipografie elegantă, spațiere generoasă.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Layout } from '@/components/layout/Layout';
import { TierProgressBar } from '@/components/layout/TierProgressBar';
import { ProductCard } from '@/components/common/ProductCard';
import { PageLoader } from '@/components/common/Loader';
import { StreakCampaignBlock } from '@/plugins/streak';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { CategoryIconDisplay } from '@/config/categoryIcons';
import type { HomeDisplayData } from './shared';
import { easeOut, fadeUp, staggerContainer, cardVariant } from './shared';

export const PremiumHome: React.FC<{ data: HomeDisplayData }> = ({ data }) => {
  const { items, filteredItems, categories, searchQuery, isLoading, recommendedProducts, totalProducts, handleSearch, handleCategoryClick } = data;

  if (isLoading && items.length === 0) return <Layout><PageLoader /></Layout>;

  return (
    <Layout>
      {/* Hero — glass */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/10" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="inline-flex items-center gap-2 mb-8">
              <Crown className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground tracking-widest uppercase">Premium Experience</span>
            </motion.div>
            <motion.h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold mb-6 text-foreground tracking-tight" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOut }}>
              {texts.home.heroTitle}
            </motion.h1>
            <motion.p className="text-lg text-muted-foreground mb-10 leading-relaxed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15, ease: easeOut }}>
              {texts.home.heroSubtitle}
            </motion.p>
            <motion.div className="relative max-w-xl mx-auto" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3, ease: easeOut }}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
              <Input type="text" placeholder={texts.home.searchPlaceholder} value={searchQuery} onChange={handleSearch} className="pl-12 pr-4 h-14 text-lg rounded-2xl border-border/20 bg-background/60 backdrop-blur-xl focus-visible:ring-primary/20" />
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
      <StreakCampaignBlock />

      {/* Categories */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <motion.h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight" initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
              {texts.home.categories}
            </motion.h2>
            <Button variant="ghost" asChild className="text-muted-foreground"><Link to={routes.catalog} className="flex items-center gap-2">{texts.home.viewAll}<ArrowRight className="h-4 w-4" /></Link></Button>
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
      )}

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
