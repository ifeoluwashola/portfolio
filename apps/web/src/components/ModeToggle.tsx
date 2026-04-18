"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function ModeToggle({ variant = "default" }: { variant?: "default" | "academy" }) {
  const { setTheme } = useTheme()
  const isAcademy = variant === "academy"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger 
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "border-white/10 bg-transparent transition-all",
          isAcademy 
            ? "hover:bg-yellow-500/10 hover:border-yellow-500/50 text-yellow-500" 
            : "hover:bg-white/5 dark:hover:bg-white/10"
        )}
      >
        <Sun className={cn(
          "h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0",
          isAcademy ? "text-yellow-500" : "text-foreground"
        )} />
        <Moon className={cn(
          "absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100",
          isAcademy ? "text-yellow-500" : "text-foreground"
        )} />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
