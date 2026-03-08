"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Check, Flame, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type PricingPlan = {
  plan_name: string;
  plan_descp: string;
  plan_price: number;
  plan_feature: string[];
  plan_recommended: boolean;
};

const pricingData: PricingPlan[] = [
  {
    plan_name: "Starter",
    plan_descp:
      "Perfect for small teams and events. Get started with essential certificate generation features.",
    plan_price: 1500,
    plan_feature: [
      "Up to 500 certificates/month",
      "Basic certificate templates",
      "Email delivery system",
      "Certificate verification portal",
      "Community support",
      "Standard security features",
    ],
    plan_recommended: false,
  },
  {
    plan_name: "Professional",
    plan_descp:
      "Scale faster with advanced features, custom templates, and priority support for growing organizations.",
    plan_price: 400000,
    plan_feature: [
      "Up to 5,000 certificates/month",
      "Custom certificate templates",
      "Advanced analytics dashboard",
      "Bulk upload & generation",
      "Priority email support",
      "API access & webhooks",
    ],
    plan_recommended: true,
  },
  {
    plan_name: "Enterprise",
    plan_descp:
      "Unlimited scale with white-label solution, dedicated support, and custom integrations for large enterprises.",
    plan_price: 5000,
    plan_feature: [
      "Unlimited certificates",
      "White-label solution",
      "Dedicated account manager",
      "Custom integrations",
      "99.9% SLA guarantee",
      "Advanced security & compliance",
    ],
    plan_recommended: false,
  },
];

const Pricing = () => {
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const router = useRouter();

  // @ts-ignore - Framer Motion variants type issue with ease property
  const pricingCardVariants = {
    hidden: {
      opacity: 0,
      x: -60,
    },
    visible: (index: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: index * 0.25,
        duration: 0.6,
        ease: [0.42, 0, 0.58, 1] as any,
      },
    }),
  };

  return (
    <section className=" py-10 lg:py-0">
      <div className="max-w-7xl mx-auto px-4 xl:px-16 lg:py-20 sm:py-16 py-8">
        <div className="flex flex-col gap-8 md:gap-12 items-center justify-center w-full">
          {/* Heading */}
          <div className="flex flex-col gap-4 justify-center items-center">
            {/* Badge */}
            <Badge
              variant={"outline"}
              className="py-1 px-3 text-sm font-normal leading-5 w-fit h-7"
            >
              Pricing
            </Badge>
            {/* Heading */}
            <div className="max-w-3xs sm:max-w-md mx-auto text-center">
              <h2 className="text-foreground text-3xl sm:text-5xl font-medium">
                Choose Your Plan
              </h2>
              <p className="text-muted-foreground mt-4 text-base">
                Request access to get custom pricing for your organization
              </p>
            </div>
          </div>
          {/*  */}
          <div className="flex flex-col lg:flex-row gap-6 items-stretch h-full w-full">
            {pricingData.map((plan: PricingPlan, index: number) => {
              const isFeatured = plan.plan_recommended;

              return (
                // @ts-ignore - Framer Motion variants type issue with ease property
                <motion.div
                  key={index}
                  variants={pricingCardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={index}
                  className={cn(
                    "relative flex-1 flex flex-col w-full",
                    isFeatured && "z-10 scale-102"
                  )}
                >
                  {/* GRADIENT BORDER */}
                  {isFeatured && (
                    <div className="absolute -inset-0.5 rounded-2xl overflow-hidden">
                      {/* Animated conic-gradient border */}
                      <div className="absolute -inset-full blur-xs animate-spin animation-duration-[2s] bg-conic from-blue-500 via-red-500 to-teal-400" />

                      {/* Inner mask */}
                      <div className="absolute inset-0.5 rounded-2xl bg-card" />
                    </div>
                  )}

                  {/* CARD */}
                  <Card
                    className={cn(
                      "relative flex-1 flex flex-col rounded-2xl p-8 gap-8",
                      isFeatured ? "border-0 ring-0" : "border border-border"
                    )}
                  >
                    <CardHeader className="p-0">
                      <div className="flex flex-col gap-3 self-stretch">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-2xl font-medium text-primary">
                            {plan.plan_name}
                          </CardTitle>
                          {isFeatured && (
                            <Badge className="py-1 px-3 text-sm font-medium leading-5 w-fit h-7 flex items-center gap-1.5 [&>svg]:size-4!">
                              <Flame size={16} /> Recommend
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-base font-normal max-w-2x">
                          {plan.plan_descp}
                        </CardDescription>
                      </div>
                    </CardHeader>

                    <CardContent className="flex flex-col flex-1 gap-8 p-0">
                      {/* Price with blur spoiler effect */}
                      <div className="relative flex items-baseline gap-1 min-h-[60px]">
                        <span className="text-foreground text-4xl sm:text-5xl font-medium blur-sm select-none">
                          $XX,XXX
                        </span>
                        <span className="text-muted-foreground text-base font-normal blur-sm select-none">
                          /month
                        </span>
                        <div className="absolute inset-0 flex items-center justify-start">
                          <span className="text-sm font-medium text-primary bg-background px-3 py-1 rounded-full border border-border">
                            Request for Pricing
                          </span>
                        </div>
                      </div>

                      <Separator orientation="horizontal" />

                      <ul className="flex flex-col gap-4 flex-1">
                        {plan.plan_feature.map((feature, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-3 text-base font-normal text-muted-foreground"
                          >
                            <Check className="size-4 text-primary shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <Button
                        className="w-full h-12 cursor-pointer"
                        variant={isFeatured ? "default" : "outline"}
                        onClick={() => setShowAccessDialog(true)}
                      >
                        Request Access
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Access Request Dialog */}
      <AlertDialog open={showAccessDialog} onOpenChange={setShowAccessDialog}>
        <AlertDialogContent className="sm:max-w-md p-4 font-poppins">
          <button
            onClick={() => setShowAccessDialog(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-lg font-medium mb-6">
              Get in Touch
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="flex flex-row gap-3 items-center">
            <button
              onClick={() => {
                router.push("/newlanding/contact");
                setShowAccessDialog(false);
              }}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-black hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Image src="/gmail.svg" alt="Email" width={20} height={20} />
              Email
            </button>

            <button
              onClick={() => {
                const phoneNumber = "919959194453";
                const message = encodeURIComponent("Hi! I'm interested in Certiflo pricing and would like to request access.");
                window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
                setShowAccessDialog(false);
              }}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-black hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Image src="/whatsapp-icon.svg" alt="WhatsApp" width={20} height={20} />
              WhatsApp
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default Pricing;
