export default async function NotAdmin() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <p className="text-sm text-gray-500">You must be an organization admin to create a new subscription or change an existing one.</p>
    </div>
  );
}
