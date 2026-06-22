import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ 
          message: "Your session has expired. Please log in again.",
          type: "session_expired"
        });
      }

      const userRaw = await authStorage.getUser(userId);
      const user = userRaw ? (({ passwordHash, ...rest }) => rest)(userRaw as any) : null;

      if (!user) {
        return res.status(404).json({ 
          message: "User account not found. Please sign up.",
          type: "user_not_found"
        });
      }

      // Check if user has profile data
      if (!user.role) {
        return res.status(200).json({
          ...user,
          _warning: "incomplete_profile"
        });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ 
        message: "Server error. Please try again later.",
        type: "server_error"
      });
    }
  });

  // Switch user role between player and coach
  app.patch("/api/auth/role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ 
          message: "Your session has expired. Please log in again.",
          type: "session_expired"
        });
      }

      const { role } = req.body;
      
      if (!role || !['player', 'coach', 'recruiter', 'guardian'].includes(role)) {
        return res.status(400).json({ 
          message: "Invalid role selection. Please choose 'player', 'coach', 'recruiter', or 'guardian'.",
          type: "invalid_role"
        });
      }
      
      // Always preserve the playerId when switching roles
      // This allows users to switch between player/coach without losing their player profile
      const currentUser = await authStorage.getUser(userId);
      
      if (!currentUser) {
        return res.status(401).json({ 
          message: "Your session has expired. Please log in again.",
          type: "session_expired"
        });
      }

      const playerId = currentUser?.playerId ?? null;
      
      const user = await authStorage.updateUserRole(userId, role, playerId);
      if (!user) {
        return res.status(404).json({ 
          message: "User not found. Please try logging in again.",
          type: "user_not_found"
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error switching role:", error);
      res.status(500).json({ 
        message: "Failed to switch roles. Please try again.",
        type: "server_error"
      });
    }
  });

  // POST /api/auth/verify-email - Mark email as verified (self-verification; extend with token flow when email service is available)
  app.post("/api/auth/verify-email", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      await authStorage.updateUser(userId, { emailVerified: true });
      res.json({ success: true, message: "Email verified" });
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // Logout route - with proper error handling
  app.get("/api/logout", (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(200).json({ message: "Already logged out" });
      }

      req.logout((err: any) => {
        if (err) {
          console.error("Error during logout:", err);
          return res.status(500).json({ 
            message: "Failed to log out. Please try clearing your browser cache.",
            type: "logout_error"
          });
        }
        res.status(200).json({ message: "Logged out successfully" });
      });
    } catch (error) {
      console.error("Unexpected error during logout:", error);
      res.status(500).json({ 
        message: "An unexpected error occurred during logout.",
        type: "server_error"
      });
    }
  });
}
