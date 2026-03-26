export function DeveloperAvatar({ name }: { name: string }) {
  return (
    <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-b from-blue-100 to-blue-200 font-semibold text-blue-800">
      {name.charAt(0)}
    </div>
  )
}
