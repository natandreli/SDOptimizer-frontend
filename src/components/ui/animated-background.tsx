export const AnimatedBackground = () => {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8ca7c91f_1px,transparent_1px),linear-gradient(to_bottom,#8ca7c933_1px,transparent_1px)] bg-[size:3.25rem_3.25rem]" />
      <div className="absolute inset-y-0 left-[8%] w-px bg-rose-300/35" />
    </div>
  )
}
