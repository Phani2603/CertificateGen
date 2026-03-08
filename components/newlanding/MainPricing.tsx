"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Check, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type PricingPlan = {
  plan_bg_color: string;
  plan_name: string;
  plan_descp: string;
  plan_price: number;
  plan_feature: string[];
};

const pricingData: PricingPlan[] = [
  {
    plan_bg_color: "bg-blue-500/10",
    plan_name: "Starter",
    plan_descp: "Perfect for small teams and events. Get started with essential features.",
    plan_price: 1500,
    plan_feature: [
      "Up to 500 certificates/month",
      "Basic certificate templates",
      "Email delivery system",
      "Certificate verification portal",
      "Community support",
      "Standard security features",
    ],
  },
  {
    plan_bg_color: "bg-teal-400/20",
    plan_name: "Professional",
    plan_descp: "Scale faster with advanced features, templates, and priority support.",
    plan_price: 2500,
    plan_feature: [
      "Up to 5,000 certificates/month",
      "Custom certificate templates",
      "Advanced analytics dashboard",
      "Bulk upload & generation",
      "Priority email support",
      "API access & webhooks",
    ],
  },
];

const Pricing = () => {
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const router = useRouter();

  // @ts-ignore - Framer Motion variants type issue with ease property
  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 80,
    },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.2,
        duration: 0.6,
        ease: [0.42, 0, 0.58, 1] as any,
      },
    }),
  };

  return (
    <section className="py-10 xl:py-0">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 xl:px-16 lg:py-20 sm:py-16 py-8">
        <div className="flex flex-col gap-8 md:gap-12 justify-center items-center w-full">
          {/* Heading */}
          <div className="flex flex-col gap-4 justify-center items-center animate-in fade-in slide-in-from-top-8 duration-700 ease-in-out">
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
                Pick the plan that fits your start-up
              </h2>
            </div>
          </div>
          {/* Pricing Plans */}
          <div className="flex flex-col lg:flex-row items-center justify-center grow gap-6 w-full">
            {pricingData?.map((items: PricingPlan, index: number) => (
              // @ts-ignore - Framer Motion variants type issue with ease property
              <motion.div
                key={index}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={index}
                className="w-full sm:w-fit"
              >
                <Card
                  className={cn(
                    items.plan_bg_color,
                    "p-2 sm:p-3 rounded-2xl ring-0 w-full sm:w-fit",
                  )}
                  key={index}
                >
                  <CardContent className="flex flex-col sm:flex-row gap-4 md:gap-6 items-start self-stretch px-0 h-full w-full">
                    <div className="flex flex-col items-start justify-between self-stretch gap-6">
                      <div className="flex flex-col gap-3">
                        <Badge className="py-1 px-3 text-sm font-normal leading-5 w-fit h-7">
                          {items.plan_name}
                        </Badge>
                        <p className="text-sm font-normal text-muted-foreground max-w-56">
                          {items.plan_descp}
                        </p>
                      </div>
                      <div className="flex flex-col gap-4">
                        {/* Price with blur spoiler effect */}
                        <div className="relative flex items-baseline gap-1 min-h-[60px]">
                          <span className="text-4xl sm:text-5xl font-semibold blur-sm select-none">
                            ₹XX,XXX
                          </span>
                          <span className="text-base font-normal text-muted-foreground blur-sm select-none">
                            /month
                          </span>
                        </div>
                        <Button 
                          className="relative bg-white hover:bg-white hover:text-black dark:hover:text-black text-black text-sm font-medium rounded-full h-12 p-1 ps-6 pe-14 group transition-all duration-500 hover:ps-14 hover:pe-6 w-fit overflow-hidden cursor-pointer"
                          onClick={() => setShowAccessDialog(true)}
                        >
                          <span className="relative z-10 transition-all duration-500">
                            Request Access
                          </span>
                          <div className="absolute right-1 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45">
                            <ArrowUpRight size={16} />
                          </div>
                        </Button>
                      </div>
                    </div>
                    <Separator
                      orientation="vertical"
                      className="hidden sm:block"
                    />
                    <Separator
                      orientation="horizontal"
                      className="sm:hidden block"
                    />
                    <div className="flex flex-col items-start gap-3 grow">
                      <p className="text-card-foreground text-base sm:text-xl font-normal sm:font-medium">
                        Features
                      </p>
                      <ul className="flex flex-col items-start self-stretch gap-3">
                        {items.plan_feature?.map(
                          (feature: string, index: number) => {
                            return (
                              <li
                                key={index}
                                className="flex items-center gap-3 text-card-foreground text-base font-normal tracking-normal"
                              >
                                <Check size={16} aria-hidden="true" />
                                {feature}
                              </li>
                            );
                          },
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

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
          <div className="flex flex-row gap-3 max-w-md text-sm items-center">
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
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
