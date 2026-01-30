import { cn } from "@/lib/utils";

export function Separator({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "relative flex h-8 w-full items-center justify-center overflow-hidden",
                className
            )}
        >
            <div
                className={cn(
                    "absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-gray-400",

                    // diagonal dashed overlay
                    "before:absolute before:-left-[100vw] before:-z-1 before:h-8 before:w-[200vw]",

                    // diagonal dash pattern (slightly darker)
                    "before:bg-[repeating-linear-gradient(315deg,#d1d5db_0,#d1d5db_1.25px,transparent_0,transparent_50%)]",

                    // control dash density
                    "before:bg-[length:10px_10px]"
                )}
            />
        </div>
    );
}

export function SectionSeparator({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "h-px w-full dashed-x-custom my-0 sm:my-0",
                className
            )}
        />
    );
}
