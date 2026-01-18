import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Switch user role between player and coach
  app.patch("/api/auth/role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;
      
      if (!role || !['player', 'coach'].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be 'player' or 'coach'" });
      }
      
      // When switching to coach, we don't need a playerId
      // When switching to player, keep existing playerId if they have one
      const currentUser = await authStorage.getUser(userId);
      const playerId = role === 'player' ? currentUser?.playerId : null;
      
      const user = await authStorage.updateUserRole(userId, role, playerId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error switching role:", error);
      res.status(500).json({ message: "Failed to switch role" });
    }
  });
}
