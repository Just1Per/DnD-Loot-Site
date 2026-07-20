import {initializeApp} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {getFirestore} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDyj69qiEnkKk4lZjleGnvFEGUvLcSZIk",
    authDomain: "dnd-loot-site.firebaseapp.com",
    projectId: "dnd-loot-site",
    storageBucket: "dnd-loot-site.firebasestorage.app",
    messagingSenderId: "345641251366",
    appId: "1:345641251366:web:081fe07bc2cc859901ace7",
    measurementId: "G-ZHNPHYLDJ0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);