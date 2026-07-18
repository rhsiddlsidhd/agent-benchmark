import {
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/atoms/command";
import clsx from "clsx";
import React from "react";

type SuggestionListProps = {
  suggestions: string[];
  isOpen: boolean;
  onSelect: (name: string) => void;
};

const AutoCompleteList = ({
  suggestions,
  isOpen,
  onSelect,
}: SuggestionListProps) => {
  return (
    <CommandList
      className={clsx(
        "absolute top-12 right-0 left-0 z-10 rounded-md border bg-white shadow-sm",
        isOpen && suggestions.length > 0
          ? "opacity-100"
          : "pointer-events-none opacity-0",
      )}
    >
      <CommandGroup heading="Suggestions">
        {suggestions.map((name) => (
          <CommandItem key={name} onSelect={() => onSelect(name)}>
            {name}
          </CommandItem>
        ))}
      </CommandGroup>
    </CommandList>
  );
};

export default AutoCompleteList;
