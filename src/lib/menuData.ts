export interface MenuItem {
  id: string;
  price: number;
  name: { ka: string; en: string; ru: string };
  description_ka?: string;
  description_en?: string;
  description_ru?: string;
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
        name: { ka: "ხაჭაპური აჭარული", en: "Adjarian khachapuri", ru: "Хачапури по-аджарски" },
        description_ka: "ნავისებრი ცომი დნობადი ყველით, კარაქითა და კვერცხის გულით შუაში — აჭარის სავიზიტო ბარათი.",
        description_en: "Boat-shaped bread filled with melted cheese, topped with butter and an egg yolk — the signature dish of Adjara.",
        description_ru: "Хлеб-лодочка с тянущимся сыром, сливочным маслом и желтком — визитная карточка Аджарии."
      },
      {
        id: 'khinkali',
        price: 12,
        name: { ka: "ხინკალი (5 ცალი)", en: "Khinkali (5 pcs)", ru: "Хинкали (5 шт.)" },
        description_ka: "ხელით ნაკეცი ცომის ჩანთები წვნიანი ხორცის შიგთავსით. ჭამენ ხელით, ჯერ წვენს სვამენ.",
        description_en: "Hand-pleated dumplings with a juicy meat filling. Eat them by hand and sip the broth first.",
        description_ru: "Защипанные вручную «мешочки» из теста с сочной мясной начинкой. Едят руками, сначала выпивая бульон."
      },
      {
        id: 'mtsvadi',
        price: 22,
        name: { ka: "მწვადი", en: "Mtsvadi", ru: "Мцвади" },
        description_ka: "ხორცის მწვადი ცეცხლზე, ხახვით და ახალი მწვანილით.",
        description_en: "Georgian-style skewered meat grilled over an open fire, served with onion and fresh herbs.",
        description_ru: "Шашлык по-грузински на открытом огне, с луком и свежей зеленью."
      },
      {
        id: 'chakapuli',
        price: 20,
        name: { ka: "ჩაქაფული", en: "Chakapuli", ru: "Чакапули" },
        description_ka: "ხორცი თეთრ ღვინოში, ტყემლით, ტარხუნითა და მწვანილით მოხარშული — მჟავე-არომატული ქართული კერძი.",
        description_en: "Meat stewed in white wine with tkemali plum, tarragon and herbs — a tangy, fragrant Georgian stew.",
        description_ru: "Мясо, тушённое в белом вине с ткемали, тархуном и зеленью, — кисловатое ароматное грузинское блюдо."
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
        name: { ka: "ომლეტი ბოსტნეულით", en: "Vegetable omelette", ru: "Омлет с овощами" },
        description_ka: "ფაფუკი ომლეტი ახალი ბოსტნეულით, ჩვენი ბაღიდან სეზონის მიხედვით.",
        description_en: "Fluffy omelette with fresh vegetables, from our garden when in season.",
        description_ru: "Пышный омлет со свежими овощами, в сезон — с нашего огорода."
      },
      {
        id: 'khacho-bread',
        price: 8,
        name: { ka: "ხაჭო პურით", en: "Cottage cheese with bread", ru: "Творог с хлебом" },
        description_ka: "სოფლის ახალი ხაჭო თბილ პურთან ერთად.",
        description_en: "Fresh village cottage cheese served with warm bread.",
        description_ru: "Свежий деревенский творог с тёплым хлебом."
      },
      {
        id: 'honey-matsoni',
        price: 7,
        name: { ka: "თაფლი და მაწონი", en: "Honey and matsoni", ru: "Мёд и мацони" },
        description_ka: "ადგილობრივი მთის თაფლი და ქართული მაწონი — მსუბუქი და ტკბილი საუზმე.",
        description_en: "Local mountain honey with Georgian matsoni (yoghurt) — a light, sweet breakfast.",
        description_ru: "Местный горный мёд и грузинский мацони — лёгкий сладкий завтрак."
      },
      {
        id: 'lobiani',
        price: 8,
        name: { ka: "ლობიანი", en: "Lobiani", ru: "Лобиани" },
        description_ka: "გამომცხვარი პური შეზავებული ლობიოს შიგთავსით.",
        description_en: "Baked bread filled with seasoned mashed beans.",
        description_ru: "Печёный хлеб с пряной фасолевой начинкой."
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
        name: { ka: "ბადრიჯნის სალათი", en: "Eggplant salad", ru: "Салат из баклажанов" },
        description_ka: "შემწვარი ბადრიჯანი ნიგვზით, ნიორით და მწვანილით.",
        description_en: "Fried eggplant with walnuts, garlic and herbs.",
        description_ru: "Жареные баклажаны с грецким орехом, чесноком и зеленью."
      },
      {
        id: 'fresh-vegetable-salad',
        price: 8,
        name: { ka: "ხელნაკეთი სალათი ბოსტნეულით", en: "Fresh vegetable salad", ru: "Салат из свежих овощей" },
        description_ka: "პომიდორი, კიტრი, ხახვი და მწვანილი, შეკაზმული ზეთით.",
        description_en: "Tomatoes, cucumbers, onion and herbs, dressed with oil.",
        description_ru: "Помидоры, огурцы, лук и зелень с заправкой из масла."
      },
      {
        id: 'pkhali',
        price: 10,
        name: { ka: "ფხალი", en: "Pkhali", ru: "Пхали" },
        description_ka: "დაჭრილი ბოსტნეული ან მწვანილი ნიგვზითა და სანელებლებით.",
        description_en: "Chopped greens or vegetables blended with walnuts and spices.",
        description_ru: "Рубленые овощи или зелень с грецким орехом и специями."
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
        name: { ka: "სოკოს კერძი", en: "Mushroom dish", ru: "Блюдо из грибов" },
        description_ka: "ტყის სოკო, მომზადებული ქართულად — სეზონის მიხედვით.",
        description_en: "Forest mushrooms cooked the Georgian way, depending on the season.",
        description_ru: "Лесные грибы, приготовленные по-грузински, — в зависимости от сезона."
      },
      {
        id: 'lobio',
        price: 12,
        name: { ka: "ლობიო ქვაბში", en: "Lobio in a clay pot", ru: "Лобио в горшочке" },
        description_ka: "ლობიო თიხის ქვაბში, მწვანილითა და სანელებლებით, მჭადთან ერთად.",
        description_en: "Bean stew slow-cooked in a clay pot with herbs and spices, served with cornbread.",
        description_ru: "Фасоль, томлённая в глиняном горшочке с зеленью и специями, подаётся с кукурузной лепёшкой."
      },
      {
        id: 'bulgur-vegetables',
        price: 11,
        name: { ka: "ცოცხალი ბურღული", en: "Bulgur dish", ru: "Блюдо из булгура" },
        description_ka: "ბურღული ბოსტნეულითა და მწვანილით.",
        description_en: "Bulgur wheat with vegetables and herbs.",
        description_ru: "Булгур с овощами и зеленью."
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
        name: { ka: "ფელამუში", en: "Pelamushi", ru: "Пеламуши" },
        description_ka: "ყურძნის ტკბილისგან მომზადებული ტრადიციული ქართული დესერტი ნიგვზით.",
        description_en: "Traditional Georgian dessert made from grape juice, topped with walnuts.",
        description_ru: "Традиционный грузинский десерт из виноградного сока с грецким орехом."
      },
      {
        id: 'walnut-cake',
        price: 10,
        name: { ka: "ნუშის ნამცხვარი", en: "Almond cake", ru: "Миндальный пирог" },
        description_ka: "შინ გამომცხვარი ნამცხვარი ნუშით.",
        description_en: "Homemade cake baked with almonds.",
        description_ru: "Домашний пирог с миндалём."
      },
      {
        id: 'fruit-salad',
        price: 7,
        name: { ka: "ხილის სალათი", en: "Fruit salad", ru: "Фруктовый салат" },
        description_ka: "სეზონური ხილი.",
        description_en: "Fresh seasonal fruit.",
        description_ru: "Свежие сезонные фрукты."
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
        name: { ka: "ლიმონათი ადგილობრივი", en: "Local lemonade", ru: "Местный лимонад" },
        description_ka: "ქართული ლიმონათი — მსხალი, ტარხუნა ან სხვა გემოები.",
        description_en: "Georgian lemonade — pear, tarragon and other flavours.",
        description_ru: "Грузинский лимонад — груша, тархун и другие вкусы."
      },
      {
        id: 'tea-coffee',
        price: 4,
        name: { ka: "ჩაი / ყავა", en: "Tea / Coffee", ru: "Чай / Кофе" },
        description_ka: "ცხელი ჩაი ან ყავა.",
        description_en: "Hot tea or coffee.",
        description_ru: "Горячий чай или кофе."
      },
      {
        id: 'house-wine',
        price: 8,
        name: { ka: "სახლის ღვინო (ჭიქა)", en: "House wine (glass)", ru: "Домашнее вино (бокал)" },
        description_ka: "ადგილობრივი სახლის ღვინო ჭიქით.",
        description_en: "Local house wine by the glass.",
        description_ru: "Местное домашнее вино в бокалах."
      },
      {
        id: 'mineral-water',
        price: 3,
        name: { ka: "მინერალური წყალი", en: "Mineral water", ru: "Минеральная вода" },
        description_ka: "ქართული მინერალური წყალი.",
        description_en: "Georgian mineral water.",
        description_ru: "Грузинская минеральная вода."
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
