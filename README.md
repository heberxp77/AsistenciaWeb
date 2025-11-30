# Sistema de Gestión de Asistencia Universitaria

Sistema web integral para la gestión de asistencia en universidades con soporte para múltiples roles de usuario (Administrador, Docente, Responsable de Área), registro de asistencia, justificaciones con documentos y reportes analíticos.

## 🎯 Características Principales

### Panel de Administración
- **Gestión de Catálogos**
  - Recintos universitarios
  - Escuelas y facultades
  - Carreras académicas
  - Grupos de clase
  - Gestión de docentes
  - Registro de estudiantes

### Módulo de Docentes
- **Control de Asistencia**
  - Pasar asistencia por grupo y fecha
  - Marcar como presente, ausente o justificado
  - Guardar y actualizar registros
  
- **Justificaciones**
  - Registrar justificaciones para inasistencias
  - Subir documentos de soporte (imágenes/PDFs)
  - Historial de justificaciones

### Dashboard de Responsables de Área
- **Visualización de Datos**
  - Estadísticas generales de asistencia
  - Gráficos de tendencias
  - Reportes por carrera y turno
  
- **Consultas Avanzadas**
  - Filtrar por recinto, escuela, carrera, grupo
  - Filtrar por docente, turno y estado
  - Rango de fechas personalizables
  
- **Reportes Detallados**
  - Asistencia por grupo
  - Comparativas entre programas
  - Identificación de grupos con bajo desempeño

### Características Transversales
- ✅ Autenticación con Google (Firebase Auth)
- ✅ Interfaz responsive y moderna
- ✅ Modo oscuro/claro
- ✅ Navegación por sidebar
- ✅ Validación de formularios con Zod
- ✅ Notificaciones en tiempo real
- ✅ Carga optimizada de datos

---

## 🏗️ Arquitectura

### Stack Tecnológico

**Frontend:**
- React 18 con TypeScript
- Vite (bundler)
- TailwindCSS + shadcn/ui (componentes)
- Wouter (enrutamiento)
- React Query (estado y datos)
- React Hook Form (formularios)
- Recharts (gráficos)

**Backend:**
- Express.js
- Firebase (Auth, Firestore, Storage)
- Drizzle ORM (tipado de datos)

**Base de Datos:**
- PostgreSQL (mediante Replit)
- Firestore (documentos)
- Firebase Storage (archivos)

---

## 📁 Estructura de Carpetas

```
proyecto/
├── client/                          # Frontend React
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppSidebar.tsx       # Navegación sidebar
│   │   │   ├── ThemeToggle.tsx      # Toggle tema oscuro/claro
│   │   │   └── ui/                  # Componentes shadcn/ui
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx      # Contexto de autenticación
│   │   │   └── ThemeContext.tsx     # Contexto de tema
│   │   ├── hooks/
│   │   │   └── use-toast.ts         # Hook para notificaciones
│   │   ├── lib/
│   │   │   ├── firebase.ts          # Configuración de Firebase
│   │   │   └── queryClient.ts       # Configuración React Query
│   │   ├── pages/
│   │   │   ├── Login.tsx            # Página de login
│   │   │   ├── admin/               # Páginas de administrador
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── CampusManagement.tsx
│   │   │   │   ├── SchoolManagement.tsx
│   │   │   │   ├── ProgramManagement.tsx
│   │   │   │   ├── GroupManagement.tsx
│   │   │   │   ├── TeacherManagement.tsx
│   │   │   │   └── StudentManagement.tsx
│   │   │   ├── teacher/             # Páginas de docentes
│   │   │   │   ├── TeacherDashboard.tsx
│   │   │   │   ├── TakeAttendance.tsx
│   │   │   │   └── Justifications.tsx
│   │   │   └── manager/             # Páginas de responsables
│   │   │       ├── ManagerDashboard.tsx
│   │   │       ├── Reports.tsx
│   │   │       └── AttendanceReports.tsx
│   │   ├── App.tsx                  # Componente raíz
│   │   ├── main.tsx                 # Entry point
│   │   └── index.css                # Estilos globales
│   ├── index.html
│   └── vite.config.ts
│
├── server/                          # Backend Express
│   ├── index.ts                     # Servidor principal
│   ├── routes.ts                    # Definición de rutas API
│   ├── storage.ts                   # Interfaz de almacenamiento
│   ├── vite.ts                      # Integración con Vite
│   └── db.ts                        # Conexión a base de datos
│
├── shared/                          # Código compartido
│   └── schema.ts                    # Modelos de datos (Drizzle)
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── drizzle.config.ts
```

---

## 🚀 Instalación y Setup

### Requisitos Previos
- Node.js 18+
- npm o yarn
- Cuenta de Firebase (para desarrollo local)
- Base de datos PostgreSQL (Replit proporciona una)

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd proyecto
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
Crea un archivo `.env.local` en la raíz del proyecto:
```env
# Firebase
VITE_FIREBASE_API_KEY=<tu-api-key>
VITE_FIREBASE_APP_ID=<tu-app-id>
VITE_FIREBASE_PROJECT_ID=<tu-project-id>

# Base de datos (Replit)
DATABASE_URL=<postgresql-connection-string>
SESSION_SECRET=<secret-key>
```

4. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:5000`

5. **Ejecutar migraciones de base de datos (si es necesario)**
```bash
npm run db:push
```

---

## 📖 Documentación del Frontend

### Estructura de Componentes

#### AuthContext (`client/src/contexts/AuthContext.tsx`)
Maneja la autenticación del usuario y proporciona datos de usuario a toda la aplicación.

**Hook: `useAuth()`**
```typescript
const { currentUser, userData, loading } = useAuth();
```
- `currentUser`: Usuario autenticado de Firebase
- `userData`: Datos adicionales del usuario (rol, etc.)
- `loading`: Estado de carga

#### ThemeContext (`client/src/contexts/ThemeContext.tsx`)
Maneja el tema oscuro/claro de la aplicación.

**Hook: `useTheme()`**
```typescript
const { theme, toggleTheme } = useTheme();
```

### Páginas por Rol

#### Login (`client/src/pages/Login.tsx`)
- Pantalla inicial de bienvenida
- Botón de login con Google
- Redirección automática según rol

#### Panel de Administrador

**AdminDashboard** - Panel principal con estadísticas
- Total de recintos, escuelas, carreras, grupos, docentes y estudiantes
- Accesos rápidos a cada módulo de gestión

**CampusManagement** - CRUD de recintos
- Crear, editar, eliminar recintos
- Búsqueda y filtrado
- Toggle de estado activo/inactivo

**SchoolManagement** - CRUD de escuelas
- Asociar escuelas a recintos
- Gestión completa de escuelas

**ProgramManagement** - CRUD de carreras
- Código y nombre de carrera
- Asociación con escuelas
- Validación de códigos únicos

**GroupManagement** - CRUD de grupos de clase
- Nombre, semestre, año
- Asociación con carrera y docente
- Selección de turno (matutino, vespertino, nocturno)

**TeacherManagement** - Gestión de docentes
- Crear y editar perfiles de docentes
- Asignación de roles
- Foto de perfil con Avatar

**StudentManagement** - Registro de estudiantes
- Matrícula, nombre, apellido
- Email y teléfono
- Asignación a grupos
- Filtrado por grupo

#### Módulo de Docentes

**TeacherDashboard** - Panel del docente
- Estadísticas de grupos asignados
- Vista rápida de información
- Acceso directo a pasar asistencia

**TakeAttendance** - Pasar asistencia
- Seleccionar grupo y fecha
- Interfaz de estudiantes con botones de estado
- Marcar todo como presente/ausente
- Visualización de estadísticas
- Guardar cambios con confirmación

**Justifications** - Gestionar justificaciones
- Formulario para crear justificaciones
- Upload de documentos (imágenes/PDF)
- Historial de justificaciones registradas
- Visualización de detalles

#### Dashboard de Responsables de Área

**ManagerDashboard** - Panel analítico
- Filtros avanzados (recinto, escuela, carrera, turno, período)
- Estadísticas generales
- Gráficos de tendencia de asistencia
- Comparativa de asistencia por turno

**Reports** - Reportes detallados
- Tendencia de asistencia en gráfico de líneas
- Comparativa por carrera en gráfico de barras
- Tabla de desempeño por grupo
- Identificación de mejores y peores grupos

**AttendanceReports** - Consulta de registros
- Filtros por múltiples criterios
- Búsqueda de estudiantes
- Vista de todos los registros de asistencia
- Descarga de datos

### Componentes de Interfaz (shadcn/ui)

La aplicación utiliza componentes pre-construidos de shadcn/ui:
- `Button` - Botones estilizados
- `Card` - Contenedores de información
- `Dialog` - Modales de formularios
- `Table` - Tablas de datos
- `Select` - Selectores dropdown
- `Input` - Campos de entrada
- `Badge` - Etiquetas de estado
- `Avatar` - Fotos de perfil
- `Progress` - Barras de progreso
- `Tooltip` - Información flotante

### React Query - Manejo de Datos

Todas las consultas a Firebase se manejan con React Query:

```typescript
import { useQuery } from "@tanstack/react-query";
import { db, getDocs, collection } from "@/lib/firebase";

const { data, isLoading, error } = useQuery({
  queryKey: ["/api/students"],
  queryFn: async () => {
    const snapshot = await getDocs(collection(db, "students"));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
});
```

### Formularios - React Hook Form

Todos los formularios usan React Hook Form con validación Zod:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const form = useForm({
  resolver: zodResolver(insertSchema),
  defaultValues: { name: "" }
});

const onSubmit = async (data) => {
  // Guardar en Firebase
};
```

---

## 🔧 Documentación del Backend

### Estructura de Express

#### `server/index.ts` - Servidor Principal
Inicializa el servidor Express en puerto 5000 con:
- Middlewares de parseo (JSON, URL-encoded)
- Configuración de CORS
- Integración con Vite en desarrollo
- Setup de rutas

```typescript
import express from "express";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rutas...

const port = 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

#### `server/routes.ts` - Definición de Rutas
Aquí se definen todos los endpoints API que sirven datos al frontend.

**Estructura de rutas:**
```
GET  /api/campuses              - Obtener todos los recintos
GET  /api/campuses/:id          - Obtener recinto específico
POST /api/campuses              - Crear recinto
PATCH /api/campuses/:id         - Actualizar recinto
DELETE /api/campuses/:id        - Eliminar recinto

GET  /api/attendance            - Obtener registros de asistencia
POST /api/attendance            - Crear registro
PATCH /api/attendance/:id       - Actualizar estado

GET  /api/justifications        - Obtener justificaciones
POST /api/justifications        - Crear justificación
```

### Almacenamiento - Firebase

#### `server/storage.ts` - Interfaz IStorage
Define las operaciones disponibles sobre los datos.

```typescript
interface IStorage {
  // Operaciones de lectura
  getCampuses(): Promise<Campus[]>;
  getStudents(): Promise<Student[]>;
  getGroups(): Promise<ClassGroup[]>;
  
  // Operaciones de escritura
  createCampus(data: CampusData): Promise<Campus>;
  updateCampus(id: string, data: CampusData): Promise<Campus>;
  deleteCampus(id: string): Promise<void>;
  
  // Operaciones de asistencia
  saveAttendance(records: AttendanceRecord[]): Promise<void>;
  getAttendanceRecords(date: string): Promise<AttendanceRecord[]>;
}
```

#### Colecciones de Firestore

```
firestore
├── campuses/          # Recintos
├── schools/           # Escuelas
├── programs/          # Carreras
├── classGroups/       # Grupos de clase
├── students/          # Estudiantes
├── users/             # Usuarios (docentes, admins)
├── attendanceRecords/ # Registros de asistencia
├── justifications/    # Justificaciones
└── sessions/          # Sesiones (Replit Auth)
```

#### Firebase Storage

Estructura de almacenamiento de archivos:
```
storage/
└── justifications/    # Documentos de justificación
    └── {timestamp}_{filename}
```

### Autenticación

#### Firebase Auth
La autenticación se configura en `client/src/lib/firebase.ts`:

```typescript
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // ...
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
```

**Flujo de login:**
1. Usuario hace clic en "Iniciar sesión con Google"
2. Se abre la ventana de Google OAuth
3. Firebase valida las credenciales
4. Se guarda el usuario en Firestore
5. Se redirige según el rol

### Modelos de Datos

Ver `shared/schema.ts` para tipos TypeScript:

```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: "admin" | "teacher" | "area_manager";
  active: boolean;
  createdAt: string;
}

interface Campus {
  id: string;
  name: string;
  address?: string;
  active: boolean;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  classGroupId: string;
  date: string;
  status: "present" | "absent" | "justified";
  teacherId: string;
  createdAt: string;
}

interface Justification {
  id: string;
  attendanceRecordId: string;
  studentId: string;
  note: string;
  documentUrl?: string;
  documentName?: string;
  createdAt: string;
}
```

### Validación de Datos

Usando Zod para validación:

```typescript
import { z } from "zod";

const campusSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  address: z.string().optional(),
  active: z.boolean().default(true)
});

type CampusInput = z.infer<typeof campusSchema>;
```

---

## 🔐 Seguridad

### Firebase Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo usuarios autenticados pueden acceder
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Límite a datos propios
    match /users/{userId} {
      allow read: if request.auth.uid == userId || 
                     isAdmin(request.auth.uid);
    }
  }
}
```

### Roles y Permisos

**Administrador:**
- ✅ Acceso a todos los módulos
- ✅ Crear/editar/eliminar catálogos
- ✅ Gestionar usuarios
- ✅ Ver reportes completos

**Docente:**
- ✅ Pasar asistencia de sus grupos
- ✅ Crear justificaciones
- ✅ Ver su propio dashboard
- ❌ Acceso a otros módulos

**Responsable de Área:**
- ✅ Ver dashboards y reportes
- ✅ Filtrar y consultar datos
- ✅ Exportar reportes
- ❌ Editar datos

---

## 🧪 Pruebas de Funcionalidad

### Pasos para Probar

1. **Login**
   - Haz clic en "Continuar con Google"
   - Selecciona una cuenta de prueba
   - Deberías ser redirigido al dashboard según tu rol

2. **Admin - Crear un Recinto**
   - Ve a "Administración" → "Recintos"
   - Haz clic en "Agregar Recinto"
   - Completa el formulario y guarda
   - Deberías ver el nuevo recinto en la lista

3. **Docente - Pasar Asistencia**
   - Ve a "Pasar Asistencia"
   - Selecciona un grupo y fecha
   - Marca estudiantes como presente/ausente
   - Haz clic en "Guardar Asistencia"

4. **Manager - Ver Reportes**
   - Ve a "Reportes"
   - Usa los filtros para ver datos específicos
   - Observa los gráficos de tendencia

---

## 📊 API Endpoints

### Operaciones CRUD

```
CAMPUSES
GET    /api/campuses              Listar todos
POST   /api/campuses              Crear
PATCH  /api/campuses/:id          Actualizar
DELETE /api/campuses/:id          Eliminar

SCHOOLS
GET    /api/schools
POST   /api/schools
PATCH  /api/schools/:id
DELETE /api/schools/:id

PROGRAMS
GET    /api/programs
POST   /api/programs
PATCH  /api/programs/:id
DELETE /api/programs/:id

CLASS GROUPS
GET    /api/groups
POST   /api/groups
PATCH  /api/groups/:id
DELETE /api/groups/:id

STUDENTS
GET    /api/students
POST   /api/students
PATCH  /api/students/:id
DELETE /api/students/:id

USERS
GET    /api/users
POST   /api/users
PATCH  /api/users/:id
DELETE /api/users/:id
```

### Operaciones de Asistencia

```
ATTENDANCE RECORDS
GET    /api/attendance?date=YYYY-MM-DD&groupId=...
POST   /api/attendance
PATCH  /api/attendance/:id

JUSTIFICATIONS
GET    /api/justifications
POST   /api/justifications
GET    /api/justifications/:id
```

---

## 🚨 Manejo de Errores

### En Frontend
```typescript
try {
  const response = await fetch("/api/students");
  if (!response.ok) {
    toast({
      title: "Error",
      description: "No se pudieron cargar los estudiantes",
      variant: "destructive"
    });
  }
} catch (error) {
  console.error("Error:", error);
}
```

### En Backend
```typescript
app.get("/api/students", async (req, res) => {
  try {
    const students = await storage.getStudents();
    res.json(students);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ 
      message: "Error al obtener estudiantes" 
    });
  }
});
```

---

## 📦 Dependencias Principales

### Frontend
- **react**: Framework UI
- **@tanstack/react-query**: Gestión de estado asíncrono
- **react-hook-form**: Manejo de formularios
- **zod**: Validación de esquemas
- **tailwindcss**: Estilos CSS
- **recharts**: Gráficos
- **wouter**: Enrutamiento
- **firebase**: Autenticación y base de datos

### Backend
- **express**: Framework web
- **firebase-admin**: Acceso administrativo a Firebase
- **passport**: Autenticación (para Replit Auth)
- **drizzle-orm**: ORM tipado

---

## 🌐 Deploying a Producción

### Replit
1. Conecta tu repositorio a Replit
2. Configura las variables de entorno en "Secrets"
3. Haz clic en "Deploy"
4. El sitio estará disponible en `https://<proyecto>.replit.dev`

### Otros Servidores
1. Ejecuta `npm run build`
2. Sube los archivos generados en `dist/`
3. Configura las variables de entorno
4. Inicia con `npm run start`

---

## 📝 Licencia

MIT

---

## 👥 Contribución

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

---

## 📞 Soporte

Para reportar bugs o sugerencias, abre un issue en el repositorio.

---

**Última actualización:** Noviembre 2025
