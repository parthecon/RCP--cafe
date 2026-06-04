import { DUMMY_MENU } from './src/firebase/dummyData.js';

const API_KEY = "AIzaSyC6stZ221xgXd047PqikMz4kdgjkKIao6c";
const email = "admin@rcp.com";
const password = "admin123";

const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
const dbUrl = "https://rcp---cafe-default-rtdb.asia-southeast1.firebasedatabase.app/menu.json";

async function seed() {
  try {
    console.log(`Authenticating as ${email}...`);
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });

    const authData = await authResponse.json();
    if (!authResponse.ok) {
      throw new Error(`Authentication failed: ${authData.error?.message || JSON.stringify(authData)}`);
    }

    const idToken = authData.idToken;
    console.log("Authentication successful! Seeding menu items...");

    const initialMenu = {};
    DUMMY_MENU.forEach((item, index) => {
      const id = `menu_${index + 1}`;
      initialMenu[id] = {
        ...item,
        createdAt: Date.now()
      };
    });

    const dbResponse = await fetch(`${dbUrl}?auth=${idToken}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initialMenu)
    });

    const dbData = await dbResponse.json();
    if (dbResponse.ok) {
      console.log("Database seeded successfully with dummy menu items under authenticated rules!");
    } else {
      console.error("Failed to write to database:", dbData);
    }
  } catch (error) {
    console.error("Error during authentication or seeding:", error.message || error);
  }
}

seed();
