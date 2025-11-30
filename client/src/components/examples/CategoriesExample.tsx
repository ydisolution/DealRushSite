import { useState } from 'react';
import Categories from '../Categories';

export default function CategoriesExample() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  return (
    <div>
      <Categories 
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      <div className="p-4 text-sm">
        קטגוריה נבחרת: {selectedCategory || 'הכל'}
      </div>
    </div>
  );
}
