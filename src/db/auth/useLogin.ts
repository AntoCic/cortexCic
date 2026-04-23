import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../store';
import { setUser } from './authSlice';
import { signInWithPopup, provider, auth } from '../../components/firebase/firebase';
import { getUserProfile } from '../users/userRepo';

export const useLogin = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const login = async () => {
    const result = await signInWithPopup(auth, provider);
    const userProfile = await getUserProfile(result.user.uid);
    dispatch(setUser({
      user: {
        uid: result.user.uid,
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
      },
      userProfile,
    }));
    void navigate(userProfile ? '/home' : '/complete-profile');
  };

  return login;
};
