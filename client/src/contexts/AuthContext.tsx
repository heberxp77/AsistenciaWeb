import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { auth, db, onAuthChange, doc, getDoc, setDoc, type FirebaseUser } from "@/lib/firebase";
import type { User, UserRoleType } from "@shared/schema";

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  isAreaManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUserData(userDoc.data() as User);
        } else {
          const newUser: User = {
            id: user.uid,
            email: user.email || "",
            displayName: user.displayName || "Usuario",
            role: "teacher" as UserRoleType,
            photoURL: user.photoURL || undefined,
            active: true,
            createdAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, newUser);
          setUserData(newUser);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isAdmin = userData?.role === "admin";
  const isTeacher = userData?.role === "teacher";
  const isAreaManager = userData?.role === "area_manager";

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    isAdmin,
    isTeacher,
    isAreaManager,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
