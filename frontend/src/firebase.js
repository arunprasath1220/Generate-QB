import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "Google API Key",
    authDomain: "qb-generator-37.firebaseapp.com",
    projectId: "qb-generator-37",
    storageBucket: "qb-generator-37.firebasestorage.app",
    messagingSenderId: "869711647349",
    appId: "1:869711647349:web:7087a2ce35ef9a45c71e3c",
    measurementId: "G-3PF6B2R718"
  };
  
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
    prompt: "select_account",
  });
export { auth, provider };
