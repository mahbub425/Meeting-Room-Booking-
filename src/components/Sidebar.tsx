import React from "react";
import { Link } from "react-router-dom";
import { Calendar, Users, Building } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sidebar = () => {
  const navItems = [
    { name: "Calendar", icon: Calendar, path: "/dashboard" },
    { name: "User Management", icon: Users, path: "/admin/users" },
    { name: "Meeting Room Management", icon: Building, path: "/admin/rooms" },
  ];

  return (
    <aside className="w-64 bg-sidebar dark:bg-sidebar-background text-sidebar-foreground dark:text-sidebar-foreground border-r border-sidebar-border dark:border-sidebar-border p-4 flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-sidebar-primary dark:text-sidebar-primary-foreground">Dyad Rooms</h2>
      </div>
      <nav className="flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={cn(
                  "flex items-center p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground",
                  // Add active state styling here if needed based on current path
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};