import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-bold text-xl tracking-tight text-foreground flex items-center gap-2">
            <span className="text-emerald-500">⌘</span> Ifeoluwa
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8 items-center text-sm font-medium text-muted-foreground">
          <Link href="/#services" className="hover:text-emerald-500 transition-colors">Services</Link>
          <Link href="/#projects" className="hover:text-sky-500 transition-colors">Projects</Link>
          <Link href="/blog" className="hover:text-foreground transition-colors">Blogs</Link>
        </div>

        <div className="flex items-center gap-4">
          <ModeToggle />
          <Link href="/#contact" className="hidden md:inline-block">
            <Button variant="outline" className="border-border hover:bg-accent hover:text-accent-foreground">
              Book a Consultation
            </Button>
          </Link>

          {/* Mobile Navigation Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-10 w-10 text-foreground">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle mobile menu</span>
              </SheetTrigger>
              <SheetContent side="right" className="bg-background border-l border-border flex flex-col pt-16">
                <VisuallyHidden>
                  <SheetTitle>Mobile Navigation Menu</SheetTitle>
                </VisuallyHidden>
                <nav className="flex flex-col gap-6 text-lg font-medium">
                  <Link href="/#services" className="text-muted-foreground hover:text-emerald-500 transition-colors">
                    Services
                  </Link>
                  <Link href="/#projects" className="text-muted-foreground hover:text-sky-500 transition-colors">
                    Projects
                  </Link>
                  <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                    Blogs
                  </Link>
                  <div className="mt-4 pt-4 border-t border-border">
                    <Link href="/#contact" className="w-full inline-block">
                      <Button className="w-full bg-sky-500 hover:bg-sky-400 text-white">
                        Book a Consultation
                      </Button>
                    </Link>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
