import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const auth = getAuth();
const provider = new GoogleAuthProvider();

const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    
    const name = user.displayName;
    const email = user.email;
    const photoURL = user.photoURL; 

    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Photo URL:', photoURL);

    
  } catch (error) {
    console.error('Google Sign-In Error:', error);
  }
};
