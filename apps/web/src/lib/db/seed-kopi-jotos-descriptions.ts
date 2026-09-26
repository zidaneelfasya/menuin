import { db } from './index';
import { products, tenants } from './schema';
import { eq, ilike } from 'drizzle-orm';

const descriptionsByName: Record<string, string> = {
  'Nasi Goreng Kampung': 'Nasi goreng tradisional dengan bumbu rempah pilihan, suwiran ayam gurih, telur mata sapi, dan kerupuk renyah.',
  'Kopi Susu Gula Aren': 'Espresso house blend berpadu susu segar creamy dan manis legit gula aren murni khas Nusantara.',
  'Spaghetti Carbonara': 'Pasta al dente diselimuti saus krim gurih creamy dengan taburan smoked beef dan keju parmesan melimpah.',
  'Matcha Latte': 'Bubuk matcha premium Jepang berpadu susu segar dengan aroma teh hijau otentik yang menenangkan.',
  'New York Cheesecake': 'Kue keju panggang klasik dengan tekstur lembut creamy, kaya rasa keju, dan crust biskuit renyah.',
  'Mix Platter': 'Kombinasi sosis panggang, nugget ayam krispi, dan french fries gurih lengkap dengan cocolan saus spesial.',
  'Chicken Cordon Bleu': 'Dada ayam fillet berbalut tepung renyah dengan isian smoked beef dan lelehan keju mozzarella gurih.',
  'Thai Tea': 'Teh hitam khas Thailand bercita rasa pekat berpadu susu kental manis dan evaporated milk yang segar.',
  'Americano': 'Double shot espresso kaya crema dari biji kopi arabika pilihan diseduh dengan air panas murni.',
  'Truffle French Fries': 'Kentang goreng renyah beraroma truffle oil aromatik dengan taburan keju parmesan dan rempah herbs.',
  'Rice Bowl Chicken Teriyaki': 'Nasi hangat pulen dengan potongan ayam panggang empuk berlapis saus teriyaki manis gurih dan wijen sangrai.',
  'Caffe Latte': 'Perpaduan harmonis espresso aromatik dengan steamed milk lembut dan lapisan microfoam halus.',
  'Mocha Frappe': 'Ice blended espresso kaya rasa berpadu cokelat premium, susu segar, dan topping whipped cream lembut.',
  'Caramel Macchiato': 'Espresso bold berpadu susu vanilla lembut dengan lelehan sirup saus karamel manis legit di atasnya.',
  'Cookies & Cream Frappe': 'Minuman blender segar biskuit vanila cokelat renyah dengan susu krim tebal dan saus cokelat manis.',
  'Lychee Tea': 'Seduhan teh segar beraroma buah leci manis menyegarkan dengan buah leci asli di dalamnya.',
  'Taro Latte': 'Minuman lembut rasa ubi taro ungu bercita rasa manis gurih khas yang memanjakan lidah.',
  'Butter Croissant': 'Pastry Prancis klasik berlapis-lapis dengan aroma mentega Prancis harum, renyah di luar dan lembut di dalam.',
};

async function main() {
  console.log('--- Updating Descriptions for KOPI JOTOS ---');
  const matchedTenants = await db.select().from(tenants).where(ilike(tenants.slug, 'kopijotos'));
  if (matchedTenants.length === 0) {
    console.error('Outlet kopijotos not found!');
    process.exit(1);
  }

  const tenant = matchedTenants[0];
  console.log(`Outlet: ${tenant.name} (${tenant.id})`);

  const tenantProducts = await db.select().from(products).where(eq(products.tenantId, tenant.id));
  console.log(`Found ${tenantProducts.length} products.`);

  for (const prod of tenantProducts) {
    const desc = descriptionsByName[prod.name] || 'Menu pilihan istimewa dengan bahan berkualitas dan racikan rasa terbaik.';
    await db.update(products)
      .set({ description: desc })
      .where(eq(products.id, prod.id));
    console.log(`Updated [${prod.name}] => ${desc}`);
  }

  console.log('--- ALL DESCRIPTIONS SEEDED SUCCESSFULLY! ---');
  process.exit(0);
}

main().catch(err => {
  console.error('Error seeding descriptions:', err);
  process.exit(1);
});
