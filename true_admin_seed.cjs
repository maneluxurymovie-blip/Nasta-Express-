
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

// Initialize with environment defaults (should work on GCP)
const app = initializeApp({
  projectId: config.projectId
});

const SEED_DATA = [
  { name: 'Samosa', category: 'Snacks', description: 'Crispy golden triangles filled with spicy potato mash.', price: 20, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800' },
  { name: 'Pani Puri', category: 'Snacks', description: 'Crispy hollow puris filled with spicy tangy water and mash.', price: 40, imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800' },
  { name: 'Dokhla', category: 'Snacks', description: 'Soft and spongy steamed savory cake from Gujarat.', price: 30, imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=800' },
  { name: 'Vada pav', category: 'Snacks', description: 'The legendary Mumbai street burger with spicy potato vada.', price: 15, imageUrl: 'https://images.unsplash.com/photo-1626509135522-5492424b9f30?auto=format&fit=crop&q=80&w=800' },
  { name: 'Jilebi', category: 'Sweets', description: 'Deep-fried swirls soaked in saffron sugar syrup.', price: 50, imageUrl: 'https://images.unsplash.com/photo-1589119642340-9753e1a0b5c1?auto=format&fit=crop&q=80&w=800' },
  { name: 'Kachori', category: 'Snacks', description: 'Flaky pastry filled with spicy lentils or onions.', price: 25, imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=800' },
  { name: 'Idli Dosa', category: 'Snacks', description: 'Traditional South Indian fermented rice and lentil delight.', price: 60, imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800' },
  { name: 'Chinese bhel', category: 'Snacks', description: 'Indo-Chinese fusion with crispy noodles and spicy sauce.', price: 45, imageUrl: 'https://images.unsplash.com/photo-1512058560366-cd2427ff56f3?auto=format&fit=crop&q=80&w=800' },
  { name: 'Shivpuri pani puri', category: 'Snacks', description: 'Loaded puris topped with potatoes, onions, chutneys, and sev.', price: 50, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800' },
  { name: 'bread 🍞', category: 'Snacks', description: 'Freshly baked bread, perfect for toast or sandwiches.', price: 35, imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800' },
  { name: 'Biscuit', category: 'Snacks', description: 'Crunchy and delicious tea-time biscuits.', price: 10, imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=800' },
  { name: 'Manchurian suap', category: 'Snacks', description: 'Spicy and tangy Indo-Chinese soup with veg dumplings.', price: 70, imageUrl: 'https://images.unsplash.com/photo-1547592115-6309babc1a1d?auto=format&fit=crop&q=80&w=800' },
  { name: 'Pohe', category: 'Snacks', description: 'Light and fluffy flattened rice with peanuts and spices.', price: 25, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800' },
  { name: 'Upma', category: 'Snacks', description: 'Savory semolina porridge with vegetables.', price: 30, imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=800' },
  { name: 'Momos', category: 'Snacks', description: 'Steamed dumplings with savory vegetable filling.', price: 80, imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c170db06?auto=format&fit=crop&q=80&w=800' },
  { name: 'Dabeli', category: 'Snacks', description: 'Spicy and sweet potato filling in a bun with pomegranate.', price: 20, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800' },
  { name: 'Burger', category: 'Snacks', description: 'Classic vegetable patty burger with fresh lettuce.', price: 90, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800' },
  { name: 'pizza', category: 'Snacks', description: 'Cheesy vegetable pizza with Italian herbs.', price: 199, imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800' },
  { name: 'Black Gulaab jamun', category: 'Sweets', description: 'Deep fried milk dumplings in cardamom syrup.', price: 15, imageUrl: 'https://images.unsplash.com/photo-1589119642340-9753e1a0b5c1?auto=format&fit=crop&q=80&w=800' },
  { name: 'White gulaab jamun', category: 'Sweets', description: 'Soft and white milk dumplings in light syrup.', price: 15, imageUrl: 'https://images.unsplash.com/photo-1589119642340-9753e1a0b5c1?auto=format&fit=crop&q=80&w=800' },
  { name: 'Rasgulle', category: 'Sweets', description: 'Spongy white cheese dumplings in sugar syrup.', price: 20, imageUrl: 'https://images.unsplash.com/photo-1589119642340-9753e1a0b5c1?auto=format&fit=crop&q=80&w=800' },
  { name: 'Kaju katri', category: 'Sweets', description: 'Premium cashew fudge with silver leaf.', price: 800, imageUrl: 'https://images.unsplash.com/photo-1589119642340-9753e1a0b5c1?auto=format&fit=crop&q=80&w=800' },
];

async function seed(dbId, label) {
  console.log(`--- ADMIN SEED: ${label} ---`);
  try {
    const db = getFirestore(app, dbId);
    
    // Purge
    const products = await db.collection('products').get();
    for (const d of products.docs) { await d.ref.delete(); }
    const categories = await db.collection('categories').get();
    for (const d of categories.docs) { await d.ref.delete(); }

    const catMap = {};
    for (const name of ['Snacks', 'Sweets']) {
      const ref = await db.collection('categories').add({ name });
      catMap[name] = ref.id;
    }

    for (const item of SEED_DATA) {
      await db.collection('products').add({
        ...item,
        categoryId: catMap[item.category],
        isAvailable: true,
        isPopular: false,
        isSpecial: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    }
    console.log(`COMPLETED: ${label}`);
  } catch (e) {
    console.error(`FAILED: ${label} - ${e.message}`);
  }
}

async function run() {
  await seed(config.firestoreDatabaseId, 'NAMED_DB');
  await seed('(default)', 'DEFAULT_DB');
  process.exit(0);
}

run();
