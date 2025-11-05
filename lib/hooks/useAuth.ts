"use client";

// Re-export the useAuth hook and types from AuthContext
// Redundancy because existing code uses this file and I'm not bothered by it
export { useAuth } from "../contexts/AuthContext";
export type { User } from "../types";
