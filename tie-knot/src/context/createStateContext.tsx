import { createContext, useContext, ReactNode } from "react";

export function createStateContext<State, InitialValue>(
  useValue: (initialValue: InitialValue) => State,
) {
  const StateContext = createContext<State | null>(null);

  const StateProvider = ({
    initialValue,
    children,
  }: {
    initialValue: InitialValue;
    children: ReactNode;
  }) => (
    <StateContext.Provider value={useValue(initialValue)}>
      {children}
    </StateContext.Provider>
  );

  const useContextState = () => {
    const value = useContext(StateContext);
    if (!value) throw new Error("Provider is missing!");
    return value;
  };

  return [StateProvider, useContextState] as const;
}
