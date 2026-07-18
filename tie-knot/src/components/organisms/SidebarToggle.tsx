"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/atoms/breadcrumb";
import { SidebarTrigger } from "@/components/atoms/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useMemo } from "react";

const HIDDEN_SEGMENTS = new Set(["admin"]);

const SidebarToggle = () => {
  const pathName = usePathname();

  const breadcrumbs = useMemo(() => {
    const segments = pathName.split("/").filter(Boolean);

    const visible = segments.filter((seg) => !HIDDEN_SEGMENTS.has(seg));

    return [
      ...visible.map((seg) => ({
        label: seg.toUpperCase(),
        href: "/" + segments.slice(0, segments.indexOf(seg) + 1).join("/"),
      })),
    ];
  }, [pathName]);

  return (
    <header className="flex items-center gap-2">
      <SidebarTrigger />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((value, idx) => (
            <Fragment key={value.label}>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={value.href}>{value.label}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumbs.length - 1 !== idx && <BreadcrumbSeparator />}
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
};

export default SidebarToggle;
