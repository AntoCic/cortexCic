import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../store';
import { setUser } from './authSlice';
import { signInWithPopup, provider, auth } from '../../components/firebase/firebase';

export const useLogin = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const login = async () => {
    const result = await signInWithPopup(auth, provider);
    dispatch(setUser({
      uid: result.user.uid,
      displayName: result.user.displayName,
      email: result.user.email,
      photoURL: result.user.photoURL,
    }));
    void navigate('/home');
  };

  return login;
};
