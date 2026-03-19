/**
 * Home — Gamified
 * Bold, energic, cu badges și gradient-uri puternice.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Zap, ShoppingBag, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Layout } from '@/components/layout/Layout';
import { useAppSelector } from '@/store';
import { selectCartItemCount } from '@/store/slices/cartSlice';
import { TierProgressBar } from '@/components/layout/TierProgressBar';
import { ProductCard } from '@/components/common/ProductCard';
import { PageLoader } from '@/components/common/Loader';
import { StreakCampaignBlock } from '@/plugins/streak';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { CategoryIconDisplay } from '@/config/categoryIcons';
import type { HomeDisplayData } from './shared';
import { easeOut, fadeUp, staggerContainer, cardVariant } from './shared';

export const GamifiedHome: React.FC<{ data: HomeDisplayData }> = ({ data }) => {
  const { items, filteredItems, categories, searchQuery, isLoading, recommendedProducts, totalProducts, handleSearch, handleCategoryClick } = data;
  const { isAuthenticated, user } = useAppSelector((s) => s.user);
  const cartItemCount = useAppSelector(selectCartItemCount);
  const cartSubtotal = useAppSelector((s) => s.cart.subtotal);
  const hasFreeProductCampaigns = (user?.freeProductCampaignsSummary?.length ?? 0) > 0;

  if (isLoading && items.length === 0) return <Layout><PageLoader /></Layout>;

  return (
    <Layout>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/70 py-16 md:py-24 overflow-hidden text-primary-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 bg-primary-foreground/15 rounded-full px-4 py-1.5 mb-6 text-sm font-bold">
              <Zap className="h-4 w-4" /> Comandă acum!
            </motion.div>
            <motion.h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOut }}>
              {isAuthenticated && user
                ? <>Bine ai revenit, <span className="text-primary-foreground/90">{user.name?.split(' ')[0]}</span>!</>
                : texts.home.heroTitle}
            </motion.h1>
            <motion.p className="text-lg md:text-xl text-primary-foreground/80 mb-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15, ease: easeOut }}>
              {isAuthenticated && user?.pointsBalance
                ? <>Ai <strong>{user.pointsBalance} puncte</strong> de folosit · {user.tier?.name && <span>Nivel: <strong>{user.tier.name}</strong></span>}</>
                : texts.home.heroSubtitle}
            </motion.p>
            {/* Limited offer banner */}
            {isAuthenticated && hasFreeProductCampaigns && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-primary-foreground/20 border border-primary-foreground/30 rounded-full px-5 py-2 mb-6 text-sm font-bold"
              >
                <Star className="h-4 w-4 fill-primary-foreground" />
                Produse GRATIS pentru nivelul tău — doar astăzi!
              </motion.div>
            )}
            <motion.div className="relative max-w-xl mx-auto" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3, ease: easeOut }}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input type="text" placeholder={texts.home.searchPlaceholder} value={searchQuery} onChange={handleSearch} className="pl-12 pr-4 h-14 text-lg rounded-full border-2 border-primary-foreground/20 bg-background text-foreground focus-visible:ring-primary-foreground/30" />
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
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <motion.h2 className="text-2xl md:text-3xl font-extrabold text-foreground" initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
              {texts.home.categories}
            </motion.h2>
            <Button variant="ghost" asChild><Link to={routes.catalog} className="flex items-center gap-2 font-bold">{texts.home.viewAll}<ArrowRight className="h-4 w-4" /></Link></Button>
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

      {/* Search Results */}
      {searchQuery && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-bold mb-6 text-foreground">Rezultate pentru "{searchQuery}" ({filteredItems.length})</h2>
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{filteredItems.map((p) => <ProductCard key={p.id} product={p} />)}</div>
            ) : <p className="text-muted-foreground">{texts.catalog.noProducts}</p>}
          </div>
        </section>
      )}

      {/* Recommended */}
      {!searchQuery && (
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
      )}

      {/* CTA — personalized if cart has items */}
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
    </Layout>
  );
};
