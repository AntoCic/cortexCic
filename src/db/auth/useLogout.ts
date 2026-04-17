import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../store';
import { clearUser } from './authSlice';
import { auth, signOut } from '../../components/firebase/firebase';

export const useLogout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const logout = async () => {
    await signOut(auth);
    dispatch(clearUser());
    void navigate('/');
  };

  return logout;
};
