import { useEffect } from "react";
import { useLocation } from "wouter";
import { getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { auth, signInWithGoogle } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap } from "lucide-react";
import { SiGoogle } from "react-icons/si";

export default function Login() {
  const { currentUser, userData, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          toast({
            title: "Bienvenido",
            description: "Has iniciado sesión correctamente.",
          });
        }
      })
      .catch((error) => {
        console.error("Error en redirect:", error);
        toast({
          title: "Error de autenticación",
          description: error.message,
          variant: "destructive",
        });
      });
  }, [toast]);

  useEffect(() => {
    if (!loading && currentUser && userData) {
      if (userData.role === "admin") {
        setLocation("/admin");
      } else if (userData.role === "teacher") {
        setLocation("/teacher");
      } else if (userData.role === "area_manager") {
        setLocation("/manager");
      }
    }
  }, [currentUser, userData, loading, setLocation]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-4">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Sistema de Asistencia</h1>
          <p className="text-muted-foreground mt-2">Universidad - Control de Asistencia Académica</p>
        </div>

        <Card className="border-card-border">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Iniciar Sesión</CardTitle>
            <CardDescription>
              Accede con tu cuenta institucional de Google
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <Button
              variant="outline"
              className="w-full gap-3 h-12 text-base"
              onClick={handleGoogleLogin}
              data-testid="button-google-login"
            >
              <SiGoogle className="h-5 w-5" />
              Continuar con Google
            </Button>
            <p className="text-xs text-center text-muted-foreground px-4">
              Al iniciar sesión, aceptas los términos de uso y la política de privacidad de la institución.
            </p>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Plataforma exclusiva para personal autorizado
          </p>
        </div>
      </div>
    </div>
  );
}
