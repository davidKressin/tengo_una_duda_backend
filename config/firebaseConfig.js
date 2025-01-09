// firebaseConfig.js

const { initializeApp } = require('firebase/app');
const { getDatabase } = require('firebase/database'); // Por ejemplo, para Realtime Database

const firebaseConfig = {
    apiKey: "AIzaSyBAKhDeCZxmlCnq3Jkfs82szefJmn7KWTY",
    authDomain: "tengo-una-duda-a04ae.firebaseapp.com",
    databaseURL: "https://tengo-una-duda-a04ae-default-rtdb.firebaseio.com",
    projectId: "tengo-una-duda-a04ae",
    storageBucket: "tengo-una-duda-a04ae.appspot.com",
    messagingSenderId: "155765995446",
    appId: "1:155765995446:web:b01fb285c49434a84fb317",
    measurementId: "G-6HHD53SHQ0"
  };

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

module.exports = { app, database }; // Exportar la app y la base de datos si las necesitas en otros archivos