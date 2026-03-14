import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-card">
      <div className="flex h-16 items-center justify-between px-6">
        <Link href="/" className="text-xl font-bold flex items-center gap-2">
          <span className="text-emerald-500">⌘</span> Ifeoluwa
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8 items-center text-sm font-medium text-muted-foreground">
          <Link href="/#services" className="hover:text-foreground transition-colors">Services</Link>
          <Link href="/#projects" className="hover:text-foreground transition-colors">Projects</Link>
          <Link href="/blog" className="hover:text-foreground transition-colors">Blogs</Link>
        </div>

        <div className="flex items-center gap-3">
          <ModeToggle />
          <Link href="/#contact" className="hidden md:inline-block">
            <Button variant="outline" className="border-border hover:bg-accent hover:text-accent-foreground">
              Book a Consultation
            </Button>
          </Link>

          {/* Mobile Navigation Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger className="p-2 -mr-2 text-foreground">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle mobile menu</span>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0 flex flex-col bg-card border-l border-border">
                <VisuallyHidden>
                  <SheetTitle>Mobile Navigation Menu</SheetTitle>
                  <SheetDescription>Main navigation for the portfolio site</SheetDescription>
                </VisuallyHidden>
                <div className="p-6 border-b border-border">
                  <Link href="/" className="text-xl font-bold flex items-center gap-2">
                    <span className="text-emerald-500">⌘</span> Ifeoluwa
                  </Link>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                  <Link href="/#services" className="flex items-center px-4 py-3 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors font-medium">
                    Services
                  </Link>
                  <Link href="/#projects" className="flex items-center px-4 py-3 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors font-medium">
                    Projects
                  </Link>
                  <Link href="/blog" className="flex items-center px-4 py-3 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors font-medium">
                    Blogs
                  </Link>
                </nav>
                <div className="p-4 border-t border-border">
                  <Link href="/#contact" className="w-full inline-block">
                    <Button className="w-full bg-sky-500 hover:bg-sky-400 text-white rounded-md">
                      Book a Consultation
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
