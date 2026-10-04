import Image from "next/image";

export function AppTitle() {
  return (
    <h1 className="mb-14 flex items-center justify-center gap-2 text-[2.5rem] leading-none font-bold tracking-tight text-white">
      <Image
        src="/icons/mallo-iljeong-icon.svg"
        alt=""
        width={40}
        height={40}
        className="size-10 shrink-0"
        priority
      />
      말로일정
    </h1>
  );
}
