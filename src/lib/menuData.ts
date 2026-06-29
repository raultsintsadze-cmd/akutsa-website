export interface MenuItem {
  id: string;
  price: number;
  name: { ka: string; en: string; ru: string };
}

export interface MenuCategory {
  id: string;
  label: { ka: string; en: string; ru: string };
  items: MenuItem[];
}

// Placeholder menu — replace with the real Guest House Akutsa menu and prices.
export const MENU_CATEGORIES: MenuCategory[] = [
  {
    id: 'traditional',
    label: { ka: 'ტრადიციული', en: 'Traditional', ru: 'Традиционные' },
    items: [
      {
        id: 'khachapuri-adjarian',
        price: 18,
        name: { ka: 'ხაჭაპური აჭარული', en: 'Adjarian Khachapuri', ru: 'Хачапури по-аджарски' }
      },
      {
        id: 'khinkali',
        price: 12,
        name: { ka: 'ხინკალი (5 ცალი)', en: 'Khinkali (5 pcs)', ru: 'Хинкали (5 шт)' }
      },
      {
        id: 'mtsvadi',
        price: 22,
        name: { ka: 'მწვადი', en: 'Mtsvadi (Grilled Skewer)', ru: 'Мцвади (шашлык)' }
      },
      {
        id: 'chakapuli',
        price: 20,
        name: { ka: 'ჩაქაფული', en: 'Chakapuli', ru: 'Чакапули' }
      }
    ]
  },
  {
    id: 'breakfast',
    label: { ka: 'საუზმე', en: 'Breakfast', ru: 'Завтрак' },
    items: [
      {
        id: 'omelette',
        price: 10,
        name: { ka: 'ომლეტი ბოსტნეულით', en: 'Vegetable Omelette', ru: 'Омлет с овощами' }
      },
      {
        id: 'khacho-bread',
        price: 8,
        name: { ka: 'ხაჭო პურით', en: 'Khacho Cheese with Bread', ru: 'Качо с хлебом' }
      },
      {
        id: 'honey-matsoni',
        price: 7,
        name: { ka: 'თაფლი და მაწონი', en: 'Honey & Matsoni', ru: 'Мёд с мацони' }
      },
      {
        id: 'lobiani',
        price: 8,
        name: { ka: 'ლობიანი', en: 'Lobiani', ru: 'Лобиани' }
      }
    ]
  },
  {
    id: 'salads',
    label: { ka: 'სალათები', en: 'Salads', ru: 'Салаты' },
    items: [
      {
        id: 'eggplant-salad',
        price: 9,
        name: { ka: 'ბადრიჯნის სალათი', en: 'Eggplant Salad', ru: 'Салат из баклажанов' }
      },
      {
        id: 'fresh-vegetable-salad',
        price: 8,
        name: { ka: 'ხელნაკეთი სალათი ბოსტნეულით', en: 'Fresh Vegetable Salad', ru: 'Свежий овощной салат' }
      },
      {
        id: 'pkhali',
        price: 10,
        name: { ka: 'ფხალი', en: 'Pkhali', ru: 'Пхали' }
      }
    ]
  },
  {
    id: 'vegetarian',
    label: { ka: 'ვეგეტარიანული', en: 'Vegetarian', ru: 'Вегетарианское' },
    items: [
      {
        id: 'mushroom-dish',
        price: 14,
        name: { ka: 'სოკოს კერძი', en: 'Mushroom Dish', ru: 'Блюдо из грибов' }
      },
      {
        id: 'lobio',
        price: 12,
        name: { ka: 'ლობიო ქვაბში', en: 'Lobio in Clay Pot', ru: 'Лобио в горшочке' }
      },
      {
        id: 'bulgur-vegetables',
        price: 11,
        name: { ka: 'ცოცხალი ბურღული', en: 'Bulgur with Vegetables', ru: 'Булгур с овощами' }
      }
    ]
  },
  {
    id: 'desserts',
    label: { ka: 'დესერტები', en: 'Desserts', ru: 'Десерты' },
    items: [
      {
        id: 'pelamushi',
        price: 8,
        name: { ka: 'ფელამუში', en: 'Pelamushi', ru: 'Пеламуши' }
      },
      {
        id: 'walnut-cake',
        price: 10,
        name: { ka: 'ნუშის ნამცხვარი', en: 'Walnut Cake', ru: 'Ореховый торт' }
      },
      {
        id: 'fruit-salad',
        price: 7,
        name: { ka: 'ხილის სალათი', en: 'Fruit Salad', ru: 'Фруктовый салат' }
      }
    ]
  },
  {
    id: 'drinks',
    label: { ka: 'სასმელები', en: 'Drinks', ru: 'Напитки' },
    items: [
      {
        id: 'homemade-lemonade',
        price: 6,
        name: { ka: 'ლიმონათი ადგილობრივი', en: 'Homemade Lemonade', ru: 'Домашний лимонад' }
      },
      {
        id: 'tea-coffee',
        price: 4,
        name: { ka: 'ჩაი / ყავა', en: 'Tea / Coffee', ru: 'Чай / Кофе' }
      },
      {
        id: 'house-wine',
        price: 8,
        name: { ka: 'სამზარეულოს ღვინო (ჭიქა)', en: 'House Wine (glass)', ru: 'Домашнее вино (бокал)' }
      },
      {
        id: 'mineral-water',
        price: 3,
        name: { ka: 'მინერალური წყალი', en: 'Mineral Water', ru: 'Минеральная вода' }
      }
    ]
  }
];

export function findMenuItem(itemId: string): { item: MenuItem; categoryId: string } | null {
  for (const category of MENU_CATEGORIES) {
    const item = category.items.find((i) => i.id === itemId);
    if (item) return { item, categoryId: category.id };
  }
  return null;
}
