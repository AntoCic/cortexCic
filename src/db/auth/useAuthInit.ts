import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../components/firebase/firebase';
import { useAppDispatch } from '../../store';
import { setUser, clearUser } from './authSlice';

export const useAuthInit = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        dispatch(setUser({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        }));
      } else {
        dispatch(clearUser());
      }
    });

    return () => {
      unsubscribe();
    };
  }, [dispatch]);
};
