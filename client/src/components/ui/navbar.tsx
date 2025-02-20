import { Link, useLocation } from "wouter";
import { Button } from "./button";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, CreditCard, Home } from "lucide-react";

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">Nuvem Treinamentos</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/">
              <Button variant={location === "/" ? "secondary" : "ghost"} size="sm">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>
            <Link href="/billing">
              <Button variant={location === "/billing" ? "secondary" : "ghost"} size="sm">
                <CreditCard className="mr-2 h-4 w-4" />
                Planos
              </Button>
            </Link>
          </nav>
        </div>
        <div className="flex-1" />
        {user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        )}
      </div>
    </nav>
  );
}
