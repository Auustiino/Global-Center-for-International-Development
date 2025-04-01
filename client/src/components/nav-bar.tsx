import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Menu, LogOut, User as UserIcon, Code } from "lucide-react";

const NavBar = () => {
  const { user, logout, isAuthenticated, enableDevMode, isDevMode } = useAuth();
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Check URL for dev mode parameter
  useEffect(() => {
    const url = new URL(window.location.href);
    const devMode = url.searchParams.get('devMode');
    if (devMode === 'true' && !isDevMode) {
      enableDevMode();
    }
  }, [enableDevMode, isDevMode]);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Calls", path: "/calls" },
    { name: "History", path: "/history" },
    { name: "Settings", path: "/settings" },
    { name: "Developer Mode", onClick: enableDevMode, showDot: isDevMode },
  ];

  return (
    <nav className="bg-primary text-white shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <div className="text-xl font-bold cursor-pointer">LinguaConnect</div>
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map((item) => (
                  item.path ? (
                    <Link key={item.path} href={item.path}>
                      <span
                        className={`${
                          location === item.path
                            ? "bg-slate-800"
                            : "text-gray-300 hover:bg-slate-800 hover:text-white"
                        } px-3 py-2 rounded-md text-sm font-medium cursor-pointer`}
                      >
                        {item.name}
                      </span>
                    </Link>
                  ) : (
                    <button
                      key={item.name}
                      onClick={item.onClick}
                      className="text-gray-300 hover:bg-slate-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex items-center"
                    >
                      {item.name}
                      {item.showDot && (
                        <span className="ml-2 h-2 w-2 rounded-full bg-green-500"></span>
                      )}
                    </button>
                  )
                ))}
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center text-sm">
                      <span className="mr-2 text-white">
                        {user?.displayName || user?.username}
                      </span>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profilePicture || ""} />
                        <AvatarFallback>
                          {getInitials(user?.displayName || user?.username || "")}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setLocation("/profile")}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={async () => {
                        await login("developer", "password123");
                        enableDevMode();
                      }} 
                      className="relative"
                    >
                      <Code className="mr-2 h-4 w-4" />
                      <span>Developer Mode</span>
                      {isDevMode && (
                        <span className="absolute right-2 h-2 w-2 rounded-full bg-green-500"></span>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => setLocation("/signup")} variant="secondary">
                  Sign Up
                </Button>
              )}
            </div>
          </div>

          <div className="-mr-2 flex md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-slate-800 hover:text-white focus:outline-none"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>LinguaConnect</SheetTitle>
                  <SheetDescription>
                    Connect with anyone around the world
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 flex flex-col space-y-4">
                  {navItems.map((item) => (
                    <Link key={item.path} href={item.path}>
                      <span
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setIsOpen(false)}
                      >
                        {item.name}
                      </span>
                    </Link>
                  ))}
                  {isAuthenticated ? (
                    <>
                      <Link href="/profile">
                        <span
                          className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50 cursor-pointer"
                          onClick={() => setIsOpen(false)}
                        >
                          Profile
                        </span>
                      </Link>
                      <div className="border-t border-gray-200 my-2 pt-2">
                        <button
                          onClick={enableDevMode}
                          className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50"
                        >
                          <Code className="h-4 w-4 mr-2 text-slate-600" />
                          <span>Developer Mode</span>
                          {isDevMode && (
                            <span className="ml-2 h-2 w-2 rounded-full bg-green-500"></span>
                          )}
                        </button>
                      </div>
                      <Button onClick={handleLogout} variant="destructive" className="mt-4">
                        Logout
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => {
                        setLocation("/signup");
                        setIsOpen(false);
                      }}
                      className="mt-4"
                    >
                      Sign Up
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
