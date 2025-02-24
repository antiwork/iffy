import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TotalsSkeleton() {
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total moderations</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-[100px]" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total flagged</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-[100px]" />
        </CardContent>
      </Card>
    </>
  );
}

export function ChartSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row dark:border-zinc-700">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Moderations</CardTitle>
          <Skeleton className="h-4 w-[120px]" />
        </div>
        <div className="flex">
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6 dark:border-zinc-700">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6 dark:border-zinc-700">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <Skeleton className="h-[250px] w-full" />
      </CardContent>
    </Card>
  );
}
