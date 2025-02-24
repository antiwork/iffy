"use client";

import Image from "next/image";
import { useState } from "react";
import iffy from "./iffy.png";

export function IffyImage() {
  const [clicked, setClicked] = useState(false);

  return (
    <div className="relative">
      <Image
        src={iffy}
        alt="Iffy"
        className={`w-full cursor-pointer transition-all duration-300 will-change-transform ${clicked ? "" : "blur-xl hover:blur-lg"}`}
        onClick={() => setClicked(true)}
      />
      {!clicked && <div className="mt-2 text-gray-800 uppercase">Click to moderate</div>}
      {clicked && <div className="mt-2 text-green-500 uppercase">Compliant</div>}
    </div>
  );
}
