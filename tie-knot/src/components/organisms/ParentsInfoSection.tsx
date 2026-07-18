"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/atoms/collapsible";
import BankField from "@/components/organisms/fields/BankField";
import TextField from "@/components/organisms/fields/TextField";
import { ChevronDown } from "lucide-react";
import { TypographyH3, TypographySmall } from "@/components/atoms/typoqraphy";
import type { ICoupleInfo } from "@/models/coupleInfo.model";

import { useState } from "react";

type ParentRole = "father" | "mother";

const PARENTS: { id: ParentRole; title: string }[] = [
  { id: "father", title: "아버님" },
  { id: "mother", title: "어머님" },
];

type ParentsInfoSectionProps = {
  data?: Pick<ICoupleInfo, "groom" | "bride">;
};

export function ParentsInfoSection({ data }: ParentsInfoSectionProps) {
  const [groomParentsOpen, setGroomParentsOpen] = useState(false);
  const [brideParentsOpen, setBrideParentsOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>혼주 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Groom Parents */}
        <Collapsible open={groomParentsOpen} onOpenChange={setGroomParentsOpen}>
          <CollapsibleTrigger className="bg-muted/50 hover:bg-muted flex w-full items-center justify-between rounded-lg p-4 transition-colors">
            <TypographyH3 className="text-foreground font-semibold">신랑측 혼주 정보</TypographyH3>
            <ChevronDown
              className={`text-muted-foreground h-5 w-5 transition-transform ${
                groomParentsOpen ? "rotate-180" : ""
              }`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="space-y-6 px-4">
              {PARENTS.map((parent) => (
                <div className="space-y-4" key={parent.id}>
                  <TypographySmall className="text-muted-foreground font-medium">
                    {parent.title}
                  </TypographySmall>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      placeholder="이름"
                      id={`groomParents.${parent.id}.name`}
                      name={`groom_parents_${parent.id}_name`}
                      type="text"
                      defaultValue={data?.groom?.[parent.id]?.name}
                    >
                      이름
                    </TextField>
                    <TextField
                      id={`groomParents.${parent.id}.phone`}
                      name={`groom_parents_${parent.id}_phone`}
                      type="tel"
                      placeholder="010-1234-5678"
                      defaultValue={data?.groom?.[parent.id]?.phone}
                    >
                      연락처
                    </TextField>
                    <div className="col-span-2">
                      <BankField
                        id={`groom_parents_${parent.id}`}
                        defaultBankName={data?.groom?.[parent.id]?.bankName}
                        defaultAccountNumber={
                          data?.groom?.[parent.id]?.accountNumber
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Bride Parents */}
        <Collapsible open={brideParentsOpen} onOpenChange={setBrideParentsOpen}>
          <CollapsibleTrigger className="bg-muted/50 hover:bg-muted flex w-full items-center justify-between rounded-lg p-4 transition-colors">
            <TypographyH3 className="text-foreground font-semibold">신부측 혼주 정보</TypographyH3>
            <ChevronDown
              className={`text-muted-foreground h-5 w-5 transition-transform ${
                brideParentsOpen ? "rotate-180" : ""
              }`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="space-y-6 px-4">
              {PARENTS.map((parent) => (
                <div className="space-y-4" key={parent.id}>
                  <TypographySmall className="text-muted-foreground font-medium">
                    {parent.title}
                  </TypographySmall>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      placeholder="이름"
                      id={`brideParents.${parent.id}.name`}
                      name={`bride_parents_${parent.id}_name`}
                      type="text"
                      defaultValue={data?.bride?.[parent.id]?.name}
                    >
                      이름
                    </TextField>
                    <TextField
                      id={`brideParents.${parent.id}.phone`}
                      name={`bride_parents_${parent.id}_phone`}
                      type="tel"
                      placeholder="010-1234-5678"
                      defaultValue={data?.bride?.[parent.id]?.phone}
                    >
                      연락처
                    </TextField>
                    <div className="col-span-2">
                      <BankField
                        id={`bride_parents_${parent.id}`}
                        defaultBankName={data?.bride?.[parent.id]?.bankName}
                        defaultAccountNumber={
                          data?.bride?.[parent.id]?.accountNumber
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
