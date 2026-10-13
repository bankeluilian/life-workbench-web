interface Window {
  workbench: {
    navigate(page: string, updateHash?: boolean): void;
    openRecord(tab?: string): void;
  };
}
