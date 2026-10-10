import React from 'react';
import * as Icons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

const iconMap: Record<string, React.ElementType> = {
  store: Icons.Store,
  cake: Icons.Cake,
  bike: Icons.Bike,
  'party-popper': Icons.PartyPopper,
  wheat: Icons.Wheat,
  package: Icons.Package,
  flame: Icons.Flame,
  truck: Icons.Truck,
  megaphone: Icons.Megaphone,
  'cooking-pot': Icons.CookingPot,
  'credit-card': Icons.CreditCard,
  users: Icons.Users,
  home: Icons.Home,
  landmark: Icons.Landmark,
  ellipsis: Icons.MoreHorizontal,
  tag: Icons.Tag,
  dollar: Icons.DollarSign,
  receipt: Icons.Receipt,
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-5 h-5', size = 20 }) => {
  const IconComponent = iconMap[name] || Icons.Tag;
  return <IconComponent className={className} size={size} strokeWidth={2} />;
};
