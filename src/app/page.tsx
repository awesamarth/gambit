import Board from "@/components/Board";
import Image from "next/image";

export default function Home() {
  return (
    <div className="grid place-content-center h-screen ">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
       <Board />
      </main>
    </div>
  );
}
