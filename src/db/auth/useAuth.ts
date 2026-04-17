import { useAppSelector } from "../../store";

export const useAuth = () => useAppSelector((s) => s.auth);
