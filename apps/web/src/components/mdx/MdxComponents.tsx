import React from "react";
import Link from "next/link";
import remarkGfm from "remark-gfm";

export const mdxOptions = {
  mdxOptions: {
    remarkPlugins: [remarkGfm],
  },
};

export const mdxComponents = {
  table: ({ children, className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div className="my-8 w-full overflow-x-auto rounded-xl border border-border bg-card/50 shadow-sm backdrop-blur-xs">
      <table className={`w-full text-left text-sm text-foreground divide-y divide-border border-collapse ${className || ""}`} {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className={`bg-muted/80 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border ${className || ""}`} {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody className={`divide-y divide-border/60 bg-transparent ${className || ""}`} {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className={`transition-colors hover:bg-muted/30 odd:bg-transparent even:bg-muted/10 ${className || ""}`} {...props}>
      {children}
    </tr>
  ),
  th: ({ children, className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className={`px-4 py-3.5 text-left font-semibold text-foreground whitespace-nowrap ${className || ""}`} {...props}>
      {children}
    </th>
  ),
  td: ({ children, className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className={`px-4 py-3 text-foreground/90 align-middle leading-relaxed ${className || ""}`} {...props}>
      {children}
    </td>
  ),
  a: ({ href, children, className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-yellow-400 hover:text-yellow-300 underline underline-offset-4 transition-colors ${className || ""}`}
          {...props}
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        href={href || "#"}
        className={`text-yellow-400 hover:text-yellow-300 underline underline-offset-4 transition-colors ${className || ""}`}
        {...props}
      >
        {children}
      </Link>
    );
  },
};
