import { z } from "zod";

// User roles in the system
export const UserRole = {
  ADMIN: "admin",
  TEACHER: "teacher",
  AREA_MANAGER: "area_manager",
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Shift types
export const Shift = {
  MORNING: "morning",
  AFTERNOON: "afternoon",
  EVENING: "evening",
} as const;

export type ShiftType = typeof Shift[keyof typeof Shift];

// Attendance status
export const AttendanceStatus = {
  PRESENT: "present",
  ABSENT: "absent",
  JUSTIFIED: "justified",
} as const;

export type AttendanceStatusType = typeof AttendanceStatus[keyof typeof AttendanceStatus];

// User schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  role: z.enum(["admin", "teacher", "area_manager"]),
  photoURL: z.string().optional(),
  active: z.boolean().default(true),
  createdAt: z.string(),
});

export type User = z.infer<typeof userSchema>;

export const insertUserSchema = userSchema.omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;

// Campus (Recinto) schema
export const campusSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "El nombre es requerido"),
  address: z.string().optional(),
  active: z.boolean().default(true),
});

export type Campus = z.infer<typeof campusSchema>;
export const insertCampusSchema = campusSchema.omit({ id: true });
export type InsertCampus = z.infer<typeof insertCampusSchema>;

// School (Escuela) schema
export const schoolSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "El nombre es requerido"),
  campusId: z.string(),
  active: z.boolean().default(true),
});

export type School = z.infer<typeof schoolSchema>;
export const insertSchoolSchema = schoolSchema.omit({ id: true });
export type InsertSchool = z.infer<typeof insertSchoolSchema>;

// Program (Carrera) schema
export const programSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "El nombre es requerido"),
  code: z.string().min(1, "El código es requerido"),
  schoolId: z.string(),
  active: z.boolean().default(true),
});

export type Program = z.infer<typeof programSchema>;
export const insertProgramSchema = programSchema.omit({ id: true });
export type InsertProgram = z.infer<typeof insertProgramSchema>;

// Class Group (Grupo de Clase) schema
export const classGroupSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "El nombre es requerido"),
  programId: z.string(),
  teacherId: z.string(),
  shift: z.enum(["morning", "afternoon", "evening"]),
  semester: z.string(),
  year: z.number(),
  active: z.boolean().default(true),
});

export type ClassGroup = z.infer<typeof classGroupSchema>;
export const insertClassGroupSchema = classGroupSchema.omit({ id: true });
export type InsertClassGroup = z.infer<typeof insertClassGroupSchema>;

// Student schema
export const studentSchema = z.object({
  id: z.string(),
  studentId: z.string().min(1, "La matrícula es requerida"),
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  classGroupId: z.string(),
  active: z.boolean().default(true),
});

export type Student = z.infer<typeof studentSchema>;
export const insertStudentSchema = studentSchema.omit({ id: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;

// Attendance Record schema
export const attendanceRecordSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  classGroupId: z.string(),
  date: z.string(),
  status: z.enum(["present", "absent", "justified"]),
  teacherId: z.string(),
  createdAt: z.string(),
});

export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;
export const insertAttendanceRecordSchema = attendanceRecordSchema.omit({ id: true, createdAt: true });
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;

// Justification schema
export const justificationSchema = z.object({
  id: z.string(),
  attendanceRecordId: z.string(),
  studentId: z.string(),
  note: z.string().min(1, "La nota es requerida"),
  documentUrl: z.string().optional(),
  documentName: z.string().optional(),
  approvedBy: z.string().optional(),
  approvedAt: z.string().optional(),
  createdAt: z.string(),
});

export type Justification = z.infer<typeof justificationSchema>;
export const insertJustificationSchema = justificationSchema.omit({ id: true, createdAt: true, approvedAt: true, approvedBy: true });
export type InsertJustification = z.infer<typeof insertJustificationSchema>;

// Helper types for UI
export interface ClassGroupWithDetails extends ClassGroup {
  program?: Program;
  teacher?: User;
  school?: School;
  campus?: Campus;
  studentCount?: number;
}

export interface StudentWithAttendance extends Student {
  attendanceRecords?: AttendanceRecord[];
  attendancePercentage?: number;
}

export interface AttendanceReportFilters {
  campusId?: string;
  schoolId?: string;
  programId?: string;
  classGroupId?: string;
  teacherId?: string;
  shift?: ShiftType;
  startDate?: string;
  endDate?: string;
}

export interface AttendanceStats {
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  justifiedCount: number;
  attendancePercentage: number;
}

// Shift labels for UI
export const shiftLabels: Record<ShiftType, string> = {
  morning: "Matutino",
  afternoon: "Vespertino",
  evening: "Nocturno",
};

// Status labels for UI
export const statusLabels: Record<AttendanceStatusType, string> = {
  present: "Presente",
  absent: "Ausente",
  justified: "Justificado",
};

// Role labels for UI
export const roleLabels: Record<UserRoleType, string> = {
  admin: "Administrador",
  teacher: "Docente",
  area_manager: "Responsable de Área",
};
