import { useLogout } from '../../db/auth/useLogout';

const HomeAuth = () => {
  const logout = useLogout();

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <button className="btn btn-outline-secondary btn-lg" onClick={() => { void logout(); }}>
        👋 Logout
      </button>
    </div>
  );
};

export default HomeAuth;
