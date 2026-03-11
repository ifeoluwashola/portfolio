import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudCog, ShieldCheck, TrendingDown } from "lucide-react";

export function ServicesGrid() {
  const services = [
    {
      title: "Infrastructure Cost Audit",
      description: "Comprehensive review focused on reducing AWS, Azure, and GCP spend without compromising performance or reliability.",
      icon: TrendingDown,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-400/10",
      borderColor: "border-emerald-400/20"
    },
    {
      title: "CI/CD Pipeline Hardening",
      description: "Automating secure deployment workflows to increase deployment speed while enforcing strict security standards.",
      icon: ShieldCheck,
      color: "text-sky-600 dark:text-sky-400",
      bgColor: "bg-sky-400/10",
      borderColor: "border-sky-400/20"
    },
    {
      title: "Cloud Native Migration",
      description: "Designing scalable, fault-tolerant architectures utilizing Kubernetes and modern containerization strategies.",
      icon: CloudCog,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-400/10",
      borderColor: "border-indigo-400/20"
    }
  ];

  return (
    <section id="services" className="py-24 sm:py-32 bg-background border-t border-border">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-sky-600 dark:text-sky-400">Consulting</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Specialized DevOps Services
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Targeted solutions to modernize your infrastructure, secure your deployments, and eliminate unneeded cloud expenses.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.title} className={`bg-card/50 backdrop-blur-sm border ${service.borderColor} hover:border-foreground/20 transition-colors duration-300`}>
                <CardHeader>
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${service.bgColor}`}>
                    <service.icon className={`h-6 w-6 ${service.color}`} aria-hidden="true" />
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-muted-foreground">
                    {service.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
