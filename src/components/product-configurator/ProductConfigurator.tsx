import React, { useMemo } from 'react';
import type {
  Product,
  ProductOptionGroup,
  OrderItemConfigurationGroup,
  OrderItemConfigurationOption,
} from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ProductConfiguratorProps {
  product: Product;
  onChange: (configuration: OrderItemConfigurationGroup[] | undefined, unitPriceWithConfiguration: number) => void;
}

export const ProductConfigurator: React.FC<ProductConfiguratorProps> = ({
  product,
  onChange,
}) => {
  const groups: ProductOptionGroup[] = product.optionGroups ?? [];

  const [selection, setSelection] = React.useState<OrderItemConfigurationGroup[] | undefined>(() => {
    if (!groups.length) return undefined;
    return groups.map((g) => ({
      groupId: g.id,
      groupName: g.name,
      options: g.options.filter((o) => o.isDefault).map((o) => ({
        optionId: o.id,
        name: o.name,
        priceDelta: o.priceDelta,
      })),
    }));
  });

  const unitPrice = useMemo(() => {
    const base = product.price;
    const deltas =
      selection?.reduce(
        (sum, g) => sum + g.options.reduce((s, o) => s + (o.priceDelta || 0), 0),
        0
      ) ?? 0;
    return base + deltas;
  }, [product.price, selection]);

  React.useEffect(() => {
    onChange(selection, unitPrice);
  }, [selection, unitPrice, onChange]);

  if (!groups.length) return null;

  const toggleOption = (group: ProductOptionGroup, optionId: number) => {
    setSelection((prev) => {
      const current = prev ?? [];
      const existingGroup =
        current.find((g) => g.groupId === group.id) ??
        ({
          groupId: group.id,
          groupName: group.name,
          options: [],
        } as OrderItemConfigurationGroup);

      let options = [...existingGroup.options];
      const existingIndex = options.findIndex((o) => o.optionId === optionId);
      const optionMeta = group.options.find((o) => o.id === optionId);
      if (!optionMeta) return prev;

      const toOption: OrderItemConfigurationOption = {
        optionId: optionMeta.id,
        name: optionMeta.name,
        priceDelta: optionMeta.priceDelta,
      };

      if (group.maxSelected === 1 && !group.isRequired) {
        // Single-choice group: toggle selection
        options = existingIndex >= 0 ? [] : [toOption];
      } else if (group.maxSelected === 1) {
        // Required single choice: replace
        options = [toOption];
      } else if (group.maxSelected > 1 || group.isRequired || group.isRequired === false) {
        // Multi-select
        if (existingIndex >= 0) {
          options.splice(existingIndex, 1);
        } else {
          if (!group.maxSelected || options.length < group.maxSelected) {
            options.push(toOption);
          }
        }
      }

      const nextGroups = current.filter((g) => g.groupId !== group.id);
      if (options.length > 0) {
        nextGroups.push({
          groupId: group.id,
          groupName: group.name,
          options,
        });
      }
      return nextGroups.length > 0 ? nextGroups : undefined;
    });
  };

  return (
    <div className="space-y-4 mb-6">
      {groups.map((group) => {
        const selectedGroup = selection?.find((g) => g.groupId === group.id);
        const selectedIds = new Set(selectedGroup?.options.map((o) => o.optionId));
        const isSingle = !group.isRequired && group.maxSelected === 1;

        return (
          <div key={group.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{group.name}</span>
              {group.isRequired && (
                <Badge variant="outline" className="text-xs">
                  obligatoriu
                </Badge>
              )}
              {group.maxSelected && group.maxSelected > 1 && (
                <span className="text-xs text-muted-foreground">
                  max. {group.maxSelected}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {group.options.map((opt) => {
                const selected = selectedIds.has(opt.id);
                const delta = opt.priceDelta;
                const deltaLabel =
                  delta === 0
                    ? ''
                    : delta > 0
                    ? `+${delta} ${/* currency from texts at call site */ 'RON'}`
                    : `${delta} ${'RON'}`;
                return (
                  <Button
                    key={opt.id}
                    type="button"
                    size="sm"
                    variant={selected ? 'default' : 'outline'}
                    className={cn(
                      'rounded-full px-3 text-sm',
                      selected && 'bg-primary text-primary-foreground'
                    )}
                    onClick={() => toggleOption(group, opt.id)}
                  >
                    <span>{opt.name}</span>
                    {deltaLabel && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({deltaLabel})
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="flex items-baseline gap-2">
        <span className="text-sm text-muted-foreground">Preț configurat:</span>
        <span className="text-xl font-semibold text-primary">
          {unitPrice} {/* currency injected from parent label */}
        </span>
      </div>
    </div>
  );
};

