export default async function NotAdmin() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <p className="text-sm text-gray-500">Please ask your organization admin to set up a subscription</p>
    </div>
  );
}
