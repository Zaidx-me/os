"use client";

import dynamic from "next/dynamic";

const OsDialogHost = dynamic(() => import("@/components/os/OsDialogHost"), { ssr: false });
const OsToastHost = dynamic(() => import("@/components/os/OsToastHost"), { ssr: false });

/** Global OS services mounted once per shell (desktop + mobile). */
export default function OsServices() {
  return (
    <>
      <OsDialogHost />
      <OsToastHost />
    </>
  );
}
