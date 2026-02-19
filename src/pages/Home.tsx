/**
 * Home page component
 */

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/common/ProductCard';
import { PageLoader } from '@/components/common/Loader';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProducts, fetchCategories, setSearchQuery, setSelectedCategory } from '@/store/slices/productsSlice';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { getCategoryIcon } from '@/config/categoryIcons';
import { StreakCampaignBlock } from '@/plugins/streak';

const Home: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, filteredItems, categories, searchQuery, isLoading } = useAppSelector(
    (state) => state.products
  );

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchQuery(e.target.value));
  };

  const handleCategoryClick = (categoryName: string) => {
    dispatch(setSelectedCategory(categoryName));
  };

  // Get recommended products (most recently added)
  const recommendedProducts = [...items]
    .slice(0, 4);

  if (isLoading && items.length === 0) {
    return (
      <Layout>
        <PageLoader />
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
              {texts.home.heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              {texts.home.heroSubtitle}
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={texts.home.searchPlaceholder}
                value={searchQuery}
                onChange={handleSearch}
                className="pl-12 pr-4 h-14 text-lg rounded-full border-2 focus-visible:ring-primary"
              />
            </div>
          </div>
        </div>
      </section>

      <StreakCampaignBlock />

      {/* Categories Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {texts.home.categories}
            </h2>
            <Button variant="ghost" asChild>
              <Link to={routes.catalog} className="flex items-center gap-2">
                {texts.home.viewAll}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={routes.catalog}
                onClick={() => handleCategoryClick(category.name)}
                className="flex flex-col items-center justify-center p-6 rounded-xl bg-card border hover:border-primary hover:shadow-md transition-all group"
              >
                <span className="text-4xl mb-2">{getCategoryIcon(category.name, category.icon)}</span>
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {category.displayName}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Search Results (if searching) */}
      {searchQuery && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-semibold mb-6 text-foreground">
              Rezultate pentru "{searchQuery}" ({filteredItems.length})
            </h2>
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">{texts.catalog.noProducts}</p>
            )}
          </div>
        </section>
      )}

      {/* Recommended Section */}
      {!searchQuery && (
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                {texts.home.recommended}
              </h2>
              <Button variant="ghost" asChild>
                <Link to={routes.catalog} className="flex items-center gap-2">
                  {texts.home.viewAll}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              Pregătit să comanzi?
            </h2>
            <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
              Explorează catalogul nostru complet și alege din cele mai bune preparate.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to={routes.catalog}>
                {texts.home.orderNow}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
